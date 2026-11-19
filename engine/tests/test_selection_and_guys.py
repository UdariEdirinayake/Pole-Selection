import pytest
from pole_engine.guys import guy_wire_load_dan, guy_long_force_dan
from pole_engine.buckling import buckling_capacity_kn
from pole_engine.selection import (
    is_multi_pole_class,
    pick_unguyed,
    pick_strutted_pair,
    pick_guyed,
    find_capacity_row,
    push_alt
)

def test_guys():
    # BM = 50 kNm, h = 8.4m, a = 30 deg, theta = 0 deg
    # G = 50 / (8.4 * sin(30) * 1) * 100 = 50 / 4.2 * 100 = 1190.48 daN
    g = guy_wire_load_dan(50.0, 8.4, 30.0, 0.0)
    assert round(g, 1) == 1190.5

    # Longitudinal force: theta = 0 -> 0
    fl = guy_long_force_dan(g, 30.0, 0.0)
    assert fl == 0.0

def test_strutted_pair():
    assert pick_strutted_pair(500.0) == "200/200 S"
    assert pick_strutted_pair(1000.0) == "200/350 S"
    assert pick_strutted_pair(1500.0) == "200/500 S"
    assert pick_strutted_pair(2000.0) == "200/850 S"
    assert pick_strutted_pair(3000.0) is None

def test_buckling_capacity():
    caps = [
        {"height_m": 11, "class_label": "350 U", "critical_buckling_kn": 91.0},
        {"height_m": 11, "class_label": "500 U", "critical_buckling_kn": 106.6},
    ]
    assert buckling_capacity_kn(11, "350", caps) == 91.0
    assert buckling_capacity_kn(11, "500", caps) == 106.6
    assert buckling_capacity_kn(11, "850", caps) == 0.0

def test_pick_unguyed():
    caps = [
        {"height_m": 11, "mount_type": "unguyed", "class_label": "200 U", "capacity_dan": 200},
        {"height_m": 11, "mount_type": "unguyed", "class_label": "350 U", "capacity_dan": 350},
        {"height_m": 11, "mount_type": "unguyed", "class_label": "500 U", "capacity_dan": 500},
        {"height_m": 11, "mount_type": "unguyed", "class_label": "2x500 U", "capacity_dan": 1000},
    ]
    res = pick_unguyed(11, 300, caps, allow_2x=False)
    assert res["label"] == "350 U"

    res_2x = pick_unguyed(11, 700, caps, allow_2x=True)
    assert res_2x["label"] == "2x500 U"

    res_no2x = pick_unguyed(11, 700, caps, allow_2x=False)
    assert res_no2x is None
