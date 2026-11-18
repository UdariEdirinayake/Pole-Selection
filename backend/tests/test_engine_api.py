"""Integration tests for POST /api/engine/sag-tension endpoint."""
import pytest
from app.database import SessionLocal
from app.models import User, Project
from app.auth import hash_password, create_access_token
from app.api.engine import compute_sag_tension, SagTensionRequest


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
    finally:
        db.close()
