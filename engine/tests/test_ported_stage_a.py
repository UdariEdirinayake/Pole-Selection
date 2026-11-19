import math
import pytest
from pole_engine.sag_tension import (
    lookup_tension_kn,
    lookup_sag_m,
    conductor_sag_m,
    scale_sag,
    state_change_tension_n,
    conductor_e_n,
    conductor_alpha,
    conductor_uts_dan,
    conductor_weff_kg_m,
    horizontal_tension_from_sag_n,
    conductor_area_m2,
    catenary_unequal,
    catenary_y,
    catenary_vertical_ends,
    lookup_tension_27_kn,
    conductor_tension_kn,
)

def test_lookup_tension_kn_clamping():
    rows = [
        {"span_m": 20.0, "tension_kN": 5.0},
        {"span_m": 40.0, "tension_kN": 7.0},
    ]
    # In range
    val, warns = lookup_tension_kn(rows, 30.0)
    assert math.isclose(val, 6.0)
    assert len(warns) == 0

    # Outside lower bound
    val, warns = lookup_tension_kn(rows, 10.0)
    assert val == 5.0
    assert "outside chart range" in warns

    # Outside upper bound
    val, warns = lookup_tension_kn(rows, 50.0)
    assert val == 7.0
    assert "outside chart range" in warns

def test_state_change_tension():
    # Martin state-change equation solver
    # Test that higher temperature relaxes tension
    t1 = 5000.0 # N at 15 C
    w = 0.285 # kg/m
    e = 6600.0 * 9.80665e6 # N/m2
    alpha = 0.000023 # /C
    a = 50e-6 # m2
    l = 40.0 # m
    t2 = state_change_tension_n(t1, w, e, alpha, a, l, 15.0, 65.0)
    assert t2 < t1
    assert t2 > 0

def test_horizontal_tension_from_sag():
    w = 0.285 # kg/m
    l = 40.0 # m
    sag = 0.5 # m
    h = horizontal_tension_from_sag_n(w, l, sag)
    assert h > 0
    # Check approximate parabolic relation: H ≈ w*g*L^2 / (8*s)
    h_approx = (w * 9.81 * l * l) / (8.0 * sag)
    assert math.isclose(h, h_approx, rel_tol=1e-2)

def test_catenary_unequal():
    cond = {"Weight_kg_m": 0.285, "diameter_mm": 10.0}
    t65 = 2000.0 # N
    l = 50.0
    res = catenary_unequal(cond, t65, l, 0.0, 5.0, 9.0, 9.0)
    assert res["maxSag_m"] > 0
    assert len(res["samples"]) > 0
    assert res["minClearance_m"] > 0

def test_catenary_vertical_ends():
    cond = {"Weight_kg_m": 0.285}
    h_kn = 2.0
    l = 40.0
    # Level span supports equal weight share
    res = catenary_vertical_ends(cond, h_kn, l, 0.0, 0.0, 8.0, 8.0)
    assert math.isclose(res["V_start_kN"], res["V_end_kN"], rel_tol=1e-3)
    total_w = (0.285 * 9.81 * 40.0) / 1000.0
    assert math.isclose(res["V_start_kN"] + res["V_end_kN"], total_w, rel_tol=1e-3)
