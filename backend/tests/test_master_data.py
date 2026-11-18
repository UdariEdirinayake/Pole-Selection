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
        # Get latest dataset version
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


def test_idempotent_reimport_creates_new_version_without_duplicates():
    """Verify running importer again creates a distinct new version and leaves old data untouched."""
    db = SessionLocal()
    try:
        initial_version_count = db.query(DatasetVersion).count()
        new_v = import_excel_master(EXCEL_PATH)
        assert new_v.id is not None
        assert db.query(DatasetVersion).count() == initial_version_count + 1

        # Check records for new version
        new_cond_count = db.query(Conductor).filter_by(dataset_version_id=new_v.id).count()
        assert new_cond_count == 22
    finally:
        db.close()


def test_master_api_endpoints():
    """Verify GET /api/master/{table} and GET /api/master/dataset-versions."""
    # 1. Dataset versions endpoint
    res = client.get("/api/master/dataset-versions")
    assert res.status_code == 200
    versions = res.json()
    assert len(versions) >= 1
    assert "source_file" in versions[0]

    # 2. Conductors table
    res_cond = client.get("/api/master/conductors?limit=5")
    assert res_cond.status_code == 200
    data = res_cond.json()
    assert data["total"] >= 22
    assert len(data["items"]) == 5
    assert "needs_confirmation" in data["items"][0]

    # 3. Filter by needs_confirmation=true
    res_conf = client.get("/api/master/conductors?needs_confirmation=true")
    assert res_conf.status_code == 200
    conf_data = res_conf.json()
    assert conf_data["total"] >= 11
    for item in conf_data["items"]:
        assert item["needs_confirmation"] is True
