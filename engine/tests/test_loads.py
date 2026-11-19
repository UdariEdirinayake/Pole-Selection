import math
import pytest
from pole_engine.loads import (
    mount_h,
    bm_wind_cond,
    bm_tension_angle,
    bm_tension_full,
    bm_wind_pole,
    bm_equip_parts,
    to_pole_top,
    find_equipment_row,
    tf_area,
    tf_weight,
    vertical_load_kn
)

def test_mount_h():
    # 11m pole, offset 0.2m -> 11 * 5/6 - 0.2
    assert math.isclose(mount_h(11.0, 0.2), 11.0 * 5.0 / 6.0 - 0.2)

def test_bm_wind_cond():
    # 3 conductors, 40m wind span, 0 deg, dia 0.01m, h = 8m, q = 575 N/m2
    bm = bm_wind_cond(3, 40.0, 0.0, 0.01, 8.0, 575.0)
    # 3 * 40 * 1 * 0.01 * 0.575 * 8 = 5.52 kNm
    assert math.isclose(bm, 5.52, rel_tol=1e-3)

def test_bm_tension_angle():
    # 3 conductors, 5 kN tension both sides, 30 deg, h = 8m
    # 2 * 5 * sin(15°) * 3 * 8
    bm = bm_tension_angle(3, 5.0, 5.0, 30.0, 8.0)
    expected = 2 * 5.0 * math.sin(math.radians(15)) * 3 * 8.0
    assert math.isclose(bm, expected)

def test_to_pole_top():
    # BM = 50 kNm, 11m pole -> lever = 11 * 5/6 - 0.4 = 9.1667 - 0.4 = 8.7667m
    # load = 50 / 8.7667 * 100 daN
    load = to_pole_top(50.0, 11.0)
    assert math.isclose(load, (50.0 / (11.0 * 5.0 / 6.0 - 0.4)) * 100.0)

def test_bm_wind_pole():
    # 11m pole, breadth 0.28m, q = 865 N/m2
    # h = 11 * 5/6 = 9.1667 m
    bm = bm_wind_pole(11.0, 0.28, 865.0)
    h = 11.0 * 5.0 / 6.0
    expected = 0.28 * h * 0.865 * (h / 2.0)
    assert math.isclose(bm, expected)

def test_find_equipment_row():
    eq_list = [
        {"equipment": "TF - 50kVA", "kva": 50, "weight_kg": 350, "area_m2": 0.8},
        {"equipment": "TF - 100kVA", "kva": 100, "weight_kg": 600, "area_m2": 1.2},
    ]
    row = find_equipment_row(eq_list, "TF - 50kVA")
    assert row is not None
    assert row["kva"] == 50

    row_by_kva = find_equipment_row(eq_list, 100)
    assert row_by_kva is not None
    assert row_by_kva["weight_kg"] == 600
