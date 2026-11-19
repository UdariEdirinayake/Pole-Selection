"""Integration tests for POST /api/engine/sag-tension endpoint."""
import pytest
from app.database import SessionLocal
from app.models import User, Project
from app.auth import hash_password, create_access_token
from app.api.engine import compute_sag_tension, SagTensionRequest, compute_clearances, ClearancesRequest


@pytest.fixture
def auth_context():
    """Ensure a test user and sample project exist in the isolated test database."""
    db = SessionLocal()
    user = db.query(User).filter(User.email == "engine_test@pole-select.local").first()
    if not user:
        user = User(email="engine_test@pole-select.local", password_hash=hash_password("Pass123!"), role="designer")
        db.add(user)
        db.commit()
        db.refresh(user)

    project = db.query(Project).filter(Project.name == "Sample 11kV + LV Overhead Line").first()
    db.close()
    return user, project


def test_sag_tension_endpoint(auth_context):
    """Directly test compute_sag_tension endpoint execution."""
    user, project = auth_context
    assert project is not None, "Sample project not found in test DB"

    db = SessionLocal()
    try:
        req = SagTensionRequest(project_id=project.id)
        res = compute_sag_tension(req, current_user=user, db=db)

        assert res.project_id == project.id
        assert len(res.conductor_tension_check) >= 2

        # Section 1 checks
        s1 = next(item for item in res.conductor_tension_check if item.section == 1 and "11kV" in item.circuit)
        assert s1.equivalent_span_m == 32.8
        assert s1.tension_15c_wind_kn == 5.252
        assert s1.pct_uts_at_15c_wind == 35.0
        assert s1.max_stress_check == "OK"
        assert s1.tension_27c_kn == 3.152
        assert s1.pct_uts_at_27c == 21.0
        assert s1.eds_check == "NOT ASSESSED"  # Defaults to NOT ASSESSED as required

        # Section 2 checks
        s2 = next(item for item in res.conductor_tension_check if item.section == 2 and "11kV" in item.circuit)
        assert s2.equivalent_span_m == 30.5
        assert s2.tension_15c_wind_kn == 5.173
        assert s2.pct_uts_at_15c_wind == 34.5
        assert s2.max_stress_check == "OK"
        assert s2.tension_27c_kn == 3.152
        assert s2.pct_uts_at_27c == 21.0

        # Sag schedule: exactly 13 poles
        assert len(res.sag_schedule) == 13
        p1 = res.sag_schedule[0]
        assert p1.pole_no == 1
        assert p1.sag_27c_m == 0.414
        assert p1.sag_65c_m == 0.563

        # Pole 13 (fore span = 0) uses aft span (25.0m) via get_pole_sag_span_m rule
        p13 = res.sag_schedule[12]
        assert p13.pole_no == 13
        assert p13.fore_span_m == 0.0
        assert p13.sag_27c_m == 0.306
    finally:
        db.close()


def test_clearances_endpoint(auth_context):
    """Test POST /api/engine/clearances for the sample line project with explicit inputs."""
    user, project = auth_context
    assert project is not None, "Sample project not found in test DB"

    db = SessionLocal()
    try:
        # Explicit test inputs (not in Excel master data)
        req = ClearancesRequest(
            project_id=project.id,
            attachment_height_below_pole_top_m=1.047,  # back-calculated from result.pdf, source pending
            vertical_spacing_11kv_lv_m=1.454,          # back-calculated from result.pdf, source pending
        )
        res = compute_clearances(req, current_user=user, db=db)

        assert res.project_id == project.id
        assert abs(res.attachment_height_m - 8.120) < 0.001
        assert res.attachment_height_below_pole_top_m == 1.047
        assert res.vertical_spacing_11kv_lv_m == 1.454
        assert res.line_voltage_kv == 11.0
        assert res.embedment_ratio is not None

        # 13 poles in both lists
        assert len(res.phase_separation) == 13
        assert len(res.ground_clearance) == 13

        # Phase separation: all 12 non-terminal poles (poles 1–12) should PASS
        for item in res.phase_separation:
            if item.pole_no <= 12:
                assert item.separation_check == "PASS", (
                    f"Pole {item.pole_no}: expected PASS, got {item.separation_check}"
                )

        # Spot check pole 1
        p1_sep = next(i for i in res.phase_separation if i.pole_no == 1)
        assert p1_sep.required_separation_m == 0.569
        assert p1_sep.separation_actual_m == 1.092
        assert p1_sep.max_angle_deg == 117

        # Spot check pole 7 (large angle 40°)
        p7_sep = next(i for i in res.phase_separation if i.pole_no == 7)
        assert p7_sep.theta_start_deg == 40.0
        assert p7_sep.separation_actual_m == 1.034

        # Ground clearance: all 13 poles SATISFIED
        for item in res.ground_clearance:
            assert item.ground_clearance_check == "SATISFIED", (
                f"Pole {item.pole_no}: ground_clearance_check expected SATISFIED"
            )
            assert item.circuit_clearance_check == "SATISFIED", (
                f"Pole {item.pole_no}: circuit_clearance_check expected SATISFIED"
            )

        # Spot check pole 1 ground clearance: 8.120 - 0.563 = 7.557
        p1_gc = next(i for i in res.ground_clearance if i.pole_no == 1)
        assert abs(p1_gc.lowest_clearance_m - 7.557) < 0.001

        # Applicable clearance = 5.50 m
        assert p1_gc.applicable_clearance_m == 5.50

        # Circuit clearance actual = 1.454 m, required = 1.20 m
        assert p1_gc.min_vert_clear_m == 1.454
        assert p1_gc.req_vert_clear_m == 1.20

    finally:
        db.close()


def test_clearances_endpoint_missing_inputs_returns_not_assessed(auth_context):
    """Test that missing explicit project inputs fail closed and return NOT ASSESSED with reason 'input needed'."""
    user, project = auth_context
    assert project is not None, "Sample project not found in test DB"

    db = SessionLocal()
    try:
        # Request with NO attachment_height_below_pole_top_m and NO vertical_spacing_11kv_lv_m
        req = ClearancesRequest(project_id=project.id)
        res = compute_clearances(req, current_user=user, db=db)

        assert res.attachment_height_m is None
        assert res.attachment_height_below_pole_top_m is None
        assert res.vertical_spacing_11kv_lv_m is None

        for item in res.ground_clearance:
            assert item.ground_clearance_check == "NOT ASSESSED", (
                f"Pole {item.pole_no}: expected NOT ASSESSED when attachment height is missing"
            )
            assert item.ground_clearance_reason == "input needed"
            assert item.lowest_clearance_m is None
            assert item.circuit_clearance_check == "NOT ASSESSED", (
                f"Pole {item.pole_no}: expected NOT ASSESSED when vertical spacing is missing"
            )
            assert item.circuit_clearance_reason == "input needed"
            assert item.min_vert_clear_m is None
    finally:
        db.close()
