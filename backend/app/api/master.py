from fastapi import APIRouter, Depends, HTTPException, Query, Body
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
    version_id: int | None = None,
    needs_confirmation: bool | None = None,
    table_id: str | None = None,
    limit: int = 500,
    offset: int = 0,
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

    if table_id is not None and hasattr(model, "table_id"):
        query = query.filter(model.table_id == table_id)

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
    payload: dict[str, Any] = Body(...),
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

    # Sync calculated unit fields where applicable
    if hasattr(item, "capacity_dan") and hasattr(item, "capacity_kn") and getattr(item, "capacity_dan") is not None:
        item.capacity_kn = item.capacity_dan / 100.0
    if hasattr(item, "weight_kg") and hasattr(item, "weight_n") and getattr(item, "weight_kg") is not None:
        item.weight_n = item.weight_kg * 9.80665
    if hasattr(item, "working_load_dan") and hasattr(item, "working_load_kn") and getattr(item, "working_load_dan") is not None:
        item.working_load_kn = item.working_load_dan / 100.0

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


@router.post("/{table}", status_code=201)
def create_master_table_item(
    table: str,
    payload: dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
):
    """Add a new row to a master construction data table."""
    table_lower = table.lower()
    if table_lower not in TABLE_MAP:
        raise HTTPException(
            status_code=404,
            detail=f"Master table '{table}' not found. Available tables: {list(TABLE_MAP.keys())}"
        )

    model = TABLE_MAP[table_lower]

    # Get latest dataset version ID if model needs it
    dataset_version_id = payload.get("dataset_version_id")
    if not dataset_version_id and hasattr(model, "dataset_version_id"):
        latest_v = db.query(DatasetVersion.id).order_by(DatasetVersion.id.desc()).first()
        dataset_version_id = latest_v[0] if latest_v else 1

    item_data = {}
    for col in model.__table__.columns:
        if col.name == "id":
            continue
        if col.name == "dataset_version_id":
            item_data["dataset_version_id"] = dataset_version_id
        elif col.name == "source_sheet":
            item_data["source_sheet"] = payload.get("source_sheet", "USER_ADDED")
        elif col.name == "source_row":
            item_data["source_row"] = payload.get("source_row", 0)
        elif col.name == "needs_confirmation":
            item_data["needs_confirmation"] = payload.get("needs_confirmation", False)
        elif col.name in payload:
            val = payload[col.name]
            if val == "":
                val = None
            item_data[col.name] = val
        elif not col.nullable and col.default is None and col.server_default is None:
            # Fallbacks for non-nullable master columns
            if col.name == "mount_type":
                item_data["mount_type"] = payload.get("mount_type", "Normal")
            elif col.name == "table_id":
                item_data["table_id"] = payload.get("table_id", "UQ")
            elif col.name == "span_m":
                item_data["span_m"] = 0.0
            elif col.name == "soil_class_num":
                item_data["soil_class_num"] = 1
            elif col.name == "height_m":
                item_data["height_m"] = 10.0
            elif col.name == "class_label":
                item_data["class_label"] = "Standard"
            elif col.name == "code":
                item_data["code"] = "SW1"
            elif col.name == "parameter_name":
                item_data["parameter_name"] = "NEW_PARAM"

    # Auto-calculate explicit converted units if applicable
    if "capacity_dan" in item_data and item_data["capacity_dan"] is not None and hasattr(model, "capacity_kn"):
        item_data["capacity_kn"] = float(item_data["capacity_dan"]) / 100.0
        item_data["capacity_kn_unit"] = "kN"
    if "weight_kg" in item_data and item_data["weight_kg"] is not None and hasattr(model, "weight_n"):
        item_data["weight_n"] = float(item_data["weight_kg"]) * 9.80665
        item_data["weight_n_unit"] = "N"
    if "working_load_dan" in item_data and item_data["working_load_dan"] is not None and hasattr(model, "working_load_kn"):
        item_data["working_load_kn"] = float(item_data["working_load_dan"]) / 100.0
        item_data["working_load_kn_unit"] = "kN"

    new_item = model(**item_data)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    d = {}
    for col in new_item.__table__.columns:
        v = getattr(new_item, col.name)
        if hasattr(v, "isoformat"):
            v = v.isoformat()
        d[col.name] = v

    return {
        "table": table,
        "message": f"New record added to '{table}' successfully.",
        "item": d,
    }


@router.delete("/{table}/{item_id}")
def delete_master_table_item(
    table: str,
    item_id: int,
    db: Session = Depends(get_db),
):
    """Delete a row from a master construction data table."""
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

    db.delete(item)
    db.commit()

    return {
        "table": table,
        "message": f"Record ID {item_id} deleted successfully from '{table}'.",
    }

