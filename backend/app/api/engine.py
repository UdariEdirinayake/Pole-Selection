"""Sag-Tension Engine API endpoints connecting backend database to pure Python pole_engine."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Project, Circuit, Pole, SpanTensionPoint, Conductor, DatasetVersion
from pole_engine.sag_tension import (
    TableLookupPoint,
    calculate_equivalent_span_m,
    lookup_sag_tension_table,
    scale_sag_to_actual_span_m,
    calculate_tension_pct_of_uts,
    default_eds_assessment,
    assess_max_stress_15c_wind,
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
                for idx, p in enumerate(sec_poles):
                    actual_span = p.fore_span_m or 0.0
                    # Terminal pole with span 0 takes previous span's sag
                    if actual_span <= 0 and idx > 0:
                        actual_span = sec_poles[idx - 1].fore_span_m or 0.0

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
