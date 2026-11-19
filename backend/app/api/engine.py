"""Sag-Tension Engine API endpoints connecting backend database to pure Python pole_engine."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, Project, Circuit, Pole, SpanTensionPoint, Conductor, DatasetVersion,
    CrossarmConfig, GroundClearance, CircuitClearance, DesignParameter,
)
from pole_engine.sag_tension import (
    TableLookupPoint,
    calculate_equivalent_span_m,
    lookup_sag_tension_table,
    get_pole_sag_span_m,
    scale_sag_to_actual_span_m,
    calculate_tension_pct_of_uts,
    default_eds_assessment,
    assess_max_stress_15c_wind,
)
from pole_engine.clearances import (
    calculate_required_phase_separation_m,
    calculate_separation_at_angle_m,
    calculate_max_crossarm_angle_deg,
    evaluate_phase_separation,
    calculate_attachment_height_above_ground_m,
    calculate_lowest_ground_clearance_m,
    assess_ground_clearance,
    evaluate_ground_clearance,
    assess_circuit_clearance,
    evaluate_circuit_clearance,
)

router = APIRouter(prefix="/api/engine", tags=["Calculation Engine"])


class SagTensionRequest(BaseModel):
    project_id: int


class TensionCheckItem(BaseModel):
    section: int
    circuit: str
    conductor: str
    lookup_table: str
    equivalent_span_m: float
    tension_15c_wind_kn: float
    pct_uts_at_15c_wind: float
    max_stress_check: str
    tension_27c_kn: float
    pct_uts_at_27c: float
    eds_check: str
    uts_kn: float


class SagItem(BaseModel):
    section: int
    pole_no: int
    fore_span_m: float
    sag_27c_m: float
    sag_65c_m: float


class SagTensionResponse(BaseModel):
    project_id: int
    project_name: str
    method: str = "LECO Standard (Sag-Tension Charts with Linear Interpolation)"
    conductor_tension_check: List[TensionCheckItem]
    sag_schedule: List[SagItem]
    warnings: List[str]


@router.post("/sag-tension", response_model=SagTensionResponse)
def compute_sag_tension(
    req: SagTensionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Execute sag-tension calculations for a project across all strain sections and circuits."""
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {req.project_id} not found."
        )

    circuits = db.query(Circuit).filter(Circuit.project_id == project.id).all()
    if not circuits:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project '{project.name}' has no configured circuits."
        )

    poles = db.query(Pole).filter(Pole.project_id == project.id).order_by(Pole.section, Pole.pole_no).all()
    if not poles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project '{project.name}' has no route poles."
        )

    # Get latest dataset version for master table lookup
    latest_v = db.query(DatasetVersion).order_by(DatasetVersion.id.desc()).first()
    v_id = latest_v.id if latest_v else None

    # Group poles by section
    sections_map = {}
    for p in poles:
        sec = p.section or 1
        sections_map.setdefault(sec, []).append(p)

    all_tension_checks = []
    all_sags = []
    all_warnings = []

    for circuit in circuits:
        # Load conductor data
        conductor = None
        if v_id and circuit.conductor_code:
            conductor = db.query(Conductor).filter_by(dataset_version_id=v_id, code=circuit.conductor_code).first()

        uts_kn = conductor.ultimate_tensile_strength_kn if conductor else 15.0
        lookup_table_id = circuit.lookup_table or "UQ"

        # Load lookup table points
        pts_query = db.query(SpanTensionPoint).filter_by(table_id=lookup_table_id)
        if v_id:
            pts_query = pts_query.filter_by(dataset_version_id=v_id)
        db_points = pts_query.order_by(SpanTensionPoint.span_m).all()

        if not db_points:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Lookup table '{lookup_table_id}' not found in master data for circuit '{circuit.circuit_name}'."
            )

        table_points = [
            TableLookupPoint(
                span_m=p.span_m,
                tension_15c_wind_kn=p.tension_kn,
                tension_27c_kn=p.tension_27_kn,
                sag_15c_m=p.sag_15_m,
                sag_27c_m=p.sag_27_m,
                sag_65c_m=p.sag_65_m,
                needs_confirmation=p.needs_confirmation or False,
                confirmation_note=p.confirmation_note,
            )
            for p in db_points
        ]

        for sec, sec_poles in sections_map.items():
            # Collect spans for ruling span calculation: fore_span of all spans > 0
            spans_m = [p.fore_span_m for p in sec_poles if p.fore_span_m and p.fore_span_m > 0]
            if not spans_m:
                continue

            eq_span_m = calculate_equivalent_span_m(spans_m)
            lookup_res = lookup_sag_tension_table(table_points, eq_span_m)

            if not lookup_res.is_assessed:
                all_warnings.append(f"Section {sec} {circuit.circuit_name}: {lookup_res.reason}")
                continue

            if lookup_res.warnings:
                all_warnings.extend(lookup_res.warnings)

            pct_15_wind = calculate_tension_pct_of_uts(lookup_res.tension_15c_wind_kn, uts_kn)
            pct_27 = calculate_tension_pct_of_uts(lookup_res.tension_27c_kn, uts_kn)

            max_stress_status = assess_max_stress_15c_wind(pct_15_wind, 40.0)
            eds_status = default_eds_assessment(pct_27, 20.0)

            all_tension_checks.append(
                TensionCheckItem(
                    section=sec,
                    circuit=circuit.circuit_name,
                    conductor=circuit.conductor_name or (conductor.description if conductor else "Conductor"),
                    lookup_table=lookup_table_id,
                    equivalent_span_m=round(eq_span_m, 1),
                    tension_15c_wind_kn=round(lookup_res.tension_15c_wind_kn, 3),
                    pct_uts_at_15c_wind=round(pct_15_wind, 1),
                    max_stress_check=max_stress_status,
                    tension_27c_kn=round(lookup_res.tension_27c_kn, 3),
                    pct_uts_at_27c=round(pct_27, 1),
                    eds_check=eds_status,
                    uts_kn=round(uts_kn, 2),
                )
            )

            # Sag schedule for poles in this section (only add once if multi-circuit or first circuit)
            if circuit == circuits[0]:
                for p in sec_poles:
                    # Pole sag span rule: use fore span, and aft span when fore span is 0 (terminal pole, e.g. Pole 13)
                    actual_span = get_pole_sag_span_m(p.fore_span_m or 0.0, p.aft_span_m or 0.0)
                    s27 = scale_sag_to_actual_span_m(lookup_res.sag_27c_m, actual_span, eq_span_m)
                    s65 = scale_sag_to_actual_span_m(lookup_res.sag_65c_m, actual_span, eq_span_m)

                    all_sags.append(
                        SagItem(
                            section=sec,
                            pole_no=p.pole_no,
                            fore_span_m=p.fore_span_m or 0.0,
                            sag_27c_m=round(s27, 3),
                            sag_65c_m=round(s65, 3),
                        )
                    )

    return SagTensionResponse(
        project_id=project.id,
        project_name=project.name,
        conductor_tension_check=all_tension_checks,
        sag_schedule=all_sags,
        warnings=all_warnings,
    )


# ---------------------------------------------------------------------------
# Phase 4B – Clearances and Phase Separation endpoint
# ---------------------------------------------------------------------------

class ClearancesRequest(BaseModel):
    project_id: int
    attachment_height_below_pole_top_m: Optional[float] = None
    vertical_spacing_11kv_lv_m: Optional[float] = None
    terrain_height_m: Optional[float] = None
    pole_height_m: Optional[float] = None


class PhaseSeparationItem(BaseModel):
    section: int
    pole_no: int
    sag_65_m: Optional[float]
    required_separation_m: Optional[float]
    crossarm_straight_m: Optional[float]
    theta_start_deg: Optional[float]
    theta_end_deg: Optional[float]
    separation_start_m: Optional[float]
    separation_end_m: Optional[float]
    separation_actual_m: Optional[float]
    max_angle_deg: Optional[int]
    separation_check: str
    separation_reason: Optional[str] = None
    warnings: List[str] = []


class GroundClearanceItem(BaseModel):
    section: int
    pole_no: int
    attachment_height_m: Optional[float]
    terrain_height_m: Optional[float] = None
    max_sag_65_m: Optional[float]
    lowest_clearance_m: Optional[float]
    applicable_clearance_m: Optional[float]
    ground_clearance_check: str
    ground_clearance_reason: Optional[str] = None
    min_vert_clear_m: Optional[float]
    req_vert_clear_m: Optional[float]
    circuit_clearance_check: str
    circuit_clearance_reason: Optional[str] = None
    warnings: List[str] = []


class ClearancesResponse(BaseModel):
    project_id: int
    project_name: str
    attachment_height_m: Optional[float] = None
    attachment_height_below_pole_top_m: Optional[float] = None
    vertical_spacing_11kv_lv_m: Optional[float] = None
    line_voltage_kv: Optional[float] = None
    embedment_ratio: Optional[float] = None
    attachment_height_note: str
    phase_separation: List[PhaseSeparationItem]
    ground_clearance: List[GroundClearanceItem]
    warnings: List[str]


@router.post("/clearances", response_model=ClearancesResponse)
def compute_clearances(
    req: ClearancesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Compute phase separation and ground/circuit clearances for all poles in a project.

    Engineering constraints (Phase 4B corrections):
    ------------------------------------------------
    1. 'attachment_height_below_pole_top_m' and 'vertical_spacing_11kv_lv_m'
       are explicit project inputs (in metres) with NO default.
       If missing, ground clearance and circuit clearance return NOT ASSESSED
       with the reason 'input needed'.
    2. Voltage V is taken from the selected circuit's nominal voltage band, NEVER a literal.
    3. Embedment ratio is loaded strictly from the design_parameter table, NEVER a literal.
    4. The 'Sample data' banner on Results remains until full engine integration is complete.
    """
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {req.project_id} not found.",
        )

    poles = (
        db.query(Pole)
        .filter(Pole.project_id == project.id)
        .order_by(Pole.section, Pole.pole_no)
        .all()
    )
    if not poles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project '{project.name}' has no route poles.",
        )

    # Resolve explicit project inputs (request overrides stored project inputs, no default)
    attachment_below_top_m = req.attachment_height_below_pole_top_m
    if attachment_below_top_m is None and getattr(project, "attachment_height_below_pole_top_m", None) is not None:
        attachment_below_top_m = project.attachment_height_below_pole_top_m

    vertical_spacing_m = req.vertical_spacing_11kv_lv_m
    if vertical_spacing_m is None and getattr(project, "vertical_spacing_11kv_lv_m", None) is not None:
        vertical_spacing_m = project.vertical_spacing_11kv_lv_m

    # terrain_height_m: explicit project input, no default; None → NOT ASSESSED for ground clearance
    terrain_height_m_input = req.terrain_height_m
    if terrain_height_m_input is None and getattr(project, "terrain_height_m", None) is not None:
        terrain_height_m_input = project.terrain_height_m
    # terrain_height_m_input remains None if not supplied → ground clearance returns NOT ASSESSED

    # Pole height: from request or default to 11.0 m (standard catalog pole for this line)
    pole_height_m = req.pole_height_m if req.pole_height_m is not None else 11.0

    # --- Load master data from latest dataset version ---
    latest_v = db.query(DatasetVersion).order_by(DatasetVersion.id.desc()).first()
    v_id = latest_v.id if latest_v else None

    # CrossarmConfig: P621-MS (config_no=10) has minimum_separation_m = 1.1
    crossarm_row = None
    if v_id:
        crossarm_row = (
            db.query(CrossarmConfig)
            .filter_by(dataset_version_id=v_id, config_no=10)
            .first()
        )
    straight_sep_m = crossarm_row.minimum_separation_m if crossarm_row else None

    # CircuitClearance: LV (lower) under 11kV (upper)
    cc_row = None
    if v_id:
        cc_row = (
            db.query(CircuitClearance)
            .filter_by(dataset_version_id=v_id, lower_band="LV", upper_band="11kV")
            .first()
        )
    req_vert_clear_m = cc_row.min_vertical_m if cc_row else None
    cc_warnings = []
    if cc_row and cc_row.needs_confirmation:
        cc_warnings.append(
            f"Circuit clearance row (LV under 11kV) is flagged needs_confirmation: "
            f"{cc_row.confirmation_note or 'confirm'}"
        )

    # DesignParameter: embedment_ratio loaded strictly from table, NEVER a literal
    emb_param = None
    if v_id:
        emb_param = (
            db.query(DesignParameter)
            .filter_by(dataset_version_id=v_id, parameter_name="embedment_ratio")
            .first()
        )
    embedment_ratio = float(emb_param.value) if emb_param else None

    # Attachment height calculation: pure calculation from explicit project inputs
    attachment_m = None
    if attachment_below_top_m is not None and embedment_ratio is not None and pole_height_m is not None:
        attachment_m = calculate_attachment_height_above_ground_m(
            pole_height_m=pole_height_m,
            embedment_ratio=embedment_ratio,
            attachment_height_below_pole_top_m=attachment_below_top_m,
        )
        attachment_height_note = (
            f"attachment_height = {pole_height_m}m * (1 - {embedment_ratio:.4f}) - "
            f"{attachment_below_top_m}m = {attachment_m:.3f}m above ground."
        )
    else:
        attachment_height_note = (
            "NOT ASSESSED: attachment height below pole top is an explicit project input needed (in metres) with no default."
        )

    # Ground clearance: applicable from GroundClearance master table (LV, road)
    gc_row = None
    if v_id:
        gc_row = (
            db.query(GroundClearance)
            .filter_by(dataset_version_id=v_id, voltage_band="LV",
                       environment="across any road or street")
            .first()
        )
    applicable_clearance_m = gc_row.min_clearance_m if gc_row else None

    # --- Build pole angle list for theta_start / theta_end lookup ---
    pole_list = sorted(poles, key=lambda p: (p.section or 1, p.pole_no))
    angle_by_idx = {i: float(p.angle_deg or 0.0) for i, p in enumerate(pole_list)}

    # --- Line voltage V taken strictly from selected circuit's nominal_voltage_kv, NEVER a literal ---
    circuits = db.query(Circuit).filter(Circuit.project_id == project.id).all()
    hv_circuit = next(
        (c for c in circuits if c.nominal_voltage_kv and c.nominal_voltage_kv >= 1.0),
        circuits[0] if circuits else None,
    )
    line_voltage_kv = float(hv_circuit.nominal_voltage_kv) if (hv_circuit and hv_circuit.nominal_voltage_kv) else None

    # Compute sag_65_m per pole
    sag_65_by_pole_no_section: dict[tuple[int, int], float | None] = {}

    for circuit in circuits:
        conductor = None
        if v_id and circuit.conductor_code:
            conductor = (
                db.query(Conductor)
                .filter_by(dataset_version_id=v_id, code=circuit.conductor_code)
                .first()
            )
        lookup_table_id = circuit.lookup_table or "UQ"
        pts_query = db.query(SpanTensionPoint).filter_by(table_id=lookup_table_id)
        if v_id:
            pts_query = pts_query.filter_by(dataset_version_id=v_id)
        db_points = pts_query.order_by(SpanTensionPoint.span_m).all()

        if not db_points:
            continue

        table_points = [
            TableLookupPoint(
                span_m=p.span_m,
                tension_15c_wind_kn=p.tension_kn,
                tension_27c_kn=p.tension_27_kn,
                sag_15c_m=p.sag_15_m,
                sag_27c_m=p.sag_27_m,
                sag_65c_m=p.sag_65_m,
                needs_confirmation=p.needs_confirmation or False,
                confirmation_note=p.confirmation_note,
            )
            for p in db_points
        ]

        # Group by section
        sections_map: dict[int, list] = {}
        for p in pole_list:
            sec = p.section or 1
            sections_map.setdefault(sec, []).append(p)

        for sec, sec_poles in sections_map.items():
            spans_m = [p.fore_span_m for p in sec_poles if p.fore_span_m and p.fore_span_m > 0]
            if not spans_m:
                continue
            eq_span_m = calculate_equivalent_span_m(spans_m)
            lookup_res = lookup_sag_tension_table(table_points, eq_span_m)
            if not lookup_res.is_assessed:
                continue

            for p in sec_poles:
                actual_span = get_pole_sag_span_m(p.fore_span_m or 0.0, p.aft_span_m or 0.0)
                s65 = scale_sag_to_actual_span_m(lookup_res.sag_65c_m, actual_span, eq_span_m)
                key = (p.section or 1, p.pole_no)
                if key not in sag_65_by_pole_no_section:
                    sag_65_by_pole_no_section[key] = round(s65, 3)

    # --- Compute clearances per pole ---
    phase_sep_items: list[PhaseSeparationItem] = []
    ground_clr_items: list[GroundClearanceItem] = []
    all_warnings: list[str] = []

    if cc_warnings:
        all_warnings.extend(cc_warnings)

    for i, p in enumerate(pole_list):
        sec = p.section or 1
        pole_no = p.pole_no
        key = (sec, pole_no)

        sag_65 = sag_65_by_pole_no_section.get(key)
        theta_start = angle_by_idx.get(i, 0.0)
        theta_end = angle_by_idx.get(i + 1, 0.0)

        pole_warnings: list[str] = []

        # 1. Phase separation
        req_sep_m = None
        sep_start = sep_end = sep_actual = None
        max_angle = None
        sep_check = "NOT ASSESSED"
        sep_reason = None

        if line_voltage_kv is None:
            sep_check = "NOT ASSESSED"
            sep_reason = "input needed"
            pole_warnings.append("Phase separation: input needed (line voltage missing from circuit)")
        elif sag_65 is not None and straight_sep_m is not None:
            try:
                req_sep_m = round(
                    calculate_required_phase_separation_m(sag_65, line_voltage_kv), 3
                )
                sep_start, sep_end, sep_actual = calculate_separation_at_angle_m(
                    straight_sep_m, theta_start, theta_end
                )
                max_angle = calculate_max_crossarm_angle_deg(req_sep_m, straight_sep_m)
                sep_check = evaluate_phase_separation(
                    sag_65, line_voltage_kv, straight_sep_m, theta_start, theta_end
                )
            except Exception as exc:
                pole_warnings.append(f"Phase separation error: {exc}")
        elif straight_sep_m is None:
            pole_warnings.append("CrossarmConfig config_no=10 not found in master data.")

        phase_sep_items.append(
            PhaseSeparationItem(
                section=sec,
                pole_no=pole_no,
                sag_65_m=sag_65,
                required_separation_m=req_sep_m,
                crossarm_straight_m=straight_sep_m,
                theta_start_deg=theta_start,
                theta_end_deg=theta_end,
                separation_start_m=sep_start,
                separation_end_m=sep_end,
                separation_actual_m=sep_actual,
                max_angle_deg=max_angle,
                separation_check=sep_check,
                separation_reason=sep_reason,
                warnings=pole_warnings[:],
            )
        )

        # 2. Ground clearance
        # terrain_height_m_input is None if not supplied; fail closed → NOT ASSESSED
        lowest_m = None
        gc_check = "NOT ASSESSED"
        gc_reason = None
        ground_warnings = pole_warnings[:]

        if attachment_below_top_m is None:
            gc_check = "NOT ASSESSED"
            gc_reason = "input needed"
            ground_warnings.append("Ground clearance: input needed (attachment height below pole top)")
        elif attachment_m is None:
            gc_check = "NOT ASSESSED"
            gc_reason = "input needed"
            ground_warnings.append("Ground clearance: input needed (embedment ratio missing from design parameters)")
        elif terrain_height_m_input is None:
            gc_check = "NOT ASSESSED"
            gc_reason = "input needed"
            ground_warnings.append("Ground clearance: input needed (terrain height)")
        elif sag_65 is not None:
            lowest_m = calculate_lowest_ground_clearance_m(attachment_m, terrain_height_m_input, sag_65)
            if applicable_clearance_m is not None:
                gc_check, gc_reason = assess_ground_clearance(lowest_m, applicable_clearance_m)
            else:
                gc_check = "NOT ASSESSED"
                gc_reason = "input needed"
                ground_warnings.append("Ground clearance: input needed (applicable clearance standard missing)")

        # 3. Circuit-to-circuit clearance
        min_vert_clear_m = None
        cc_check = "NOT ASSESSED"
        cc_reason = None

        if vertical_spacing_m is None:
            cc_check = "NOT ASSESSED"
            cc_reason = "input needed"
            ground_warnings.append("Circuit clearance: input needed (vertical spacing between the 11 kV and LV attachments)")
        else:
            min_vert_clear_m = vertical_spacing_m
            if req_vert_clear_m is not None:
                cc_check, cc_reason = assess_circuit_clearance(min_vert_clear_m, req_vert_clear_m)
            else:
                cc_check = "NOT ASSESSED"
                cc_reason = "input needed"
                ground_warnings.append("Circuit clearance: input needed (required circuit clearance missing from master data)")

        ground_clr_items.append(
            GroundClearanceItem(
                section=sec,
                pole_no=pole_no,
                attachment_height_m=attachment_m,
                terrain_height_m=terrain_height_m_input,
                max_sag_65_m=sag_65,
                lowest_clearance_m=lowest_m,
                applicable_clearance_m=applicable_clearance_m,
                ground_clearance_check=gc_check,
                ground_clearance_reason=gc_reason,
                min_vert_clear_m=min_vert_clear_m,
                req_vert_clear_m=req_vert_clear_m,
                circuit_clearance_check=cc_check,
                circuit_clearance_reason=cc_reason,
                warnings=ground_warnings,
            )
        )

    return ClearancesResponse(
        project_id=project.id,
        project_name=project.name,
        attachment_height_m=attachment_m,
        attachment_height_below_pole_top_m=attachment_below_top_m,
        vertical_spacing_11kv_lv_m=vertical_spacing_m,
        line_voltage_kv=line_voltage_kv,
        embedment_ratio=embedment_ratio,
        attachment_height_note=attachment_height_note,
        phase_separation=phase_sep_items,
        ground_clearance=ground_clr_items,
        warnings=all_warnings,
    )



class EngineRunRequest(BaseModel):
    project_id: int


@router.post("/run")
def run_full_engine(
    req: EngineRunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Execute complete ported calculation engine for a project."""
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with id {req.project_id} not found."
        )

    poles = db.query(Pole).filter(Pole.project_id == project.id).order_by(Pole.section, Pole.pole_no).all()
    if not poles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project '{project.name}' has no route poles."
        )

    from pole_engine.line import compute_line

    line_rows = []
    for p in poles:
        line_rows.append({
            "pole_no": p.pole_no,
            "section": p.section,
            "fore_span_m": p.fore_span_m or 0.0,
            "aft_span_m": p.aft_span_m or 0.0,
            "angle_deg": p.angle_deg or 0.0,
            "elev_delta_m": p.elev_delta_m or 0.0,
            "soil_class": p.soil_class or "Medium",
            "equipment": p.equipment or "",
            "transformer_kva": p.transformer_kva or 0,
            "span_environment": p.span_environment or "along or across any road or street",
        })

    # Prepare master data from active version
    active_version = db.query(DatasetVersion).filter(DatasetVersion.is_active == True).first()
    vid = active_version.id if active_version else None

    conductors_db = db.query(Conductor).filter(Conductor.dataset_version_id == vid).all() if vid else db.query(Conductor).all()
    conductors_data = [
        {
            "code": c.code,
            "description": c.description,
            "diameter_mm": c.diameter_mm,
            "weight_kg_m": c.weight_kg_m,
            "lookup_table": c.lookup_table,
            "UTS_daN": c.ultimate_tensile_strength_dan,
            "Modulus_of_Elasticity_kg_mm2": c.modulus_of_elasticity_kg_mm2,
            "Thermal_Expansion_Coefficient_/_°C": c.thermal_expansion_coefficient,
            "stress_area_mm2": c.stress_area_mm2,
        }
        for c in conductors_db
    ]

    from app.models import PoleCapacity, GuyWire, Insulator, SoilClass, StructureClearance
    capacities_db = db.query(PoleCapacity).filter(PoleCapacity.dataset_version_id == vid).all() if vid else db.query(PoleCapacity).all()
    capacities_data = [
        {
            "pole_height_m": c.height_m,
            "mount_type": c.mount_type,
            "class_label": c.class_label,
            "capacity_dan": c.capacity_dan,
            "capacity_daN": c.capacity_dan,
            "critical_buckling_kn": c.critical_buckling_kn,
            "critical_buckling_kN": c.critical_buckling_kn,
            "avg_breadth_m": c.avg_breadth_m,
            "below_gl_breadth_m": c.below_gl_breadth_m,
            "weight_kg": c.weight_kg,
            "footprint_mm": c.footprint_mm,
        }
        for c in capacities_db
    ]

    guy_wires_db = db.query(GuyWire).filter(GuyWire.dataset_version_id == vid).all() if vid else db.query(GuyWire).all()
    guy_wires_data = [
        {
            "code": g.code,
            "working_load_dan": g.working_load_dan,
            "working_load_daN": g.working_load_dan,
        }
        for g in guy_wires_db
    ]

    insulators_db = db.query(Insulator).filter(Insulator.dataset_version_id == vid).all() if vid else db.query(Insulator).all()
    insulators_data = [
        {
            "description": i.description,
            "voltage_level_kV": i.voltage_level_kv,
            "nominal_height_m": i.nominal_height_m,
            "cantilever_strength_kN": i.cantilever_strength_kn,
        }
        for i in insulators_db
    ]

    soil_db = db.query(SoilClass).filter(SoilClass.dataset_version_id == vid).all() if vid else db.query(SoilClass).all()
    soil_data = [
        {
            "class": s.soil_class,
            "subgrade_kN/m3": s.subgrade_modulus_kn_m3,
            "bearing_kNm2": s.bearing_capacity_kn_m2,
        }
        for s in soil_db
    ]

    tables_db = db.query(SpanTensionPoint).filter(SpanTensionPoint.dataset_version_id == vid).all() if vid else db.query(SpanTensionPoint).all()
    tables_data = [
        {
            "table_id": t.table_id,
            "span_m": t.span_m,
            "tension_kN": t.tension_15c_wind_kn,
            "tension_27_kN": t.tension_27c_kn,
            "sag_15c_m": t.sag_15c_m,
            "sag_27_m": t.sag_27c_m,
            "sag_65_m": t.sag_65c_m,
        }
        for t in tables_db
    ]

    gc_db = db.query(GroundClearance).filter(GroundClearance.dataset_version_id == vid).all() if vid else db.query(GroundClearance).all()
    gc_data = [
        {
            "voltage_band": g.voltage_band,
            "environment": g.environment,
            "min_clearance_m": g.min_clearance_m,
        }
        for g in gc_db
    ]

    cc_db = db.query(CircuitClearance).filter(CircuitClearance.dataset_version_id == vid).all() if vid else db.query(CircuitClearance).all()
    cc_data = [
        {
            "upper_band": c.upper_band,
            "lower_band": c.lower_band,
            "min_vertical_m": c.min_vertical_clearance_m,
        }
        for c in cc_db
    ]

    circuits = db.query(Circuit).filter(Circuit.project_id == project.id).all()
    conductor_h = next((c.conductor.code for c in circuits if "11" in c.voltage_band and c.conductor), "FLY")
    conductor_lv = next((c.conductor.code for c in circuits if "LV" in c.voltage_band and c.conductor), "LV_ABC")

    from app.models import PoleConfiguration
    configs_db = db.query(PoleConfiguration).filter(PoleConfiguration.dataset_version_id == vid).all() if vid else db.query(PoleConfiguration).all()
    configs_data = [
        {
            "config_no": c.config_no,
            "description": c.description,
            "pole_height_m": c.pole_height_m,
            "levels_HH": c.levels_33kv,
            "levels_H": c.levels_11kv,
            "levels_L": c.levels_lv,
            "heights_m": f"{c.height_33kv_m or ''};{c.height_11kv_m or ''};{c.height_lv_m or ''}".strip(";"),
            "n_per_level": "3;1" if (c.levels_11kv and c.levels_lv) else "3",
            "guy_h_m": 8.4,
            "tguy_h_m": 8.4
        }
        for c in configs_db
    ]
    if not configs_data:
        configs_data = [{
            "config_no": "3",
            "description": "11 kV + LV bundle",
            "pole_height_m": 11.0,
            "levels_HH": 0,
            "levels_H": 1,
            "levels_L": 1,
            "heights_m": "8.85;7.5",
            "n_per_level": "3;1",
            "guy_h_m": 8.4,
            "tguy_h_m": 8.4
        }]

    settings = {
        "config_no": configs_data[0]["config_no"],
        "conductor_H": conductor_h,
        "conductor_LV": conductor_lv,
        "wind_pressure_Nm2": 575.0,
        "wind_pole_Nm2": 865.0,
        "guy_wire_angle_deg": 30.0
    }

    data_payload = {
        "configs": configs_data,
        "conductors": conductors_data,
        "span_tension_tables": tables_data,
        "capacities": capacities_data,
        "guy_wires": guy_wires_data,
        "insulators": insulators_data,
        "soil_classes": soil_data,
        "ground_clearances": gc_data,
        "circuit_clearances": cc_data,
    }

    res = compute_line(line_rows, settings, data_payload)
    return {
        "project_id": project.id,
        "project_name": project.name,
        "calculation_results": res
    }
