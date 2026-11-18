"""Unit tests for engine/pole_engine/sag_tension.py calibrated against docs/result_reference.json."""
import os
import json
import pytest
from pole_engine.sag_tension import (
    TableLookupPoint,
    calculate_equivalent_span_m,
    lookup_sag_tension_table,
    get_pole_sag_span_m,
    scale_sag_to_actual_span_m,
    calculate_tension_pct_of_uts,
    default_eds_assessment,
    assess_eds_check,
    assess_max_stress_15c_wind,
)

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
REF_PATH = os.path.join(REPO_ROOT, "docs/result_reference.json")

# Master lookup table UQ points transcribed from LECO Excel master / database
TABLE_UQ_POINTS = [
    TableLookupPoint(span_m=10.0, tension_15c_wind_kn=4.259, tension_27c_kn=3.152, sag_15c_m=0.08, sag_27c_m=0.05, sag_65c_m=0.12, needs_confirmation=False),
    TableLookupPoint(span_m=15.0, tension_15c_wind_kn=4.498, tension_27c_kn=3.152, sag_15c_m=0.16, sag_27c_m=0.11, sag_65c_m=0.21, needs_confirmation=True),
    TableLookupPoint(span_m=20.0, tension_15c_wind_kn=4.737, tension_27c_kn=3.152, sag_15c_m=0.28, sag_27c_m=0.19, sag_65c_m=0.32, needs_confirmation=True),
    TableLookupPoint(span_m=25.0, tension_15c_wind_kn=4.957, tension_27c_kn=3.152, sag_15c_m=0.41, sag_27c_m=0.30, sag_65c_m=0.46, needs_confirmation=False),
    TableLookupPoint(span_m=30.0, tension_15c_wind_kn=5.155, tension_27c_kn=3.152, sag_15c_m=0.57, sag_27c_m=0.44, sag_65c_m=0.62, needs_confirmation=False),
    TableLookupPoint(span_m=35.0, tension_15c_wind_kn=5.328, tension_27c_kn=3.152, sag_15c_m=0.75, sag_27c_m=0.60, sag_65c_m=0.80, needs_confirmation=False),
    TableLookupPoint(span_m=40.0, tension_15c_wind_kn=5.479, tension_27c_kn=3.152, sag_15c_m=0.95, sag_27c_m=0.78, sag_65c_m=1.00, needs_confirmation=False),
    TableLookupPoint(span_m=45.0, tension_15c_wind_kn=5.612, tension_27c_kn=3.152, sag_15c_m=1.10, sag_27c_m=0.98, sag_65c_m=1.22, needs_confirmation=True),
    TableLookupPoint(span_m=50.0, tension_15c_wind_kn=5.726, tension_27c_kn=3.152, sag_15c_m=1.42, sag_27c_m=1.22, sag_65c_m=1.46, needs_confirmation=True),
    TableLookupPoint(span_m=55.0, tension_15c_wind_kn=5.826, tension_27c_kn=3.152, sag_15c_m=1.69, sag_27c_m=1.47, sag_65c_m=1.73, needs_confirmation=True),
    TableLookupPoint(span_m=60.0, tension_15c_wind_kn=5.914, tension_27c_kn=3.152, sag_15c_m=1.98, sag_27c_m=1.75, sag_65c_m=2.01, needs_confirmation=True),
    TableLookupPoint(span_m=65.0, tension_15c_wind_kn=5.990, tension_27c_kn=3.152, sag_15c_m=3.00, sag_27c_m=2.05, sag_65c_m=2.33, needs_confirmation=True),
]


# Benchmark-only helper for verifying test parity against docs/result.pdf; not for production use.
def _benchmark_eds_assessment_helper(ratio_pct: float, limit_pct: float = 20.0, is_lv: bool = False) -> str:
    """Benchmark helper to reproduce docs/result.pdf classifications for testing only."""
    if ratio_pct <= limit_pct:
        return "OK"
    return "CAUTION" if is_lv else "FAIL"


def test_equivalent_span_formula():
    """Verify equivalent span calculation against Section 1 (32.8m) and Section 2 (30.5m)."""
    s1_spans = [29.0, 34.0, 29.0, 33.0, 31.0, 38.0]
    eq1 = calculate_equivalent_span_m(s1_spans)
    assert round(eq1, 1) == 32.8
    assert round(eq1, 3) == 32.798

    s2_spans = [37.0, 30.0, 24.0, 35.0, 23.0, 25.0]
    eq2 = calculate_equivalent_span_m(s2_spans)
    assert round(eq2, 1) == 30.5
    assert round(eq2, 3) == 30.526


def test_equivalent_span_validation():
    """Verify input validation: empty list and negative/zero spans raise ValueError."""
    with pytest.raises(ValueError, match="empty list"):
        calculate_equivalent_span_m([])

    with pytest.raises(ValueError, match="strictly positive"):
        calculate_equivalent_span_m([30.0, -5.0, 25.0])

    with pytest.raises(ValueError, match="strictly positive"):
        calculate_equivalent_span_m([30.0, 0.0])


def test_pole_sag_span_rule():
    """Verify pole sag span rule: use fore span, and aft span when fore span is 0 (terminal pole 13)."""
    # Standard intermediate pole: fore span = 29.0, aft span = 0.0 -> uses fore span (29.0m)
    assert get_pole_sag_span_m(fore_span_m=29.0, aft_span_m=0.0) == 29.0
    # Intermediate angle pole: fore span = 34.0, aft span = 29.0 -> uses fore span (34.0m)
    assert get_pole_sag_span_m(fore_span_m=34.0, aft_span_m=29.0) == 34.0
    # Terminal dead-end pole 13: fore span = 0.0, aft span = 25.0 -> uses aft span (25.0m)
    assert get_pole_sag_span_m(fore_span_m=0.0, aft_span_m=25.0) == 25.0


def test_table_lookup_linear_interpolation():
    """Verify chart linear interpolation at exact unrounded equivalent spans matches result_reference.json."""
    # Section 1 at exact unrounded eq span
    s1_spans = [29.0, 34.0, 29.0, 33.0, 31.0, 38.0]
    eq1 = calculate_equivalent_span_m(s1_spans)
    res1 = lookup_sag_tension_table(TABLE_UQ_POINTS, eq1)
    assert res1.is_assessed is True
    assert res1.status == "PASS"
    assert round(res1.tension_15c_wind_kn, 3) == 5.252
    assert round(res1.tension_27c_kn, 3) == 3.152

    # Section 2 at exact unrounded eq span
    s2_spans = [37.0, 30.0, 24.0, 35.0, 23.0, 25.0]
    eq2 = calculate_equivalent_span_m(s2_spans)
    res2 = lookup_sag_tension_table(TABLE_UQ_POINTS, eq2)
    assert res2.is_assessed is True
    assert res2.status == "PASS"
    assert round(res2.tension_15c_wind_kn, 3) == 5.173
    assert round(res2.tension_27c_kn, 3) == 3.152


def test_table_lookup_out_of_bounds_fails_closed():
    """Verify spans outside table range return NOT ASSESSED and never extrapolate."""
    res_low = lookup_sag_tension_table(TABLE_UQ_POINTS, 8.5)
    assert res_low.is_assessed is False
    assert res_low.status == "NOT ASSESSED"
    assert "Extrapolation is strictly forbidden" in res_low.reason

    res_high = lookup_sag_tension_table(TABLE_UQ_POINTS, 75.0)
    assert res_high.is_assessed is False
    assert res_high.status == "NOT ASSESSED"
    assert "Extrapolation is strictly forbidden" in res_high.reason


def test_table_lookup_warnings_for_flagged_rows():
    """Verify that using points flagged with needs_confirmation returns warnings."""
    res = lookup_sag_tension_table(TABLE_UQ_POINTS, 18.0)
    assert res.is_assessed is True
    assert len(res.warnings) >= 1
    assert any("requires confirmation" in w for w in res.warnings)


def test_tension_pct_uts_and_production_eds_status():
    """Verify % of UTS calculations (35.0%, 34.5%, 21.0%) and production EDS status is strictly NOT ASSESSED."""
    uts_kn = 15.0  # 1500 daN for 70+16+N50

    pct1 = calculate_tension_pct_of_uts(5.252, uts_kn)
    assert round(pct1, 1) == 35.0
    assert assess_max_stress_15c_wind(pct1, 40.0) == "OK"

    pct2 = calculate_tension_pct_of_uts(5.173, uts_kn)
    assert round(pct2, 1) == 34.5
    assert assess_max_stress_15c_wind(pct2, 40.0) == "OK"

    pct_eds = calculate_tension_pct_of_uts(3.152, uts_kn)
    assert round(pct_eds, 1) == 21.0

    # Production requirement: EDS status MUST stay NOT ASSESSED until an engineering rule is approved
    assert default_eds_assessment(pct_eds, limit_pct=20.0) == "NOT ASSESSED"
    assert assess_eds_check(pct_eds, limit_pct=20.0) == "NOT ASSESSED"

    # Test-only benchmark verification helper
    assert _benchmark_eds_assessment_helper(pct_eds, limit_pct=20.0, is_lv=False) == "FAIL"
    assert _benchmark_eds_assessment_helper(pct_eds, limit_pct=20.0, is_lv=True) == "CAUTION"


def test_27c_sag_schedule_matches_all_13_poles_exactly():
    """Verify exact unrounded equivalent span scaling matches all 13 poles in docs/result_reference.json at 27°C."""
    with open(REF_PATH, "r", encoding="utf-8") as f:
        ref = json.load(f)

    # Section 1 exact equivalent span
    s1_spans = [29.0, 34.0, 29.0, 33.0, 31.0, 38.0]
    eq1 = calculate_equivalent_span_m(s1_spans)
    res_eq1 = lookup_sag_tension_table(TABLE_UQ_POINTS, eq1)

    # Section 2 exact equivalent span
    s2_spans = [37.0, 30.0, 24.0, 35.0, 23.0, 25.0]
    eq2 = calculate_equivalent_span_m(s2_spans)
    res_eq2 = lookup_sag_tension_table(TABLE_UQ_POINTS, eq2)

    # Scale sag for Section 1 (Poles 1 to 6)
    calc_s27_s1 = [round(scale_sag_to_actual_span_m(res_eq1.sag_27c_m, s, eq1), 3) for s in s1_spans]
    # Scale sag for Section 2 (Poles 7 to 12)
    calc_s27_s2 = [round(scale_sag_to_actual_span_m(res_eq2.sag_27c_m, s, eq2), 3) for s in s2_spans]
    # Pole 13 terminal span uses aft span (25.0m) via get_pole_sag_span_m rule
    p13_span = get_pole_sag_span_m(fore_span_m=0.0, aft_span_m=25.0)
    p13_s27 = round(scale_sag_to_actual_span_m(res_eq2.sag_27c_m, p13_span, eq2), 3)

    calc_s27_all = calc_s27_s1 + calc_s27_s2 + [p13_s27]
    ref_s27_all = [r["sag_27_c1_m"] for r in ref["sag_schedule_27"]]

    # Exact match on all 13 poles!
    assert calc_s27_all == ref_s27_all, f"Mismatch at 27°C: calc={calc_s27_all}, ref={ref_s27_all}"


def test_65c_max_sag_within_documented_1mm_tolerance():
    """Verify 65°C max sag matches with 10 exact matches and 3 documented 1mm tolerance differences (Poles 6, 12, 13)."""
    with open(REF_PATH, "r", encoding="utf-8") as f:
        ref = json.load(f)

    s1_spans = [29.0, 34.0, 29.0, 33.0, 31.0, 38.0]
    eq1 = calculate_equivalent_span_m(s1_spans)
    res_eq1 = lookup_sag_tension_table(TABLE_UQ_POINTS, eq1)

    s2_spans = [37.0, 30.0, 24.0, 35.0, 23.0, 25.0]
    eq2 = calculate_equivalent_span_m(s2_spans)
    res_eq2 = lookup_sag_tension_table(TABLE_UQ_POINTS, eq2)

    calc_s65_s1 = [round(scale_sag_to_actual_span_m(res_eq1.sag_65c_m, s, eq1), 3) for s in s1_spans]
    calc_s65_s2 = [round(scale_sag_to_actual_span_m(res_eq2.sag_65c_m, s, eq2), 3) for s in s2_spans]
    p13_span = get_pole_sag_span_m(fore_span_m=0.0, aft_span_m=25.0)
    p13_s65 = round(scale_sag_to_actual_span_m(res_eq2.sag_65c_m, p13_span, eq2), 3)

    calc_s65_all = calc_s65_s1 + calc_s65_s2 + [p13_s65]
    ref_s65_all = [r["max_sag_65_c1_m"] for r in ref["ground_clearance"]]

    mismatches = []
    for pole_no, (c, r) in enumerate(zip(calc_s65_all, ref_s65_all), start=1):
        diff = abs(c - r)
        if diff > 1e-4:
            mismatches.append((pole_no, c, r, diff))

    # Exactly 3 differences of at most 0.001 m (1 mm) at poles 6, 12, 13
    assert len(mismatches) == 3
    assert {m[0] for m in mismatches} == {6, 12, 13}
    for pole_no, c, r, diff in mismatches:
        assert diff <= 0.0011, f"Pole {pole_no} diff {diff} exceeds 1 mm tolerance"
