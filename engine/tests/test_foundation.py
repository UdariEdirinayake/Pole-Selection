import pytest
from pole_engine.foundation import (
    parse_footprint_mm,
    parse_bearing_min,
    compute_foundation
)

def test_parse_footprint():
    fp = parse_footprint_mm("350x350")
    assert fp["L"] == 350.0
    assert fp["W"] == 350.0

    fp2 = parse_footprint_mm("300 x 400 mm")
    assert fp2["L"] == 300.0
    assert fp2["W"] == 400.0

def test_parse_bearing_min():
    assert parse_bearing_min("150-300") == 150.0
    assert parse_bearing_min("200") == 200.0
    assert parse_bearing_min("<25") == 0.0

def test_compute_foundation_basic():
    opts = {
        "poleHeight": 11.0,
        "recommended": "500 U",
        "isTerminal": False,
        "isGuyedOrStrut": False,
        "heights": [8.0],
        "ns": [3],
        "nHH": 0,
        "nH": 1,
        "nL": 0,
        "stageCond": [{"Weight_kg_m": 0.285, "diameter_mm": 10.0}],
        "stageT1": [4.0],
        "stageT2": [4.0],
        "windSpan": 40.0,
        "weightSpan": 40.0,
        "angleDeg": 0.0,
        "soilClass": "Medium",
        "data": {
            "soil_classes": [{"class": "Medium", "subgrade_kN/m3": 25000, "bearing_kNm2": "150-300"}],
            "capacities": [{"height_m": 11, "class_label": "500 U", "mount_type": "unguyed", "weight_kg": 650, "footprint_mm": "350x350", "below_gl_breadth_m": 0.35}]
        }
    }
    res = compute_foundation(opts)
    assert res["embedment_m"] == 11.0 / 6.0
    assert res["bmf_kNm"] > 0
    assert res["mg_kNm"] > 0
    assert res["foundation_type"] in ("A", "B", "C", "X")
