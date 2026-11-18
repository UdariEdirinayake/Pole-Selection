from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Any

from app.database import get_db
from app.models import (
    DatasetVersion,
    Conductor,
    SpanTensionPoint,
    PoleCapacity,
    GuyWire,
    SoilClass,
    Equipment,
    Insulator,
    CrossarmConfig,
    GroundClearance,
    StructureClearance,
    CircuitClearance,
    DesignParameter,
    SampleLinePole,
)

router = APIRouter(prefix="/api/master", tags=["Master Data"])

TABLE_MAP = {
    "dataset-versions": DatasetVersion,
    "conductors": Conductor,
    "conductor": Conductor,
    "span-tension-points": SpanTensionPoint,
    "span_tension_point": SpanTensionPoint,
    "pole-capacities": PoleCapacity,
    "pole_capacity": PoleCapacity,
    "guy-wires": GuyWire,
    "guy_wire": GuyWire,
    "soil-classes": SoilClass,
    "soil_class": SoilClass,
    "equipment": Equipment,
    "insulators": Insulator,
    "insulator": Insulator,
    "crossarm-configs": CrossarmConfig,
    "crossarm_config": CrossarmConfig,
    "ground-clearances": GroundClearance,
    "ground_clearance": GroundClearance,
    "structure-clearances": StructureClearance,
    "structure_clearance": StructureClearance,
    "circuit-clearances": CircuitClearance,
    "circuit_clearance": CircuitClearance,
    "design-parameters": DesignParameter,
    "design_parameter": DesignParameter,
    "sample-line-poles": SampleLinePole,
    "sample_line_pole": SampleLinePole,
}


@router.get("/dataset-versions")
def get_dataset_versions(db: Session = Depends(get_db)):
    """Retrieve all imported dataset versions."""
    versions = db.query(DatasetVersion).order_by(DatasetVersion.id.desc()).all()
    return [
        {
            "id": v.id,
            "name": v.name,
            "imported_at": v.imported_at.isoformat() if v.imported_at else None,
            "source_file": v.source_file,
            "file_hash": v.file_hash,
        }
        for v in versions
    ]


@router.get("/{table}")
def get_master_table_data(
    table: str,
    version_id: int | None = Query(None, description="Optional dataset_version_id filter"),
    needs_confirmation: bool | None = Query(None, description="Filter by needs_confirmation"),
    limit: int = Query(500, le=1000, description="Max rows to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
):
    """Read-only API endpoint to query master data tables with filtering and confirmation tracking."""
    table_lower = table.lower()
    if table_lower not in TABLE_MAP:
        raise HTTPException(
            status_code=404,
            detail=f"Master table '{table}' not found. Available tables: {list(TABLE_MAP.keys())}"
        )

    model = TABLE_MAP[table_lower]
    query = db.query(model)

    if version_id is not None and hasattr(model, "dataset_version_id"):
        query = query.filter(model.dataset_version_id == version_id)

    if needs_confirmation is not None and hasattr(model, "needs_confirmation"):
        query = query.filter(model.needs_confirmation == needs_confirmation)

    total_count = query.count()
    rows = query.offset(offset).limit(limit).all()

    items = []
    for r in rows:
        d = {}
        for col in r.__table__.columns:
            val = getattr(r, col.name)
            if hasattr(val, "isoformat"):
                val = val.isoformat()
            d[col.name] = val
        items.append(d)

    return {
        "table": table,
        "total": total_count,
        "offset": offset,
        "limit": limit,
        "items": items,
    }
