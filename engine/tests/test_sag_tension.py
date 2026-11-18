"""Unit tests for engine/pole_engine/sag_tension.py calibrated against docs/result_reference.json."""
import os
import json
import pytest
from pole_engine.sag_tension import (
    TableLookupPoint,
    calculate_equivalent_span_m,
    lookup_sag_tension_table,
    scale_sag_to_actual_span_m,
    calculate_tension_pct_of_uts,
    default_eds_assessment,
    benchmark_eds_assessment,
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


def test_equivalent_span_formula():
    """Verify equivalent span calculation against Section 1 (32.8m) and Section 2 (30.5m)."""
    # Section 1 spans: Poles 1-6 (spans to 2, 3, 4, 5, 6, 7)
    s1_spans = [29.0, 34.0, 29.0, 33.0, 31.0, 38.0]
    eq1 = calculate_equivalent_span_m(s1_spans)
    assert round(eq1, 1) == 32.8
    assert round(eq1, 3) == 32.798

    # Section 2 spans: Poles 7-13 (spans to 8, 9, 10, 11, 12, 13)
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


def test_table_lookup_linear_interpolation():
    """Verify chart linear interpolation at equivalent spans matches result_reference.json."""
    # Section 1 at 32.8 m
    res1 = lookup_sag_tension_table(TABLE_UQ_POINTS, 32.8)
    assert res1.is_assessed is True
    assert res1.status == "PASS"
    assert round(res1.tension_15c_wind_kn, 3) == 5.252
    assert round(res1.tension_27c_kn, 3) == 3.152

    # Section 2 at 30.526 m
    res2 = lookup_sag_tension_table(TABLE_UQ_POINTS, 30.526)
    assert res2.is_assessed is True
    assert res2.status == "PASS"
    assert round(res2.tension_15c_wind_kn, 3) == 5.173
    assert round(res2.tension_27c_kn, 3) == 3.152


def test_table_lookup_out_of_bounds_fails_closed():
    """Verify spans outside table range return NOT ASSESSED and never extrapolate."""
    # Below minimum span 10m
    res_low = lookup_sag_tension_table(TABLE_UQ_POINTS, 8.5)
    assert res_low.is_assessed is False
    assert res_low.status == "NOT ASSESSED"
    assert "Extrapolation is strictly forbidden" in res_low.reason

    # Above maximum span 65m
    res_high = lookup_sag_tension_table(TABLE_UQ_POINTS, 75.0)
    assert res_high.is_assessed is False
    assert res_high.status == "NOT ASSESSED"
    assert "Extrapolation is strictly forbidden" in res_high.reason


def test_table_lookup_warnings_for_flagged_rows():
    """Verify that using points flagged with needs_confirmation returns warnings."""
    # Span 18m interpolates between 15m (flagged) and 20m (flagged)
    res = lookup_sag_tension_table(TABLE_UQ_POINTS, 18.0)
    assert res.is_assessed is True
    assert len(res.warnings) >= 1
    assert any("requires confirmation" in w for w in res.warnings)


def test_tension_pct_uts_and_configurable_eds():
    """Verify % of UTS calculations (35.0%, 34.5%, 21.0%) and configurable EDS check."""
    uts_kn = 15.0  # 1500 daN for 70+16+N50

    # Section 1 @ 15°C + wind: 5.252 kN -> 35.0%
    pct1 = calculate_tension_pct_of_uts(5.252, uts_kn)
    assert round(pct1, 1) == 35.0
    assert assess_max_stress_15c_wind(pct1, 40.0) == "OK"

    # Section 2 @ 15°C + wind: 5.173 kN -> 34.5%
    pct2 = calculate_tension_pct_of_uts(5.173, uts_kn)
    assert round(pct2, 1) == 34.5
    assert assess_max_stress_15c_wind(pct2, 40.0) == "OK"

    # Both sections @ 27°C: 3.152 kN -> 21.0%
    pct_eds = calculate_tension_pct_of_uts(3.152, uts_kn)
    assert round(pct_eds, 1) == 21.0

    # Configurable EDS evaluator defaults to NOT ASSESSED
    assert default_eds_assessment(pct_eds, limit_pct=20.0) == "NOT ASSESSED"

    # Benchmark evaluator
    assert benchmark_eds_assessment(pct_eds, limit_pct=20.0, is_lv=False) == "FAIL"
    assert benchmark_eds_assessment(pct_eds, limit_pct=20.0, is_lv=True) == "CAUTION"


def test_sag_schedule_against_reference_and_report_mismatches():
    """Verify the derived sag scaling rule S(L) = S(L_eq) * (L / L_eq)^2 against docs/result_reference.json.

    Reports every difference between calculated and reference values without altering the reference.
    """
    with open(REF_PATH, "r", encoding="utf-8") as f:
        ref = json.load(f)

    # Section 1: L_eq = 32.8 m
    res_eq1 = lookup_sag_tension_table(TABLE_UQ_POINTS, 32.8)
    s27_eq1 = res_eq1.sag_27c_m
    s65_eq1 = res_eq1.sag_65c_m

    # Section 2: L_eq = 30.5 m
    res_eq2 = lookup_sag_tension_table(TABLE_UQ_POINTS, 30.5)
    s27_eq2 = res_eq2.sag_27c_m
    s65_eq2 = res_eq2.sag_65c_m

    # Spans for Section 1 (Poles 1 to 6) and Section 2 (Poles 7 to 12)
    s1_spans = [29.0, 34.0, 29.0, 33.0, 31.0, 38.0]
    s2_spans = [37.0, 30.0, 24.0, 35.0, 23.0, 25.0]

    # Calculate 27°C sags
    calc_s27 = [round(scale_sag_to_actual_span_m(s27_eq1, s, 32.8), 3) for s in s1_spans] + \
               [round(scale_sag_to_actual_span_m(s27_eq2, s, 30.5), 3) for s in s2_spans]
    # Pole 13 terminal span takes previous span (25.0m)
    calc_s27.append(calc_s27[-1])

    # Calculate 65°C sags
    calc_s65 = [round(scale_sag_to_actual_span_m(s65_eq1, s, 32.8), 3) for s in s1_spans] + \
               [round(scale_sag_to_actual_span_m(s65_eq2, s, 30.5), 3) for s in s2_spans]
    calc_s65.append(calc_s65[-1])

    ref_s27 = [r["sag_27_c1_m"] for r in ref["sag_schedule_27"]]
    ref_s65 = [r["max_sag_65_c1_m"] for r in ref["ground_clearance"]]

    mismatches_27 = []
    for pole_idx, (c, r) in enumerate(zip(calc_s27, ref_s27), start=1):
        diff = abs(c - r)
        if diff > 1e-4:
            mismatches_27.append(f"Pole {pole_idx} @ 27°C: calculated={c:.3f} m, reference={r:.3f} m, diff={diff:.3f} m")

    mismatches_65 = []
    for pole_idx, (c, r) in enumerate(zip(calc_s65, ref_s65), start=1):
        diff = abs(c - r)
        if diff > 1e-4:
            mismatches_65.append(f"Pole {pole_idx} @ 65°C: calculated={c:.3f} m, reference={r:.3f} m, diff={diff:.3f} m")

    print("\n--- Sag Scaling Calibration Report ---")
    print(f"Rule: S(L) = S(L_eq) * (L / L_eq)^2")
    print(f"Total 27°C comparisons: {len(calc_s27)}, exact matches: {len(calc_s27) - len(mismatches_27)}")
    for m in mismatches_27:
        print(f"  {m}")
    print(f"Total 65°C comparisons: {len(calc_s65)}, exact matches: {len(calc_s65) - len(mismatches_65)}")
    for m in mismatches_65:
        print(f"  {m}")

    # Maximum difference is at most 1 millimeter (0.001m) due to float rounding
    for c, r in zip(calc_s27, ref_s27):
        assert abs(c - r) <= 0.0015, f"Mismatch at 27°C: calculated={c}, reference={r}"

    for c, r in zip(calc_s65, ref_s65):
        assert abs(c - r) <= 0.0015, f"Mismatch at 65°C: calculated={c}, reference={r}"
