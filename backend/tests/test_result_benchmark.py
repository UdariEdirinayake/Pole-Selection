"""Benchmark unit tests validating sample_results.json and result_reference.json against docs/result.pdf.

Requirements from user engineering specification:
- Pole summary:
    1 11/500 H B
    2 11/1200 U A
    3 11/850 U A
    4 11/850 U A (TF-160kVA)
    5 11/500 U A
    6 11/850 U A
    7 11/500 M B
    8 11/850 U A
    9 11/1200 U A
    10 11/850 U A
    11 11/500 U A
    12 11/850 U A
    13 11/500 H B
- Foundation types are only A or B (never 'Type C', 'Deep/Pad', 'Reinforced').
- No invented statuses (remove any status not in the PDF).
- Compare fixture to docs/result_reference.json.
- Anything unreadable is 'Pending'.
- Sample line defaults: soil class 4, TF-160kVA at pole 4.
- Tests use a temporary database, never backend/pole_select.db.
"""
import os
import json
import pytest
from app.config import settings

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
REFERENCE_PATH = os.path.join(REPO_ROOT, "docs/result_reference.json")
FIXTURE_PATH = os.path.join(REPO_ROOT, "backend/fixtures/sample_results.json")
PROD_DB_FILE = os.path.abspath(os.path.join(REPO_ROOT, "backend/pole_select.db"))

EXPECTED_POLE_SUMMARY = [
    (1, "11/500 H", "Type B", "—"),
    (2, "11/1200 U", "Type A", "—"),
    (3, "11/850 U", "Type A", "—"),
    (4, "11/850 U", "Type A", "TF - 160kVA"),
    (5, "11/500 U", "Type A", "—"),
    (6, "11/850 U", "Type A", "—"),
    (7, "11/500 M", "Type B", "—"),
    (8, "11/850 U", "Type A", "—"),
    (9, "11/1200 U", "Type A", "—"),
    (10, "11/850 U", "Type A", "—"),
    (11, "11/500 U", "Type A", "—"),
    (12, "11/850 U", "Type A", "—"),
    (13, "11/500 H", "Type B", "—"),
]


def test_temporary_db_used_never_prod():
    """Verify tests strictly use an isolated temporary database, never backend/pole_select.db."""
    db_url = settings.DATABASE_URL
    assert "test_pole_select.db" in db_url
    assert PROD_DB_FILE not in db_url


def test_reference_file_exists_and_loads():
    """Verify docs/result_reference.json exists and is valid JSON."""
    assert os.path.exists(REFERENCE_PATH), f"Missing {REFERENCE_PATH}"
    with open(REFERENCE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert "pole_summary" in data
    assert "conductor_tension_check" in data
    assert "structural_loading" in data
    assert "foundation_soil_bearing" in data
    assert "ground_clearance" in data
    assert "phase_separation" in data
    assert "sag_schedule_27" in data


def test_fixture_matches_reference():
    """Verify backend/fixtures/sample_results.json strictly matches docs/result_reference.json."""
    with open(REFERENCE_PATH, "r", encoding="utf-8") as f:
        ref = json.load(f)
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        fix = json.load(f)

    for section in [
        "design_parameters",
        "pole_summary",
        "conductor_tension_check",
        "structural_loading",
        "foundation_soil_bearing",
        "ground_clearance",
        "phase_separation",
        "sag_schedule_27",
    ]:
        assert section in fix, f"Missing section '{section}' in sample_results.json"
        assert fix[section] == ref[section], f"Mismatch in section '{section}' between fixture and reference"


def test_pole_summary_matches_benchmark_specification():
    """Verify all 13 poles have exact pole rating, foundation Type A or B, and equipment TF-160kVA at Pole 4."""
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        fix = json.load(f)

    poles = fix["pole_summary"]
    assert len(poles) == 13

    for p, (expected_pole, expected_type, expected_foundation, expected_equip) in zip(poles, EXPECTED_POLE_SUMMARY):
        assert p["pole"] == expected_pole
        assert p["final_recommended_pole"] == expected_type, f"Pole {p['pole']} expected {expected_type}, got {p['final_recommended_pole']}"
        assert p["foundation_recommendation"] == expected_foundation, f"Pole {p['pole']} expected {expected_foundation}, got {p['foundation_recommendation']}"
        assert p["equipment"] == expected_equip, f"Pole {p['pole']} expected equip {expected_equip}, got {p['equipment']}"

        # Foundation types must ONLY be Type A or Type B
        assert p["foundation_recommendation"] in ["Type A", "Type B"]
        # Forbidden foundation types
        assert "Type C" not in p["foundation_recommendation"]
        assert "Deep/Pad" not in p["foundation_recommendation"]
        assert "Reinforced" not in p["foundation_recommendation"]


def test_foundation_types_and_statuses():
    """Verify foundation table has only Type A and Type B, and no invented statuses."""
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        fix = json.load(f)

    for row in fix["foundation_soil_bearing"]:
        assert row["foundation_type"] in ["Type A", "Type B"]
        assert "Type C" not in row["foundation_type"]
        assert "Deep/Pad" not in row["foundation_type"]
        assert "Reinforced" not in row["foundation_type"]
        # In PDF Page 6, foundation stability status is OK
        assert row["mr_gt_bmf_check"] == "OK"
        # All poles default to soil class 4
        assert row["soil_class"] == 4


def test_conductor_tension_check_values():
    """Verify tension check values match docs/result.pdf page 4."""
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        fix = json.load(f)

    t_check = fix["conductor_tension_check"]
    assert len(t_check) == 4

    # Both circuits use 70+16+N50 bundled conductor (LV)
    for row in t_check:
        assert "70+16+N50 bundled conductor" in row["conductor"]
        assert row["check_15_wind"] == "OK"
        assert row["uts_dan"] == 1500

    # 11kV EDS check is FAIL, LV EDS check is CAUTION in result.pdf
    assert t_check[0]["circuit"] == "11kV" and t_check[0]["eds_check"] == "FAIL"
    assert t_check[1]["circuit"] == "LV" and t_check[1]["eds_check"] == "CAUTION"
    assert t_check[2]["circuit"] == "11kV" and t_check[2]["eds_check"] == "FAIL"
    assert t_check[3]["circuit"] == "LV" and t_check[3]["eds_check"] == "CAUTION"


def test_unreadable_values_are_pending():
    """Verify that values not visible/unreadable in the benchmark PDF are marked 'Pending'."""
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        fix = json.load(f)

    # For poles 10 to 13, right-side clipped columns are 'Pending'
    p10 = next(p for p in fix["structural_loading"] if p["pole"] == 10)
    assert p10["strutted_rec"] == "Pending"
    assert p10["buckling_check"] == "Pending"
