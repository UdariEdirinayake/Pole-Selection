import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import User, Project
from app.auth import hash_password

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_users():
    db = SessionLocal()
    # Clean or ensure test users
    admin = db.query(User).filter(User.email == "test_admin@pole-select.local").first()
    if not admin:
        admin = User(email="test_admin@pole-select.local", password_hash=hash_password("Pass123!"), role="admin")
        db.add(admin)

    designer = db.query(User).filter(User.email == "test_designer@pole-select.local").first()
    if not designer:
        designer = User(email="test_designer@pole-select.local", password_hash=hash_password("Pass123!"), role="designer")
        db.add(designer)

    reviewer = db.query(User).filter(User.email == "test_reviewer@pole-select.local").first()
    if not reviewer:
        reviewer = User(email="test_reviewer@pole-select.local", password_hash=hash_password("Pass123!"), role="reviewer")
        db.add(reviewer)

    db.commit()
    db.close()


def test_auth_login_success(setup_users):
    res = client.post("/api/auth/login", json={"email": "test_designer@pole-select.local", "password": "Pass123!"})
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "test_designer@pole-select.local"
    assert data["role"] == "designer"
    assert "pole_select_token" in res.cookies


def test_auth_login_invalid_password(setup_users):
    res = client.post("/api/auth/login", json={"email": "test_designer@pole-select.local", "password": "WrongPassword!"})
    assert res.status_code == 401


def test_auth_me_with_cookie(setup_users):
    # 1. Login
    login_res = client.post("/api/auth/login", json={"email": "test_designer@pole-select.local", "password": "Pass123!"})
    token = login_res.cookies["pole_select_token"]

    # 2. Call /me with cookie
    me_res = client.get("/api/auth/me", cookies={"pole_select_token": token})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "test_designer@pole-select.local"


def test_auth_logout(setup_users):
    res = client.post("/api/auth/logout")
    assert res.status_code == 200


def test_role_enforcement(setup_users):
    # 1. Designer attempts to access admin-only endpoint -> 403 Forbidden
    login_designer = client.post("/api/auth/login", json={"email": "test_designer@pole-select.local", "password": "Pass123!"})
    designer_token = login_designer.cookies["pole_select_token"]
    res_forbidden = client.get("/api/auth/admin-only", cookies={"pole_select_token": designer_token})
    assert res_forbidden.status_code == 403

    # Designer attempts to access reviewer endpoint -> 403 Forbidden
    res_reviewer_forbidden = client.get("/api/auth/reviewer-check", cookies={"pole_select_token": designer_token})
    assert res_reviewer_forbidden.status_code == 403

    # 2. Reviewer accesses reviewer endpoint -> 200 OK
    login_reviewer = client.post("/api/auth/login", json={"email": "test_reviewer@pole-select.local", "password": "Pass123!"})
    reviewer_token = login_reviewer.cookies["pole_select_token"]
    res_reviewer_ok = client.get("/api/auth/reviewer-check", cookies={"pole_select_token": reviewer_token})
    assert res_reviewer_ok.status_code == 200
    assert res_reviewer_ok.json()["role"] == "reviewer"

    # Reviewer attempts to access admin-only endpoint -> 403 Forbidden
    res_admin_forbidden = client.get("/api/auth/admin-only", cookies={"pole_select_token": reviewer_token})
    assert res_admin_forbidden.status_code == 403

    # 3. Admin accesses admin-only endpoint -> 200 OK
    login_admin = client.post("/api/auth/login", json={"email": "test_admin@pole-select.local", "password": "Pass123!"})
    admin_token = login_admin.cookies["pole_select_token"]
    res_admin_ok = client.get("/api/auth/admin-only", cookies={"pole_select_token": admin_token})
    assert res_admin_ok.status_code == 200
    assert res_admin_ok.json()["role"] == "admin"

    # 4. Unauthenticated user (clear cookies) -> 401 Unauthorized
    client.cookies.clear()
    res_unauth = client.get("/api/auth/admin-only")
    assert res_unauth.status_code == 401


def test_project_crud(setup_users):
    # Login as designer
    login_res = client.post("/api/auth/login", json={"email": "test_designer@pole-select.local", "password": "Pass123!"})
    token = login_res.cookies["pole_select_token"]
    cookies = {"pole_select_token": token}

    # 1. Create project
    create_payload = {
        "name": "Test Overhead Feeder Line",
        "description": "Test description",
        "line_arrangement": "11 kV + LV",
        "circuits": [
            {
                "circuit_name": "C1 (11kV)",
                "nominal_voltage_kv": 11.0,
                "circuit_type": "Overhead ABC",
                "conductor_name": "70 mm² ABC"
            }
        ],
        "poles": [
            {
                "section": 1,
                "pole_no": 1,
                "pole_id_name": "P-01",
                "aft_span_m": 0.0,
                "fore_span_m": 30.0,
                "angle_deg": 0.0,
                "soil_class_num": 4,
                "span_environment": "across any road or street"
            },
            {
                "section": 1,
                "pole_no": 2,
                "pole_id_name": "P-02",
                "aft_span_m": 30.0,
                "fore_span_m": 35.0,
                "angle_deg": 5.0,
                "soil_class_num": 4,
                "span_environment": "across any road or street"
            }
        ]
    }
    res = client.post("/api/projects/", json=create_payload, cookies=cookies)
    assert res.status_code == 201
    proj_id = res.json()["id"]

    # 2. Get project details
    get_res = client.get(f"/api/projects/{proj_id}", cookies=cookies)
    assert get_res.status_code == 200
    pdata = get_res.json()
    assert pdata["name"] == "Test Overhead Feeder Line"
    assert len(pdata["circuits"]) == 1
    assert len(pdata["poles"]) == 2
    assert pdata["poles"][0]["fore_span_m"] == 30.0
    assert pdata["poles"][1]["aft_span_m"] == 30.0

    # 3. Update project
    update_res = client.put(f"/api/projects/{proj_id}", json={"name": "Updated Feeder Line"}, cookies=cookies)
    assert update_res.status_code == 200

    # 4. Delete project
    del_res = client.delete(f"/api/projects/{proj_id}", cookies=cookies)
    assert del_res.status_code == 200


def test_sample_results_endpoint(setup_users):
    login_res = client.post("/api/auth/login", json={"email": "test_designer@pole-select.local", "password": "Pass123!"})
    token = login_res.cookies["pole_select_token"]
    cookies = {"pole_select_token": token}

    res = client.get("/api/results/sample", cookies=cookies)
    assert res.status_code == 200
    data = res.json()
    assert "Sample data – not a live calculation" in data["banner"]
    assert "pole_summary" in data["data"]
    assert "structural_loading" in data["data"]
    assert "foundation_soil_bearing" in data["data"]
    assert "ground_clearance" in data["data"]
    assert "phase_separation" in data["data"]
    assert "sag_schedule_27" in data["data"]

    # Check that missing columns are shown as "Pending"
    first_load = data["data"]["structural_loading"][0]
    assert first_load["pole_top_loads"] == "Pending"
    assert first_load["buckling_capacity"] == "Pending"
