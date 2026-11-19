import pytest
from pole_engine.circuits import (
    n_cond,
    is_lv_abc_conductor,
    circuit_band_label,
    clearance_band_label,
    parse_levels,
    identify_circuits,
    stage_band,
    bottom_most_band,
    normalize_config_row,
    hvabc_flags_for_list
)

def test_n_cond():
    cfg = {"levels_HH": 1, "levels_H": 2, "levels_L": 4}
    assert n_cond(cfg, "HH") == 3
    assert n_cond(cfg, "H") == 4
    assert n_cond(cfg, "L") == 4

def test_is_lv_abc():
    assert is_lv_abc_conductor("L", {"description": "LV Aerial Bundled Cable"}) is True
    assert is_lv_abc_conductor("L", {"description": "Bare copper"}) is False
    assert is_lv_abc_conductor("H", {"description": "ABC"}) is False

def test_identify_circuits_vertical_double():
    cfg = {"levels_H": 3, "n_per_level": "2;2;2"}
    res = identify_circuits(cfg)
    circuits = res["circuits"]
    assert len(circuits) == 2
    assert "Circuit L" in circuits[0]["label"]
    assert "Circuit R" in circuits[1]["label"]

def test_hvabc_flags():
    assert hvabc_flags_for_list(["1", "2"]) == [False, False]  # 1;2 bare triangle
    assert hvabc_flags_for_list(["1", "1"]) == [True, True]
