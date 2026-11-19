"""
Phase 4B – Test: Clearances and Phase Separation
Tests run against docs/result_reference.json (never modified).

Explicit test inputs
--------------------
Neither the 1.047 m attachment offset nor the 1.454 m circuit spacing is in the
Excel master data. They are supplied here as explicit test inputs:
  - ATTACHMENT_HEIGHT_BELOW_POLE_TOP_M = 1.047  # back-calculated from result.pdf, source pending
  - VERTICAL_SPACING_11KV_LV_M = 1.454          # back-calculated from result.pdf, source pending

When these inputs are provided, all 13 poles match docs/result_reference.json.
When they are missing, ground clearance and circuit clearance return NOT ASSESSED
with the reason 'input needed'.
"""

from __future__ import annotations

import json
import math
import pathlib
import sys

import pytest

ENGINE_ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ENGINE_ROOT))

from pole_engine.clearances import (
    calculate_required_phase_separation_m,
    calculate_separation_at_angle_m,
    calculate_max_crossarm_angle_deg,
    evaluate_phase_separation,
    calculate_attachment_height_above_ground_m,
    calculate_lowest_ground_clearance_m,
    assess_ground_clearance,
    evaluate_ground_clearance,
    assess_circuit_clearance,
    evaluate_circuit_clearance,
    compute_pole_clearance,
)

# ---------------------------------------------------------------------------
# Reference data
# ---------------------------------------------------------------------------
REF_PATH = pathlib.Path(__file__).resolve().parents[2] / "docs" / "result_reference.json"


@pytest.fixture(scope="module")
def ref():
    with open(REF_PATH, encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# Master data parameters (CrossarmConfig, DesignParameter, GroundClearance, CircuitClearance)
# ---------------------------------------------------------------------------
STRAIGHT_SEP_M = 1.100  # CrossarmConfig config_no=10 (P621-MS)
LINE_VOLTAGE_KV = 11.0  # From circuit nominal_voltage_kv (never a literal default)
APPLICABLE_CLEARANCE_M = 5.50  # GroundClearance LV, 'across any road or street'
REQ_VERT_CLEAR_M = 1.20  # CircuitClearance lower=LV, upper=11kV
POLE_HEIGHT_M = 11.0  # Catalog pole height for benchmark line
EMBEDMENT_RATIO = 1.0 / 6.0  # From design_parameter table embedment_ratio

# ---------------------------------------------------------------------------
# Explicit test inputs (not in Excel master data)
# ---------------------------------------------------------------------------
ATTACHMENT_HEIGHT_BELOW_POLE_TOP_M = 1.047  # back-calculated from result.pdf, source pending
VERTICAL_SPACING_11KV_LV_M = 1.454          # back-calculated from result.pdf, source pending

# Derived attachment height above ground using explicit inputs
# 11.0 * (1 - 1/6) - 1.047 = 9.1667 - 1.047 = 8.120 m
ATTACHMENT_HEIGHT_M = calculate_attachment_height_above_ground_m(
    pole_height_m=POLE_HEIGHT_M,
    embedment_ratio=EMBEDMENT_RATIO,
    attachment_height_below_pole_top_m=ATTACHMENT_HEIGHT_BELOW_POLE_TOP_M,
)


# ---------------------------------------------------------------------------
# Helper: derive theta_start, theta_end for each pole from sample line data
# ---------------------------------------------------------------------------
SAMPLE_ANGLES_DEG = [0.0, 14.0, 4.0, 4.0, 2.0, 5.0, 40.0, 4.0, 15.0, 8.0, 2.0, 5.0, 0.0]


def get_angles_for_pole(pole_no: int) -> tuple[float, float]:
    idx = pole_no - 1
    theta_start = SAMPLE_ANGLES_DEG[idx]
    theta_end = SAMPLE_ANGLES_DEG[idx + 1] if idx + 1 < len(SAMPLE_ANGLES_DEG) else 0.0
    return theta_start, theta_end


# ---------------------------------------------------------------------------
# Tests: Phase Separation
# ---------------------------------------------------------------------------

class TestRequiredPhaseSeparation:
    """Test D = 0.75*sqrt(s) + V²/20000 against reference."""

    def test_all_poles(self, ref):
        mismatches = []
        for entry in ref["phase_separation"]:
            pole = entry["pole_no"]
            sag_65 = entry["sag_65_c1_m"]
            expected = entry["required_separation_m"]
            computed = round(calculate_required_phase_separation_m(sag_65, LINE_VOLTAGE_KV), 3)
            if abs(computed - expected) > 0.001:
                mismatches.append(
                    f"Pole {pole}: computed={computed:.3f} expected={expected:.3f}"
                )
        assert not mismatches, "Required separation mismatches:\n" + "\n".join(mismatches)

    def test_pole1_exact(self):
        result = round(calculate_required_phase_separation_m(0.563, 11.0), 3)
        assert result == 0.569, f"Expected 0.569 got {result}"

    def test_pole9_smallest_sag(self):
        result = round(calculate_required_phase_separation_m(0.395, 11.0), 3)
        assert result == 0.477, f"Expected 0.477 got {result}"


class TestSeparationAtAngle:
    """Test cos reduction against reference."""

    def test_all_poles(self, ref):
        mismatches = []
        for entry in ref["phase_separation"]:
            pole = entry["pole_no"]
            expected_actual = entry["separation_at_angle_m"]
            theta_start, theta_end = get_angles_for_pole(pole)
            _, _, d_actual = calculate_separation_at_angle_m(STRAIGHT_SEP_M, theta_start, theta_end)
            if abs(d_actual - expected_actual) > 0.001:
                mismatches.append(
                    f"Pole {pole} (θ={theta_start}°/{theta_end}°): "
                    f"computed={d_actual:.3f} expected={expected_actual:.3f}"
                )
        assert not mismatches, "Separation-at-angle mismatches:\n" + "\n".join(mismatches)

    def test_pole1_terminal_start(self):
        d_start, d_end, d_actual = calculate_separation_at_angle_m(1.100, 0.0, 14.0)
        assert d_start == 1.100, f"Expected 1.100 got {d_start}"
        assert d_end == 1.092, f"Expected 1.092 got {d_end}"
        assert d_actual == 1.092, f"Expected 1.092 got {d_actual}"

    def test_pole7_large_angle(self):
        d_start, d_end, d_actual = calculate_separation_at_angle_m(1.100, 40.0, 4.0)
        assert d_start == 1.034, f"Expected 1.034 got {d_start}"
        assert d_actual == 1.034, f"Expected 1.034 got {d_actual}"


class TestMaxCrossarmAngle:
    """Test max angle = 2*arccos(D_req/straight) against reference."""

    def test_all_poles(self, ref):
        mismatches = []
        for entry in ref["phase_separation"]:
            pole = entry["pole_no"]
            d_req = entry["required_separation_m"]
            ref_str = entry["max_angle_crossarm"]
            ref_val = int(ref_str.split("/")[0].strip())
            computed = calculate_max_crossarm_angle_deg(d_req, STRAIGHT_SEP_M)
            if computed != ref_val:
                mismatches.append(
                    f"Pole {pole}: computed={computed}° expected={ref_val}°"
                )
        assert not mismatches, "Max angle mismatches:\n" + "\n".join(mismatches)

    def test_pole1_max_angle(self):
        result = calculate_max_crossarm_angle_deg(0.569, 1.100)
        assert result == 117, f"Expected 117 got {result}"

    def test_pole9_max_angle(self):
        result = calculate_max_crossarm_angle_deg(0.477, 1.100)
        assert result == 128, f"Expected 128 got {result}"


class TestSeparationCheck:
    """Test PASS/FAIL status for phase separation."""

    def test_all_poles_pass(self, ref):
        mismatches = []
        for entry in ref["phase_separation"]:
            pole = entry["pole_no"]
            sag_65 = entry["sag_65_c1_m"]
            expected = entry["separation_check"]
            theta_start, theta_end = get_angles_for_pole(pole)
            status = evaluate_phase_separation(
                sag_65, LINE_VOLTAGE_KV, STRAIGHT_SEP_M, theta_start, theta_end
            )
            if status != expected:
                mismatches.append(f"Pole {pole}: computed={status} expected={expected}")
        assert not mismatches, "Separation check mismatches:\n" + "\n".join(mismatches)

    def test_missing_input_returns_not_assessed(self):
        assert evaluate_phase_separation(None, 11.0, 1.1, 0.0, 0.0) == "NOT ASSESSED"
        assert evaluate_phase_separation(0.5, None, 1.1, 0.0, 0.0) == "NOT ASSESSED"
        assert evaluate_phase_separation(0.5, 11.0, None, 0.0, 0.0) == "NOT ASSESSED"


# ---------------------------------------------------------------------------
# Tests: Ground Clearance
# ---------------------------------------------------------------------------

class TestLowestGroundClearance:
    """Test lowest_clearance = attachment_height + terrain - sag_65."""

    def test_attachment_height_from_explicit_inputs(self):
        """Verify attachment height using explicit test input (back-calculated from result.pdf, source pending)."""
        attachment_m = calculate_attachment_height_above_ground_m(
            pole_height_m=POLE_HEIGHT_M,
            embedment_ratio=EMBEDMENT_RATIO,
            attachment_height_below_pole_top_m=ATTACHMENT_HEIGHT_BELOW_POLE_TOP_M,
        )
        assert attachment_m is not None
        assert abs(attachment_m - 8.120) < 0.001, f"Expected 8.120 got {attachment_m}"

    def test_all_poles(self, ref):
        mismatches = []
        for entry in ref["ground_clearance"]:
            pole = entry["pole"]
            terrain = entry["max_terrain_height_m"]
            sag_65 = entry["max_sag_65_c1_m"]
            expected = entry["lowest_clearance_m"]
            computed = calculate_lowest_ground_clearance_m(ATTACHMENT_HEIGHT_M, terrain, sag_65)
            if computed is None or abs(computed - expected) > 0.001:
                mismatches.append(
                    f"Pole {pole}: computed={computed} expected={expected:.3f}"
                )
        assert not mismatches, "Ground clearance mismatches:\n" + "\n".join(mismatches)

    def test_pole1_exact(self):
        result = calculate_lowest_ground_clearance_m(8.120, 0.0, 0.563)
        assert result == 7.557, f"Expected 7.557 got {result}"

    def test_pole2_exact(self):
        result = calculate_lowest_ground_clearance_m(8.120, 0.0, 0.775)
        assert result == 7.345, f"Expected 7.345 got {result}"


class TestGroundClearanceCheck:
    """Test SATISFIED/FAIL status."""

    def test_all_poles_satisfied(self, ref):
        mismatches = []
        for entry in ref["ground_clearance"]:
            pole = entry["pole"]
            expected = entry["ground_clearance_check"]
            computed = evaluate_ground_clearance(
                entry["lowest_clearance_m"],
                entry["applicable_clearance_m"],
            )
            if computed != expected:
                mismatches.append(f"Pole {pole}: computed={computed} expected={expected}")
        assert not mismatches, "Ground clearance check mismatches:\n" + "\n".join(mismatches)

    def test_satisfied(self):
        assert evaluate_ground_clearance(7.557, 5.50) == "SATISFIED"

    def test_fail(self):
        assert evaluate_ground_clearance(5.00, 5.50) == "FAIL"

    def test_exactly_equal_is_satisfied(self):
        assert evaluate_ground_clearance(5.50, 5.50) == "SATISFIED"


# ---------------------------------------------------------------------------
# Tests: Circuit-to-Circuit Clearance
# ---------------------------------------------------------------------------

class TestCircuitClearance:
    """Test circuit clearance against result_reference.json using explicit test input."""

    def test_all_poles(self, ref):
        mismatches = []
        for entry in ref["ground_clearance"]:
            pole = entry["pole"]
            expected = entry["circuit_clearance_check"]
            # VERTICAL_SPACING_11KV_LV_M: back-calculated from result.pdf, source pending
            computed = evaluate_circuit_clearance(
                VERTICAL_SPACING_11KV_LV_M,
                entry["req_vert_clear_m"],
            )
            if computed != expected:
                mismatches.append(f"Pole {pole}: computed={computed} expected={expected}")
        assert not mismatches, "Circuit clearance check mismatches:\n" + "\n".join(mismatches)

    def test_reference_values(self, ref):
        for entry in ref["ground_clearance"]:
            assert entry["min_vert_clear_c1_c2_m"] == 1.454
            assert entry["req_vert_clear_m"] == 1.20

    def test_satisfied(self):
        assert evaluate_circuit_clearance(1.454, 1.20) == "SATISFIED"

    def test_fail(self):
        assert evaluate_circuit_clearance(1.10, 1.20) == "FAIL"

    def test_exactly_equal_is_satisfied(self):
        assert evaluate_circuit_clearance(1.20, 1.20) == "SATISFIED"


# ---------------------------------------------------------------------------
# Tests: Missing Explicit Inputs Fail Closed (Phase 4B Requirement 4)
# ---------------------------------------------------------------------------

class TestMissingInputsFailClosed:
    """Verify engine returns NOT ASSESSED with reason 'input needed' when explicit inputs are missing."""

    def test_missing_attachment_height_below_pole_top_returns_not_assessed(self):
        res = compute_pole_clearance(
            pole_no=1,
            section=1,
            sag_65_m=0.563,
            line_voltage_kv=11.0,
            straight_sep_m=1.1,
            theta_start_deg=0.0,
            theta_end_deg=14.0,
            pole_height_m=11.0,
            embedment_ratio=1.0 / 6.0,
            attachment_height_below_pole_top_m=None,  # MISSING
            terrain_height_m=0.0,
            applicable_clearance_m=5.50,
            vertical_spacing_11kv_lv_m=1.454,
            req_vert_clear_m=1.20,
        )
        assert res.ground_clearance_check == "NOT ASSESSED"
        assert res.ground_clearance_reason == "input needed"
        assert res.attachment_height_m is None
        assert res.lowest_clearance_m is None
        assert any("attachment height below pole top" in w for w in res.warnings)

    def test_missing_vertical_spacing_returns_not_assessed(self):
        res = compute_pole_clearance(
            pole_no=1,
            section=1,
            sag_65_m=0.563,
            line_voltage_kv=11.0,
            straight_sep_m=1.1,
            theta_start_deg=0.0,
            theta_end_deg=14.0,
            pole_height_m=11.0,
            embedment_ratio=1.0 / 6.0,
            attachment_height_below_pole_top_m=1.047,
            terrain_height_m=0.0,
            applicable_clearance_m=5.50,
            vertical_spacing_11kv_lv_m=None,  # MISSING
            req_vert_clear_m=1.20,
        )
        assert res.circuit_clearance_check == "NOT ASSESSED"
        assert res.circuit_clearance_reason == "input needed"
        assert res.min_vert_clear_m is None
        assert any("vertical spacing" in w for w in res.warnings)

    def test_missing_both_explicit_inputs_returns_not_assessed(self):
        res = compute_pole_clearance(
            pole_no=1,
            section=1,
            sag_65_m=0.563,
            line_voltage_kv=11.0,
            straight_sep_m=1.1,
            theta_start_deg=0.0,
            theta_end_deg=14.0,
            pole_height_m=11.0,
            embedment_ratio=1.0 / 6.0,
            attachment_height_below_pole_top_m=None,  # MISSING
            terrain_height_m=0.0,
            applicable_clearance_m=5.50,
            vertical_spacing_11kv_lv_m=None,          # MISSING
            req_vert_clear_m=1.20,
        )
        assert res.ground_clearance_check == "NOT ASSESSED"
        assert res.ground_clearance_reason == "input needed"
        assert res.circuit_clearance_check == "NOT ASSESSED"
        assert res.circuit_clearance_reason == "input needed"

    def test_missing_terrain_height_returns_not_assessed(self):
        """terrain_height_m=None → ground clearance NOT ASSESSED with 'input needed'."""
        res = compute_pole_clearance(
            pole_no=1,
            section=1,
            sag_65_m=0.563,
            line_voltage_kv=11.0,
            straight_sep_m=1.1,
            theta_start_deg=0.0,
            theta_end_deg=14.0,
            pole_height_m=11.0,
            embedment_ratio=1.0 / 6.0,
            attachment_height_below_pole_top_m=1.047,  # back-calculated from result.pdf, source pending
            terrain_height_m=None,  # MISSING
            applicable_clearance_m=5.50,
            vertical_spacing_11kv_lv_m=1.454,
            req_vert_clear_m=1.20,
        )
        assert res.ground_clearance_check == "NOT ASSESSED"
        assert res.ground_clearance_reason == "input needed"
        assert res.lowest_clearance_m is None
        assert any("terrain height" in w for w in res.warnings)

    def test_evaluate_ground_clearance_none_inputs(self):
        assert evaluate_ground_clearance(None, 5.50) == "NOT ASSESSED"
        assert evaluate_ground_clearance(7.557, None) == "NOT ASSESSED"
        status, reason = assess_ground_clearance(None, 5.50)
        assert status == "NOT ASSESSED"
        assert reason == "input needed"

    def test_evaluate_circuit_clearance_none_inputs(self):
        assert evaluate_circuit_clearance(None, 1.20) == "NOT ASSESSED"
        assert evaluate_circuit_clearance(1.454, None) == "NOT ASSESSED"
        status, reason = assess_circuit_clearance(None, 1.20)
        assert status == "NOT ASSESSED"
        assert reason == "input needed"
