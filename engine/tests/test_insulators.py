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

    # 20 < angle <= 40 -> 2x STIE
    r3 = select_insulator_by_angle(25.0, "11kV Pin", "11kV", is_dead_end=False, ttie_max=10.0, stie_max=20.0)
    assert r3["tie"] == "2STIE"
    assert "2×" in r3["insulator"]

    # > 40 -> TEN**
    r4 = select_insulator_by_angle(45.0, "11kV Pin", "11kV", is_dead_end=False, ttie_max=10.0, stie_max=20.0)
    assert r4["tie"] == "TEN**"
    assert "TEN**" in r4["insulator"]

def test_select_insulator_85_deg_mounting():
    # <= 15 -> STIE (no Top Tie at 85 deg)
    r1 = select_insulator_by_angle(10.0, "11kV Pin", "11kV", is_dead_end=False, mounting="85_deg")
    assert r1["tie"] == "STIE"
    # 15 < angle <= 30 -> 2STIE
    r2 = select_insulator_by_angle(25.0, "11kV Pin", "11kV", is_dead_end=False, mounting="85_deg")
    assert r2["tie"] == "2STIE"
    # > 30 -> TEN**
    r3 = select_insulator_by_angle(35.0, "11kV Pin", "11kV", is_dead_end=False, mounting="85_deg")
    assert r3["tie"] == "TEN**"

def test_select_insulator_cantilever_sf2():
    # Ultimate Pin Strength = 10.7 kN -> Allowable = 5.35 kN (SF = 2)
    # R = 2*10*sin(15/2) + 0.575*0.015*50*cos(15/2) = 2.6105 + 0.4276 = 3.038 kN < 5.35 -> PASS
    r_ok = select_insulator_by_angle(
        15.0, "11kV Pin", "11kV", is_dead_end=False,
        opts={"T1_kN": 10.0, "T2_kN": 10.0, "qCond": 575.0, "dia_m": 0.015, "windSpan": 50.0, "cantilever_kN": 10.7}
    )
    assert r_ok["allowable_kN"] == pytest.approx(5.35, rel=1e-4)
    assert r_ok["R_kN"] == pytest.approx(3.038, abs=1e-2)
    assert r_ok["tie"] == "STIE"
    assert r_ok["R_recalc_kN"] is None

    # R >= 5.35 kN (e.g. T=25 kN, angle=15 -> R ~ 6.95 kN >= 5.35 kN), 2x pin R_recalc < 5.35 -> 2x pin + 2STIE
    r_2x = select_insulator_by_angle(
        15.0, "11kV Pin", "11kV", is_dead_end=False,
        opts={"T1_kN": 25.0, "T2_kN": 25.0, "qCond": 575.0, "dia_m": 0.015, "windSpan": 50.0, "cantilever_kN": 10.7}
    )
    assert r_2x["R_kN"] >= 5.35
    assert r_2x["R_recalc_kN"] < 5.35
    assert r_2x["tie"] == "2STIE"
    assert "2×" in r_2x["insulator"]

    # Both single and 2x pin exceed 5.35 kN -> TEN**
    r_fail = select_insulator_by_angle(
        35.0, "11kV Pin", "11kV", is_dead_end=False,
        opts={"T1_kN": 25.0, "T2_kN": 25.0, "qCond": 575.0, "dia_m": 0.015, "windSpan": 50.0, "cantilever_kN": 10.7}
    )
    assert r_fail["tie"] == "TEN**"
    assert "TEN**" in r_fail["insulator"]

def test_insulator_rank():
    assert ins_rank({"tie": "TTIE"}) == 1
    assert ins_rank({"tie": "STIE"}) == 2
    assert ins_rank({"tie": "2STIE"}) == 3
    assert ins_rank({"note": "Tension required"}) == 4
