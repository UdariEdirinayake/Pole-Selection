from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from app.database import get_db
from app.models import Project, Circuit, Pole, User, SampleLinePole, DatasetVersion
from app.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["Projects"])


class CircuitCreate(BaseModel):
    circuit_name: str
    nominal_voltage_kv: float
    circuit_type: str
    conductor_code: Optional[int] = None
    conductor_name: Optional[str] = None
    lookup_table: Optional[str] = None


class PoleCreate(BaseModel):
    section: int = 1
    pole_no: int
    pole_id_name: Optional[str] = None
    aft_span_m: float = 0.0
    fore_span_m: float = 0.0
    angle_deg: float = 0.0
    soil_class_num: int = 4
    equipment: Optional[str] = None
    span_environment: str = "across any road or street"


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    line_arrangement: str = "11 kV + LV"
    circuits: List[CircuitCreate] = []
    poles: List[PoleCreate] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    line_arrangement: Optional[str] = None
    status: Optional[str] = None
    circuits: Optional[List[CircuitCreate]] = None
    poles: Optional[List[PoleCreate]] = None


@router.get("/")
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List projects accessible to the user (all projects for designers/reviewers/admins)."""
    query = db.query(Project)
    if current_user.role not in ("admin", "designer", "reviewer"):
        query = query.filter(Project.owner_id == current_user.id)
    projects = query.order_by(Project.updated_at.desc()).all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "line_arrangement": p.line_arrangement,
            "status": p.status,
            "owner_id": p.owner_id,
            "created_at": p.created_at.isoformat() if p.created_at else None,
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            "pole_count": len(p.poles),
            "circuit_count": len(p.circuits),
        }
        for p in projects
    ]


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_project(data: ProjectCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new project with optional circuits and pole schedule."""
    project = Project(
        name=data.name,
        description=data.description,
        line_arrangement=data.line_arrangement,
        owner_id=current_user.id,
        status="Not calculated",
    )
    db.add(project)
    db.flush()

    for c in data.circuits:
        c_obj = Circuit(
            project_id=project.id,
            circuit_name=c.circuit_name,
            nominal_voltage_kv=c.nominal_voltage_kv,
            circuit_type=c.circuit_type,
            conductor_code=c.conductor_code,
            conductor_name=c.conductor_name,
            lookup_table=c.lookup_table,
        )
        db.add(c_obj)

    for p in data.poles:
        p_obj = Pole(
            project_id=project.id,
            section=p.section,
            pole_no=p.pole_no,
            pole_id_name=p.pole_id_name or f"Pole {p.pole_no}",
            aft_span_m=p.aft_span_m,
            fore_span_m=p.fore_span_m,
            angle_deg=p.angle_deg,
            soil_class_num=p.soil_class_num,
            equipment=p.equipment,
            span_environment=p.span_environment,
        )
        db.add(p_obj)

    db.commit()
    db.refresh(project)
    return {"id": project.id, "message": "Project created successfully"}


@router.get("/seed-sample")
def seed_sample_project(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Seed sample project populated from sample_line_pole (Poles 1-13)."""
    # Check if user already has a sample project
    existing = db.query(Project).filter(Project.owner_id == current_user.id, Project.name == "Sample 11kV + LV Overhead Line").first()
    if existing:
        return {"id": existing.id, "message": "Sample project already exists"}

    sample_project = Project(
        name="Sample 11kV + LV Overhead Line",
        description="Demo line project with poles 1–13 transcribed from master sample schedule",
        line_arrangement="11 kV + LV",
        owner_id=current_user.id,
        status="Not calculated",
    )
    db.add(sample_project)
    db.flush()

    # Add default circuits - both use 70+16+N50 bundled conductor (LV) with table UQ matching docs/result.pdf
    db.add(Circuit(
        project_id=sample_project.id,
        circuit_name="C1 (11kV)",
        nominal_voltage_kv=11.0,
        circuit_type="Overhead ABC",
        conductor_code=1,
        conductor_name="70+16+N50 bundled conductor (LV)",
        lookup_table="UQ"
    ))
    db.add(Circuit(
        project_id=sample_project.id,
        circuit_name="C2 (LV)",
        nominal_voltage_kv=0.4,
        circuit_type="Overhead ABC",
        conductor_code=1,
        conductor_name="70+16+N50 bundled conductor (LV)",
        lookup_table="UQ"
    ))

    # Pull sample line poles from database
    latest_v = db.query(DatasetVersion).order_by(DatasetVersion.id.desc()).first()
    sample_poles = []
    if latest_v:
        sample_poles = db.query(SampleLinePole).filter_by(dataset_version_id=latest_v.id).order_by(SampleLinePole.pole_no).all()

    if sample_poles:
        for sp in sample_poles:
            db.add(Pole(
                project_id=sample_project.id,
                section=sp.section or 1,
                pole_no=sp.pole_no,
                pole_id_name=f"Pole {sp.pole_no}",
                aft_span_m=sp.aft_span_m or 0.0,
                fore_span_m=sp.fore_span_m or 0.0,
                angle_deg=sp.angle_deg or 0.0,
                soil_class_num=sp.soil_class_num or 4,
                equipment=sp.equipment,
                span_environment=sp.span_environment or "across any road or street",
            ))
    else:
        # Fallback to standard 13 poles if sample_line_pole table is empty
        fallback_data = [
            (1, 1, 0, 29, 0, 4, None),
            (1, 2, 29, 34, 14, 4, None),
            (1, 3, 34, 29, 4, 4, None),
            (1, 4, 29, 33, 4, 4, "TF - 160kVA"),
            (1, 5, 33, 31, 2, 4, None),
            (1, 6, 31, 38, 5, 4, None),
            (2, 7, 38, 37, 40, 4, None),
            (2, 8, 37, 30, 4, 4, None),
            (2, 9, 30, 24, 15, 4, None),
            (2, 10, 24, 35, 8, 4, None),
            (2, 11, 35, 23, 2, 4, None),
            (2, 12, 23, 25, 5, 4, None),
            (2, 13, 25, 0, 0, 4, None),
        ]
        for sec, pno, aft, fore, ang, sclass, eq in fallback_data:
            db.add(Pole(
                project_id=sample_project.id,
                section=sec,
                pole_no=pno,
                pole_id_name=f"Pole {pno}",
                aft_span_m=float(aft),
                fore_span_m=float(fore),
                angle_deg=float(ang),
                soil_class_num=sclass,
                equipment=eq,
                span_environment="across any road or street",
            ))

    db.commit()
    return {"id": sample_project.id, "message": "Sample project created successfully"}


@router.get("/{project_id}")
def get_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve full project details with circuits and poles."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role not in ("admin", "designer", "reviewer") and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")

    return {
        "id": project.id,
        "name": project.name,
        "description": project.description,
        "line_arrangement": project.line_arrangement,
        "status": project.status,
        "owner_id": project.owner_id,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        "circuits": [
            {
                "id": c.id,
                "circuit_name": c.circuit_name,
                "nominal_voltage_kv": c.nominal_voltage_kv,
                "circuit_type": c.circuit_type,
                "conductor_code": c.conductor_code,
                "conductor_name": c.conductor_name,
                "lookup_table": c.lookup_table,
            }
            for c in project.circuits
        ],
        "poles": [
            {
                "id": p.id,
                "section": p.section,
                "pole_no": p.pole_no,
                "pole_id_name": p.pole_id_name,
                "aft_span_m": p.aft_span_m,
                "fore_span_m": p.fore_span_m,
                "angle_deg": p.angle_deg,
                "soil_class_num": p.soil_class_num,
                "equipment": p.equipment,
                "span_environment": p.span_environment,
            }
            for p in sorted(project.poles, key=lambda x: x.pole_no)
        ],
    }


@router.put("/{project_id}")
def update_project(project_id: int, data: ProjectUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update project metadata, circuits, and poles."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role not in ("admin", "designer", "reviewer") and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")

    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.line_arrangement is not None:
        project.line_arrangement = data.line_arrangement
    if data.status is not None:
        project.status = data.status

    if data.circuits is not None:
        db.query(Circuit).filter(Circuit.project_id == project.id).delete()
        for c in data.circuits:
            db.add(Circuit(
                project_id=project.id,
                circuit_name=c.circuit_name,
                nominal_voltage_kv=c.nominal_voltage_kv,
                circuit_type=c.circuit_type,
                conductor_code=c.conductor_code,
                conductor_name=c.conductor_name,
                lookup_table=c.lookup_table,
            ))

    if data.poles is not None:
        db.query(Pole).filter(Pole.project_id == project.id).delete()
        for p in data.poles:
            db.add(Pole(
                project_id=project.id,
                section=p.section,
                pole_no=p.pole_no,
                pole_id_name=p.pole_id_name or f"Pole {p.pole_no}",
                aft_span_m=p.aft_span_m,
                fore_span_m=p.fore_span_m,
                angle_deg=p.angle_deg,
                soil_class_num=p.soil_class_num,
                equipment=p.equipment,
                span_environment=p.span_environment,
            ))

    db.commit()
    return {"message": "Project updated successfully"}


@router.delete("/{project_id}")
def delete_project(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a project."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if current_user.role not in ("admin", "designer", "reviewer") and project.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
