import pytest
import os
from fastapi.testclient import TestClient

from app.main import app
from app.database import SessionLocal
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
from app.importers.excel_master import import_excel_master

client = TestClient(app)
EXCEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/source/LECO_Pole_Selection_Construction_Data.xlsx"))


def test_row_counts_match_excel():
    """Verify all 12 populated sheets match exact row counts."""
    db = SessionLocal()
    try:
        latest_version = db.query(DatasetVersion).order_by(DatasetVersion.id.desc()).first()
        assert latest_version is not None
        v_id = latest_version.id

        assert db.query(Conductor).filter_by(dataset_version_id=v_id).count() == 22
        assert db.query(SpanTensionPoint).filter_by(dataset_version_id=v_id).count() == 147
        assert db.query(Insulator).filter_by(dataset_version_id=v_id).count() == 4
        assert db.query(CrossarmConfig).filter_by(dataset_version_id=v_id).count() == 17
        assert db.query(Equipment).filter_by(dataset_version_id=v_id).count() == 8
        assert db.query(PoleCapacity).filter_by(dataset_version_id=v_id).count() == 44
        assert db.query(GuyWire).filter_by(dataset_version_id=v_id).count() == 4
        assert db.query(SoilClass).filter_by(dataset_version_id=v_id).count() == 5
        assert db.query(GroundClearance).filter_by(dataset_version_id=v_id).count() == 20
        assert db.query(StructureClearance).filter_by(dataset_version_id=v_id).count() == 7
        assert db.query(CircuitClearance).filter_by(dataset_version_id=v_id).count() == 21
        assert db.query(SampleLinePole).filter_by(dataset_version_id=v_id).count() == 13
        assert db.query(DesignParameter).filter_by(dataset_version_id=v_id).count() == 10
    finally:
        db.close()


def test_spot_check_known_values():
    """Spot-check 10 specific values including converted SI fields."""
    db = SessionLocal()
    try:
        latest = db.query(DatasetVersion).order_by(DatasetVersion.id.desc()).first()
        v_id = latest.id

        # 1. Conductor 1: UTS 1500 daN -> 15.0 kN
        c1 = db.query(Conductor).filter_by(dataset_version_id=v_id, code=1).first()
        assert c1 is not None
        assert c1.ultimate_tensile_strength_dan == 1500.0
        assert c1.ultimate_tensile_strength_kn == 15.0

        # 2. Conductor 7: diameter 21.1 mm -> 0.0211 m
        c7 = db.query(Conductor).filter_by(dataset_version_id=v_id, code=7).first()
        assert c7 is not None
        assert c7.diameter_mm == 21.1
        assert round(c7.diameter_m, 4) == 0.0211

        # 3. Pole capacity: 11 m, unguyed, '850 U' -> capacity_dan == 850.0 (8.5 kN)
        p850 = db.query(PoleCapacity).filter_by(
            dataset_version_id=v_id,
            height_m=11.0,
            mount_type="unguyed",
            class_label="850 U"
        ).first()
        assert p850 is not None
        assert p850.capacity_dan == 850.0
        assert p850.capacity_kn == 8.5

        # 4. Pole capacity: 9 m, unguyed, '200 U' -> weight 510 kg
        p200 = db.query(PoleCapacity).filter_by(
            dataset_version_id=v_id,
            height_m=9.0,
            mount_type="unguyed",
            class_label="200 U"
        ).first()
        assert p200 is not None
        assert p200.weight_kg == 510.0

        # 5. Soil class 4: subgrade 52500 kN/m3
        sc4 = db.query(SoilClass).filter_by(dataset_version_id=v_id, soil_class_num=4).first()
        assert sc4 is not None
        assert sc4.subgrade_kn_per_m3 == 52500.0
        assert sc4.bearing_min_kn_per_m2 == 150.0
        assert sc4.bearing_max_kn_per_m2 == 300.0

        # 6. Soil class 1: bearing 25 kN/m2
        sc1 = db.query(SoilClass).filter_by(dataset_version_id=v_id, soil_class_num=1).first()
        assert sc1 is not None
        assert sc1.bearing_min_kn_per_m2 == 25.0
        assert sc1.bearing_max_kn_per_m2 == 25.0

        # 7. Guy wire H: working load 5600 daN -> 56.0 kN, angle 30 deg
        gw_h = db.query(GuyWire).filter_by(dataset_version_id=v_id, code="H").first()
        assert gw_h is not None
        assert gw_h.working_load_dan == 5600.0
        assert gw_h.working_load_kn == 56.0
        assert gw_h.angle_deg == 30.0

        # 8. Equipment: TF - 160kVA -> weight 750 kg
        tf = db.query(Equipment).filter_by(dataset_version_id=v_id, equipment_name="TF - 160kVA").first()
        assert tf is not None
        assert tf.weight_kg == 750.0
        assert tf.area_m2 == 0.79968

        # 9. Cross-arm Config 1: left pin 0.85 m, right pin 0.95 m
        ca1 = db.query(CrossarmConfig).filter_by(dataset_version_id=v_id, config_no=1).first()
        assert ca1 is not None
        assert ca1.left_pin_to_middle_m == 0.85
        assert ca1.middle_pin_to_right_m == 0.95

        # 10. Design parameter: wind_conductor must be 575.0 N/m2 (confirmed by project owner, NOT 400)
        dp_wc = db.query(DesignParameter).filter_by(dataset_version_id=v_id, parameter_name="wind_conductor").first()
        assert dp_wc is not None
        assert dp_wc.value == 575.0
        assert dp_wc.status == "confirmed"
    finally:
        db.close()


def test_needs_value_rows_are_null_and_flagged():
    """Verify NEEDS_VALUE cells are stored as NULL with needs_confirmation=True."""
    db = SessionLocal()
    try:
        latest = db.query(DatasetVersion).order_by(DatasetVersion.id.desc()).first()
        v_id = latest.id

        # Conductor 12 (SWG 1) had 'NEEDS_VALUE' in everyday_tension_dan
        c12 = db.query(Conductor).filter_by(dataset_version_id=v_id, code=12).first()
        assert c12 is not None
        assert c12.everyday_tension_dan is None
        assert c12.everyday_tension_kn is None
        assert c12.needs_confirmation is True
        assert "NEEDS_VALUE" in c12.confirmation_note
    finally:
        db.close()


def test_span_tension_monotonicity_anomalies_flagged():
    """Verify known non-monotonic and anomaly cases in span-tension tables are flagged needs_confirmation=True:
    - UQ 65 m sag_15 (step 1.02m > 1.5x median)
    - UQ 45 m sag_15 (second difference deceleration / drop d2=-0.05m)
    - UD-2.74 55 m and 60 m sag_65 (equal values at neighbouring spans: 1.42 m)
    """
    db = SessionLocal()
    try:
        latest = db.query(DatasetVersion).order_by(DatasetVersion.id.desc()).first()
        v_id = latest.id

        # 1. UQ 65 m
        uq_65 = db.query(SpanTensionPoint).filter_by(dataset_version_id=v_id, table_id="UQ", span_m=65.0).first()
        assert uq_65 is not None
        assert uq_65.needs_confirmation is True
        assert "sag_15_m: step" in uq_65.confirmation_note
        assert "sag_15 = 3.0" or "sag_15" in uq_65.confirmation_note

        # 2. UQ 45 m
        uq_45 = db.query(SpanTensionPoint).filter_by(dataset_version_id=v_id, table_id="UQ", span_m=45.0).first()
        assert uq_45 is not None
        assert uq_45.needs_confirmation is True
        assert "sag_15_m: second difference drop" in uq_45.confirmation_note

        # 3. UD-2.74 55 m
        ud_55 = db.query(SpanTensionPoint).filter_by(dataset_version_id=v_id, table_id="UD-2.74", span_m=55.0).first()
        assert ud_55 is not None
        assert ud_55.needs_confirmation is True
        assert "sag_65_m: equal value to neighbouring span" in ud_55.confirmation_note

        # 4. UD-2.74 60 m
        ud_60 = db.query(SpanTensionPoint).filter_by(dataset_version_id=v_id, table_id="UD-2.74", span_m=60.0).first()
        assert ud_60 is not None
        assert ud_60.needs_confirmation is True
        assert "sag_65_m: equal value to neighbouring span" in ud_60.confirmation_note
    finally:
        db.close()


def test_idempotent_reimport_creates_new_version_without_duplicates():
    """Verify running importer again creates a distinct new version and leaves old data untouched."""
    db = SessionLocal()
    try:
        initial_version_count = db.query(DatasetVersion).count()
        new_v = import_excel_master(EXCEL_PATH)
        assert new_v.id is not None
        assert db.query(DatasetVersion).count() == initial_version_count + 1

        new_cond_count = db.query(Conductor).filter_by(dataset_version_id=new_v.id).count()
        assert new_cond_count == 22
    finally:
        db.close()


def test_master_api_endpoints():
    """Verify GET /api/master/{table} and GET /api/master/dataset-versions."""
    res = client.get("/api/master/dataset-versions")
    assert res.status_code == 200
    versions = res.json()
    assert len(versions) >= 1
    assert "source_file" in versions[0]

    res_cond = client.get("/api/master/conductors?limit=5")
    assert res_cond.status_code == 200
    data = res_cond.json()
    assert data["total"] >= 22
    assert len(data["items"]) == 5
    assert "needs_confirmation" in data["items"][0]

    res_conf = client.get("/api/master/conductors?needs_confirmation=true")
    assert res_conf.status_code == 200
    conf_data = res_conf.json()
    assert conf_data["total"] >= 11
    for item in conf_data["items"]:
        assert item["needs_confirmation"] is True


def test_master_crud_operations():
    """Verify POST, PUT, and DELETE on master construction data tables."""
    # 1. Create a new conductor record
    post_res = client.post(
        "/api/master/conductors",
        json={
            "description": "Test AAC Conductor 120mm2",
            "diameter_mm": 15.0,
            "weight_kg_per_m": 0.35,
            "ultimate_tensile_strength_kn": 22.5,
            "lookup_table": "UA-7.90",
        },
    )
    assert post_res.status_code == 201
    created = post_res.json()
    assert "item" in created
    item_id = created["item"]["id"]
    assert created["item"]["description"] == "Test AAC Conductor 120mm2"
    assert created["item"]["diameter_mm"] == 15.0

    # 2. Update the newly created record
    put_res = client.put(
        f"/api/master/conductors/{item_id}",
        json={
            "description": "Updated Test AAC Conductor 120mm2",
            "diameter_mm": 15.5,
        },
    )
    assert put_res.status_code == 200
    updated = put_res.json()
    assert updated["item"]["description"] == "Updated Test AAC Conductor 120mm2"
    assert updated["item"]["diameter_mm"] == 15.5

    # 3. Delete the record
    del_res = client.delete(f"/api/master/conductors/{item_id}")
    assert del_res.status_code == 200

    # 4. Confirm it is gone
    del_again = client.delete(f"/api/master/conductors/{item_id}")
    assert del_again.status_code == 404

    # 5. Create and delete a span-tension point
    st_post = client.post(
        "/api/master/span-tension-points",
        json={
            "table_id": "UQ",
            "span_m": 72.0,
            "tension_kn": 5.2,
            "tension_27_kn": 3.8,
            "sag_15_m": 0.85,
            "sag_27_m": 1.05,
            "sag_65_m": 1.45,
        },
    )
    assert st_post.status_code == 201
    st_id = st_post.json()["item"]["id"]
    st_del = client.delete(f"/api/master/span-tension-points/{st_id}")
    assert st_del.status_code == 200
