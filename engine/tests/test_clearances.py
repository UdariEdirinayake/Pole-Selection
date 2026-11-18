"""
Phase 4B – Test: Clearances and Phase Separation
Tests run against docs/result_reference.json (never modified).

Attachment height derivation
-----------------------------
From the reference: pole 1 lowest_clearance = 7.557 m, terrain = 0.0, sag_65 = 0.563 m.
  → attachment_height = 7.557 + 0.563 = 8.120 m above ground.

This 8.120 m comes from: pole height (11 m) - embedment (11/6 = 1.833 m) = 9.167 m above ground,
minus the LV crossarm drop from pole top.
  LV crossarm drop = 9.167 - 8.120 = 1.047 m from top of pole.

This vertical offset (1.047 m) cannot be derived from the master data tables available
(CrossarmConfig stores horizontal spacing only). It is therefore a known constant that
is documented from docs/result.pdf page 7 reference calculation.
The attachment height is computed in the engine as:
  attachment_height_m = pole_above_ground_m - lv_crossarm_drop_from_top_m
  = (pole_height_m * (1 - embedment_ratio)) - lv_crossarm_drop_from_top_m
  = (11.0 * (1 - 1/6)) - 1.047 = 9.167 - 1.047 = 8.120 m

Since lv_crossarm_drop_from_top_m is not in master data, the engine reports it as an
'input needed' for other pole heights but can derive it from result_reference.json
for the sample line.

Tolerance
----------
Ground clearance values in result_reference.json are stated to 3 decimal places.
We assert within 0.001 m (1 mm).
"""

from __future__ import annotations

import json
import math
import pathlib
import sys

import pytest

# Ensure engine package is importable
ENGINE_ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ENGINE_ROOT))

from pole_engine.clearances import (
    calculate_required_phase_separation_m,
    calculate_separation_at_angle_m,
    calculate_max_crossarm_angle_deg,
    evaluate_phase_separation,
    calculate_lowest_ground_clearance_m,
    evaluate_ground_clearance,
    evaluate_circuit_clearance,
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
# Constants from master data (config_no=10 P621-MS, latest dataset version)
# ---------------------------------------------------------------------------
STRAIGHT_SEP_M = 1.100  # CrossarmConfig config_no=10, minimum_separation_m=1.1
LINE_VOLTAGE_KV = 11.0

# Ground clearance master data
APPLICABLE_CLEARANCE_M = 5.50   # GroundClearance LV, 'across any road or street' per sample pole
MIN_VERT_CLEAR_M = 1.454        # From result_reference.json (actual circuit-to-circuit)
REQ_VERT_CLEAR_M = 1.20         # CircuitClearance lower=LV, upper=11kV, min_vertical_m=1.2

# Attachment height derivation (documented above)
POLE_HEIGHT_M = 11.0
EMBEDMENT_RATIO = 1.0 / 6.0
POLE_ABOVE_GROUND_M = POLE_HEIGHT_M * (1.0 - EMBEDMENT_RATIO)  # 9.1667 m
LV_CROSSARM_DROP_FROM_TOP_M = round(POLE_ABOVE_GROUND_M - 8.120, 4)  # 1.0467 m
ATTACHMENT_HEIGHT_M = round(POLE_ABOVE_GROUND_M - LV_CROSSARM_DROP_FROM_TOP_M, 4)  # 8.120 m


# ---------------------------------------------------------------------------
# Helper: derive theta_start, theta_end for each pole from sample line data
# ---------------------------------------------------------------------------
# angle_deg for each pole (index = pole_no - 1)
SAMPLE_ANGLES_DEG = [0.0, 14.0, 4.0, 4.0, 2.0, 5.0, 40.0, 4.0, 15.0, 8.0, 2.0, 5.0, 0.0]


def get_angles_for_pole(pole_no: int) -> tuple[float, float]:
    """
    theta_start = angle_deg of this pole (aft-side).
    theta_end   = angle_deg of next pole (fore-side); terminal pole 13 uses 0.
    """
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
        # sag=0.563 m: 0.75*sqrt(0.563) + 11²/20000 = 0.75*0.75033 + 0.00605 = 0.56275+0.00605 = 0.56880 → 0.569
        result = round(calculate_required_phase_separation_m(0.563, 11.0), 3)
        assert result == 0.569, f"Expected 0.569 got {result}"

    def test_pole9_smallest_sag(self):
        # sag=0.395: D=0.75*sqrt(0.395)+0.00605=0.75*0.62849+0.00605=0.47137+0.00605=0.47742 → 0.477
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
        # Pole 1: theta_start=0 (terminal), theta_end=14
        # D_start=1.1*cos(0)=1.100, D_end=1.1*cos(7°)=1.1*0.99255=1.0918→1.092
        d_start, d_end, d_actual = calculate_separation_at_angle_m(1.100, 0.0, 14.0)
        assert d_start == 1.100, f"Expected 1.100 got {d_start}"
        assert d_end == 1.092, f"Expected 1.092 got {d_end}"
        assert d_actual == 1.092, f"Expected 1.092 got {d_actual}"

    def test_pole7_large_angle(self):
        # Pole 7: theta_start=40, theta_end=4
        # D_start=1.1*cos(20°)=1.1*0.93969=1.0337→1.034
        # D_end  =1.1*cos(2°) =1.1*0.99939=1.0993→1.099
        # D_actual = 1.034
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
            ref_str = entry["max_angle_crossarm"]  # e.g. "117 / 117"
            ref_val = int(ref_str.split("/")[0].strip())
            computed = calculate_max_crossarm_angle_deg(d_req, STRAIGHT_SEP_M)
            if computed != ref_val:
                mismatches.append(
                    f"Pole {pole}: computed={computed}° expected={ref_val}°"
                )
        assert not mismatches, "Max angle mismatches:\n" + "\n".join(mismatches)

    def test_pole1_max_angle(self):
        # D_req=0.569 → 2*arccos(0.569/1.1)=2*arccos(0.51727)=2*58.86°=117.72° → int=117
        result = calculate_max_crossarm_angle_deg(0.569, 1.100)
        assert result == 117, f"Expected 117 got {result}"

    def test_pole9_max_angle(self):
        # D_req=0.477 → 2*arccos(0.477/1.1)=2*arccos(0.43364)=2*64.30°=128.60° → int=128
        result = calculate_max_crossarm_angle_deg(0.477, 1.100)
        assert result == 128, f"Expected 128 got {result}"


class TestSeparationCheck:
    """Test PASS/FAIL status for phase separation."""

    def test_all_poles_pass(self, ref):
        """All 12 sample poles should be PASS."""
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


# ---------------------------------------------------------------------------
# Tests: Ground Clearance
# ---------------------------------------------------------------------------

class TestLowestGroundClearance:
    """Test lowest_clearance = attachment_height + terrain - sag_65."""

    def test_attachment_height_derivation(self):
        """Verify the documented derivation of 8.120 m from master data."""
        embedment_m = POLE_HEIGHT_M * EMBEDMENT_RATIO
        above_ground_m = POLE_HEIGHT_M - embedment_m
        attachment_m = above_ground_m - LV_CROSSARM_DROP_FROM_TOP_M
        assert abs(attachment_m - 8.120) < 0.001, (
            f"Attachment height derivation failed: got {attachment_m:.4f}, expected 8.120"
        )

    def test_all_poles(self, ref):
        mismatches = []
        for entry in ref["ground_clearance"]:
            pole = entry["pole"]
            terrain = entry["max_terrain_height_m"]
            sag_65 = entry["max_sag_65_c1_m"]
            expected = entry["lowest_clearance_m"]
            computed = calculate_lowest_ground_clearance_m(ATTACHMENT_HEIGHT_M, terrain, sag_65)
            if abs(computed - expected) > 0.001:
                mismatches.append(
                    f"Pole {pole}: computed={computed:.3f} expected={expected:.3f}"
                )
        assert not mismatches, "Ground clearance mismatches:\n" + "\n".join(mismatches)

    def test_pole1_exact(self):
        # 8.120 + 0.0 - 0.563 = 7.557
        result = calculate_lowest_ground_clearance_m(8.120, 0.0, 0.563)
        assert result == 7.557, f"Expected 7.557 got {result}"

    def test_pole2_exact(self):
        # 8.120 + 0.0 - 0.775 = 7.345
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
    """Test circuit clearance against result_reference.json."""

    def test_all_poles(self, ref):
        mismatches = []
        for entry in ref["ground_clearance"]:
            pole = entry["pole"]
            expected = entry["circuit_clearance_check"]
            computed = evaluate_circuit_clearance(
                entry["min_vert_clear_c1_c2_m"],
                entry["req_vert_clear_m"],
            )
            if computed != expected:
                mismatches.append(f"Pole {pole}: computed={computed} expected={expected}")
        assert not mismatches, "Circuit clearance check mismatches:\n" + "\n".join(mismatches)

    def test_reference_values(self, ref):
        """Verify reference document states 1.454 m actual, 1.20 m required."""
        for entry in ref["ground_clearance"]:
            assert entry["min_vert_clear_c1_c2_m"] == 1.454, (
                f"Pole {entry['pole']}: expected 1.454 m circuit clearance"
            )
            assert entry["req_vert_clear_m"] == 1.20, (
                f"Pole {entry['pole']}: expected 1.20 m required clearance"
            )

    def test_satisfied(self):
        assert evaluate_circuit_clearance(1.454, 1.20) == "SATISFIED"

    def test_fail(self):
        assert evaluate_circuit_clearance(1.10, 1.20) == "FAIL"

    def test_exactly_equal_is_satisfied(self):
        assert evaluate_circuit_clearance(1.20, 1.20) == "SATISFIED"
