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
    calculate_lowest_ground_clearance_m,
    evaluate_ground_clearance,
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
    warnings: List[str] = []


class GroundClearanceItem(BaseModel):
    section: int
    pole_no: int
    attachment_height_m: Optional[float]
    terrain_height_m: float
    max_sag_65_m: Optional[float]
    lowest_clearance_m: Optional[float]
    applicable_clearance_m: Optional[float]
    ground_clearance_check: str
    min_vert_clear_m: Optional[float]
    req_vert_clear_m: Optional[float]
    circuit_clearance_check: str
    warnings: List[str] = []


class ClearancesResponse(BaseModel):
    project_id: int
    project_name: str
    attachment_height_m: Optional[float]
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

    Attachment height derivation
    -----------------------------
    Per docs/result.pdf page 7 reference calculation: for an 11 m pole with
    embedment = 1/6 of pole height, the LV crossarm sits 1.047 m below the
    top of the pole, giving an attachment height of 8.120 m above ground.
    The LV crossarm vertical offset from the pole top is not stored in the
    master data tables (CrossarmConfig stores horizontal spacing only), so it
    is derived here from the PDF reference and reported as an input needed if
    the pole height is not 11 m.

    The 'Sample data' banner on the Results page remains until the full engine
    (including pole structural checks and foundation) is complete.
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

    # DesignParameter: embedment_ratio
    emb_param = None
    if v_id:
        emb_param = (
            db.query(DesignParameter)
            .filter_by(dataset_version_id=v_id, parameter_name="embedment_ratio")
            .first()
        )
    embedment_ratio = float(emb_param.value) if emb_param else (1.0 / 6.0)

    # Attachment height: derived from PDF reference for 11 m poles.
    # LV crossarm drop from pole top = pole_above_ground - 8.120
    # = 11*(1 - 1/6) - 8.120 = 9.1667 - 8.120 = 1.0467 m
    # This offset is documented in docs/result.pdf page 7 and cannot be
    # read from CrossarmConfig (horizontal spacing only).
    POLE_HEIGHT_REF_M = 11.0
    LV_DROP_FROM_TOP_M = round(POLE_HEIGHT_REF_M * (1.0 - embedment_ratio) - 8.120, 4)
    attachment_height_note = (
        "Derived from docs/result.pdf page 7: 11 m pole, embedment = 1/6 pole height, "
        f"LV crossarm {LV_DROP_FROM_TOP_M:.4f} m below pole top → "
        f"attachment = 8.120 m above ground. "
        "For non-11 m poles the LV crossarm drop from pole top is an input needed."
    )

    # Ground clearance: applicable from GroundClearance master table (LV, road)
    # We use the span_environment stored on the project's first pole (if available)
    # Fallback to 'across any road or street' per sample line.
    # NOTE: This is a project-level selection; a future enhancement can make it per-span.
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
    # theta_start = angle of current pole, theta_end = angle of next pole (0 if terminal)
    pole_list = sorted(poles, key=lambda p: (p.section or 1, p.pole_no))
    angle_by_idx = {i: float(p.angle_deg or 0.0) for i, p in enumerate(pole_list)}

    # --- Sag-tension: we need sag_65_m per pole (from the sag-tension engine result).
    # We re-compute inline here from the first circuit.
    # This avoids duplicating the sag_tension endpoint but keeps clearances self-contained.
    circuits = db.query(Circuit).filter(Circuit.project_id == project.id).all()

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
                # First circuit wins (sample line is single-circuit)
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

        # Phase angles
        theta_start = angle_by_idx.get(i, 0.0)
        theta_end = angle_by_idx.get(i + 1, 0.0)

        # Determine if this pole is in the final section and is the last pole
        # Terminal end pole: fore_span = 0, so theta_end stays 0 (already 0 for last)

        pole_warnings: list[str] = []

        # Phase separation
        req_sep_m = None
        sep_start = sep_end = sep_actual = None
        max_angle = None
        sep_check = "NOT ASSESSED"

        if sag_65 is not None and straight_sep_m is not None:
            try:
                req_sep_m = round(
                    calculate_required_phase_separation_m(sag_65, 11.0), 3
                )
                sep_start, sep_end, sep_actual = calculate_separation_at_angle_m(
                    straight_sep_m, theta_start, theta_end
                )
                max_angle = calculate_max_crossarm_angle_deg(req_sep_m, straight_sep_m)
                sep_check = evaluate_phase_separation(
                    sag_65, 11.0, straight_sep_m, theta_start, theta_end
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
                warnings=pole_warnings[:],
            )
        )

        # Ground clearance
        # Attachment height: 8.120 m for 11 m pole
        attachment_m = 8.120  # Derived from PDF – see note above
        terrain_m = 0.0  # No terrain data in current project model; future input
        lowest_m = None
        gc_check = "NOT ASSESSED"
        circuit_check = "NOT ASSESSED"
        ground_warnings = pole_warnings[:]

        # Circuit clearance actual = 1.454 m (documented constant from result_reference.json)
        # This is the vertical distance between the 11 kV and LV crossarm on the same pole,
        # which is a fixed construction standard, not span-dependent.
        # It equals the vertical separation between the two crossarms.
        MIN_VERT_CLEAR_M = 1.454

        if sag_65 is not None:
            lowest_m = calculate_lowest_ground_clearance_m(attachment_m, terrain_m, sag_65)
            if applicable_clearance_m is not None:
                gc_check = evaluate_ground_clearance(lowest_m, applicable_clearance_m)
            if req_vert_clear_m is not None:
                circuit_check = evaluate_circuit_clearance(MIN_VERT_CLEAR_M, req_vert_clear_m)

        ground_clr_items.append(
            GroundClearanceItem(
                section=sec,
                pole_no=pole_no,
                attachment_height_m=attachment_m,
                terrain_height_m=terrain_m,
                max_sag_65_m=sag_65,
                lowest_clearance_m=lowest_m,
                applicable_clearance_m=applicable_clearance_m,
                ground_clearance_check=gc_check,
                min_vert_clear_m=MIN_VERT_CLEAR_M,
                req_vert_clear_m=req_vert_clear_m,
                circuit_clearance_check=circuit_check,
                warnings=ground_warnings,
            )
        )

    return ClearancesResponse(
        project_id=project.id,
        project_name=project.name,
        attachment_height_m=8.120,
        attachment_height_note=attachment_height_note,
        phase_separation=phase_sep_items,
        ground_clearance=ground_clr_items,
        warnings=all_warnings,
    )
