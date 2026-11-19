import pytest
from pole_engine.insulators import (
    select_insulator_by_angle,
    cant_of,
    ins_rank,
    insulator_nominal_height_m
)

def test_select_insulator_by_angle_dead_end():
    res = select_insulator_by_angle(0.0, "33kV Post", "33kV", is_dead_end=True)
    assert res["insulator"] == "33kV TEN**"
    assert res["tie"] == ""

def test_select_insulator_by_angle_angles():
    # <= 10 deg -> TTIE
    r1 = select_insulator_by_angle(5.0, "11kV Pin", "11kV", is_dead_end=False, ttie_max=10.0, stie_max=20.0)
    assert r1["tie"] == "TTIE"

    # 10 < angle <= 20 -> STIE
    r2 = select_insulator_by_angle(15.0, "11kV Pin", "11kV", is_dead_end=False, ttie_max=10.0, stie_max=20.0)
    assert r2["tie"] == "STIE"

    # > 20 -> 2x STIE
    r3 = select_insulator_by_angle(25.0, "11kV Pin", "11kV", is_dead_end=False, ttie_max=10.0, stie_max=20.0)
    assert r3["tie"] == "2STIE"
    assert "2×" in r3["insulator"]

def test_insulator_rank():
    assert ins_rank({"tie": "TTIE"}) == 1
    assert ins_rank({"tie": "STIE"}) == 2
    assert ins_rank({"tie": "2STIE"}) == 3
    assert ins_rank({"note": "Tension required"}) == 4
