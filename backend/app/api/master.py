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
    elif hasattr(model, "dataset_version_id"):
        # Default to latest dataset version so queries don't mix rows across multiple imports
        latest_v = db.query(DatasetVersion.id).order_by(DatasetVersion.id.desc()).first()
        if latest_v:
            query = query.filter(model.dataset_version_id == latest_v[0])

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


@router.put("/{table}/{item_id}")
def update_master_table_item(
    table: str,
    item_id: int,
    payload: dict[str, Any],
    db: Session = Depends(get_db),
):
    """Update a specific row in a master data table with updated engineering parameters."""
    table_lower = table.lower()
    if table_lower not in TABLE_MAP:
        raise HTTPException(
            status_code=404,
            detail=f"Master table '{table}' not found. Available tables: {list(TABLE_MAP.keys())}"
        )

    model = TABLE_MAP[table_lower]
    item = db.query(model).filter(model.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"Item with id {item_id} not found in table '{table}'."
        )

    # Protect immutable identity fields
    protected_fields = {"id", "dataset_version_id", "created_at"}

    for key, val in payload.items():
        if key not in protected_fields and hasattr(item, key):
            # If empty string passed for a numeric or optional field, convert to None
            if val == "":
                val = None
            setattr(item, key, val)

    db.commit()
    db.refresh(item)

    d = {}
    for col in item.__table__.columns:
        v = getattr(item, col.name)
        if hasattr(v, "isoformat"):
            v = v.isoformat()
        d[col.name] = v

    return {
        "table": table,
        "message": f"Row {item_id} updated successfully.",
        "item": d,
    }
