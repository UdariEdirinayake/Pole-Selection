import pytest
from pole_engine.clearances import (
    creepage_allowance_m,
    top_attach_offset_m,
    max_allowable_sag_flat_m,
    table_ground_m,
    table_cc_m,
    structure_req_m,
    min_sep,
    max_angle,
    sep_at_angle
)

def test_creepage_allowance():
    settings = {"cb_creep_33": 0.35, "cb_creep_lvbare": 0.25}
    assert creepage_allowance_m(settings, "HH", None, is_abc=False) == 0.35
    assert creepage_allowance_m(settings, "L", {"description": "Bare copper"}) == 0.25
    assert creepage_allowance_m(settings, "L", {"description": "Aerial Bundled Cable"}) == 0.4

def test_max_allowable_sag_flat():
    # PH = 11m, o = 5.5m, p = 0.3m, sum_t = 0.2m, r = 0.1m
    # q = 11 * 5/6 = 9.1667m
    # S = 9.1667 - (5.5 + 0.3 + 0.2 + 0.1) = 9.1667 - 6.1 = 3.0667m
    s = max_allowable_sag_flat_m(11.0, 5.5, 0.3, 0.2, 0.1)
    assert round(s, 3) == round(11.0 * 5.0 / 6.0 - 6.1, 3)

def test_sep_at_angle():
    res = sep_at_angle(1.2, 1.2, {"angle": 20.0}, {"angle": 0.0}, 0.9)
    assert res["D_start_m"] == 1.2
    assert res["D_eff"] < 1.2
    assert res["ok"] is True
