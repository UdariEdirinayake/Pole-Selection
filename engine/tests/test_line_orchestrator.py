import json
import math
import pathlib
import pytest

from pole_engine.line import compute_line

ROOT_DIR = pathlib.Path(__file__).resolve().parents[2]
REF_PATH = ROOT_DIR / "docs" / "result_reference.json"

@pytest.fixture(scope="module")
def sample_data():
    with open(REF_PATH, encoding="utf-8") as f:
        ref = json.load(f)

    # 13 poles sample geometry from reference
    line_rows = []
    for s in ref["structural_loading"]:
        p = s["pole"]
        line_rows.append({
            "pole_no": p,
            "section": s["sec"],
            "fore_span_m": s["fore_span_m"],
            "aft_span_m": 0.0 if p == 1 else (ref["structural_loading"][p - 2]["fore_span_m"]),
            "angle_deg": s["angle_deg"],
            "elev_delta_m": 0.0,
            "soil_class": "Poor" if p in (1, 2) else "Medium",
            "equipment": "TF - 50kVA" if p == 8 else "",
        })

    config_no = "3"
    config = {
        "config_no": config_no,
        "description": "11 kV + LV bundle",
        "pole_height_m": 11.0,
        "levels_HH": 0,
        "levels_H": 1,
        "levels_L": 1,
        "heights_m": "8.85;7.5",
        "n_per_level": "3;1",
        "guy_h_m": 8.4,
        "tguy_h_m": 8.4
    }

    conductors = [
        {"code": "FLY", "description": "FLY", "diameter_mm": 10.05, "weight_kg_m": 0.285, "lookup_table": "FLY", "UTS_daN": 1650},
        {"code": "LV_ABC", "description": "LV ABC 70mm2", "diameter_mm": 14.0, "weight_kg_m": 0.426, "lookup_table": "LV_ABC", "UTS_daN": 1900}
    ]

    # Approximate table points for sample spans
    span_tension_tables = [
        {"table_id": "FLY", "span_m": 20.0, "tension_kN": 4.5, "tension_27_kN": 3.0, "sag_27_m": 0.15, "sag_65_m": 0.25},
        {"table_id": "FLY", "span_m": 32.8, "tension_kN": 5.25, "tension_27_kN": 3.5, "sag_27_m": 0.28, "sag_65_m": 0.52},
        {"table_id": "FLY", "span_m": 40.0, "tension_kN": 5.8, "tension_27_kN": 3.8, "sag_27_m": 0.45, "sag_65_m": 0.78},
        {"table_id": "LV_ABC", "span_m": 20.0, "tension_kN": 4.5, "tension_27_kN": 3.0, "sag_27_m": 0.15, "sag_65_m": 0.25},
        {"table_id": "LV_ABC", "span_m": 32.8, "tension_kN": 5.25, "tension_27_kN": 3.5, "sag_27_m": 0.28, "sag_65_m": 0.52},
        {"table_id": "LV_ABC", "span_m": 40.0, "tension_kN": 5.8, "tension_27_kN": 3.8, "sag_27_m": 0.45, "sag_65_m": 0.78},
    ]

    capacities = [
        {"height_m": 11, "mount_type": "unguyed", "class_label": "200 U", "capacity_dan": 200, "critical_buckling_kn": 56.1, "avg_breadth_m": 0.28, "weight_kg": 450, "footprint_mm": "300x300"},
        {"height_m": 11, "mount_type": "unguyed", "class_label": "350 U", "capacity_dan": 350, "critical_buckling_kn": 91.0, "avg_breadth_m": 0.28, "weight_kg": 550, "footprint_mm": "350x350"},
        {"height_m": 11, "mount_type": "unguyed", "class_label": "500 U", "capacity_dan": 500, "critical_buckling_kn": 106.6, "avg_breadth_m": 0.28, "weight_kg": 650, "footprint_mm": "400x400"},
        {"height_m": 11, "mount_type": "unguyed", "class_label": "850 U", "capacity_dan": 850, "critical_buckling_kn": 157.7, "avg_breadth_m": 0.28, "weight_kg": 850, "footprint_mm": "450x450"},
    ]

    guy_wires = [
        {"code": "L", "working_load_dan": 2000},
        {"code": "M", "working_load_dan": 3500},
        {"code": "H", "working_load_dan": 5600},
    ]

    settings = {
        "config_no": config_no,
        "conductor_H": "FLY",
        "conductor_LV": "LV_ABC",
        "wind_pressure_Nm2": 575.0,
        "wind_pole_Nm2": 865.0,
        "guy_wire_angle_deg": 30.0
    }

    data = {
        "configs": [config],
        "conductors": conductors,
        "span_tension_tables": span_tension_tables,
        "capacities": capacities,
        "guy_wires": guy_wires,
        "insulators": [
            {"description": "11kV Pin", "voltage_level_kV": 11, "cantilever_strength_kN": 5.0, "nominal_height_m": 0.25}
        ],
        "soil_classes": [
            {"class": "Medium", "subgrade_kN/m3": 25000, "bearing_kNm2": "150-300"},
            {"class": "Poor", "subgrade_kN/m3": 15000, "bearing_kNm2": "75-150"}
        ]
    }

    return line_rows, settings, data

def test_compute_line_runs_successfully(sample_data):
    line_rows, settings, data = sample_data
    res = compute_line(line_rows, settings, data)
    assert "results" in res
    assert len(res["results"]) == 13
    assert res["results"][0]["pole_no"] == 1
    assert res["results"][12]["pole_no"] == 13
    assert res["results"][0]["is_terminal"] is True
    assert res["results"][12]["is_terminal"] is True


def test_guy_sizing_and_bm_pt_longitudinal_breadth(sample_data):
    line_rows, settings, data = sample_data
    settings_with_long = {**settings, "pole_long_breadth_m": 0.3879}
    res = compute_line(line_rows, settings_with_long, data)
    rows = res["results"]

    # Pole 1 (terminal): BM_PT uses 0.3879 m breadth (~14.10 kN*m), not transverse BM_P (~10.18 kN*m)
    p1 = rows[0]
    assert p1["bm_pole_kNm"] == pytest.approx(10.175, abs=0.02)
    assert p1["bm_pt_kNm"] == pytest.approx(14.098, abs=0.02)
    assert p1["bm_guy_kNm"] == pytest.approx(p1["bm_tension_long_kNm"] + p1["bm_pt_kNm"], rel=1e-6)
    expected_tguy_p1 = (p1["bm_guy_kNm"] / (8.4 * math.sin(math.radians(30.0)))) * 100.0
    assert p1["guy_load_daN"] == pytest.approx(expected_tguy_p1, rel=1e-6)

    # Residual wind load for pole class selection still excludes line tension and uses transverse BM_P
    expected_res_p1 = ((p1["bm_wind_cond_kNm"] + p1["bm_pole_kNm"] + p1["bm_equip_kNm"]) / (11.0 * 5.0 / 6.0 - 0.4)) * 100.0
    assert p1["load_without_tension_daN"] == pytest.approx(expected_res_p1, rel=1e-6)

    # Pole 2 (intermediate): guy wire sized on BM_C + BM_E + BM_P + BM_T
    p2 = rows[1]
    assert p2["is_terminal"] is False
    expected_bm_p2 = p2["bm_wind_cond_kNm"] + p2["bm_equip_kNm"] + p2["bm_pole_kNm"] + p2["bm_tension_kNm"]
    assert p2["bm_guy_kNm"] == pytest.approx(expected_bm_p2, rel=1e-6)
    expected_tguy_p2 = (expected_bm_p2 / (8.4 * math.sin(math.radians(30.0)))) * 100.0
    assert p2["guy_load_daN"] == pytest.approx(expected_tguy_p2, rel=1e-6)
