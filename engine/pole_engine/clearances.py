"""
Phase 4B – Clearances and Phase Separation Engine.

All formulas trace to docs/result.pdf (pages 7–9).
No hard-coded engineering constants or fitted defaults.
Inputs not available in master data ('attachment height below pole top' and
'vertical spacing between 11 kV and LV') must be supplied as explicit project
inputs; if missing, ground clearance and circuit clearance return NOT ASSESSED
with the reason 'input needed'.

Unit conventions
----------------
  _m   : metres
  _kv  : kilovolts
  _deg : degrees (decimal)
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# 1. Phase Separation (PDF page 9)
# ---------------------------------------------------------------------------

def calculate_required_phase_separation_m(
    sag_65_m: float,
    line_voltage_kv: float,
) -> float:
    """
    Required phase separation D (metres):
        D = 0.75 * sqrt(sag_65_m) + V^2 / 20 000

    Where sag_65_m is the maximum sag at 65 °C in metres and line_voltage_kv (V)
    is the line voltage in kV taken from the circuit's voltage band.
    No literal default is assumed. Sourced from docs/result.pdf page 9 note.
    """
    if sag_65_m < 0:
        raise ValueError(f"sag_65_m must be >= 0, got {sag_65_m}")
    if line_voltage_kv <= 0:
        raise ValueError(f"line_voltage_kv must be > 0, got {line_voltage_kv}")
    return 0.75 * math.sqrt(sag_65_m) + (line_voltage_kv ** 2) / 20_000.0


def calculate_separation_at_angle_m(
    straight_sep_m: float,
    theta_start_deg: float,
    theta_end_deg: float,
) -> tuple[float, float, float]:
    """
    Separation reduction at line angle (PDF page 9).

    Returns (D_start_m, D_end_m, D_actual_m) where:
        D_start = straight_sep * cos(theta_start / 2)
        D_end   = straight_sep * cos(theta_end   / 2)
        D_actual = min(D_start, D_end)

    Terminal poles must pass theta = 0 so their component equals straight_sep.
    """
    d_start_m = straight_sep_m * math.cos(math.radians(theta_start_deg / 2.0))
    d_end_m = straight_sep_m * math.cos(math.radians(theta_end_deg / 2.0))
    d_actual_m = min(d_start_m, d_end_m)
    return round(d_start_m, 3), round(d_end_m, 3), round(d_actual_m, 3)


def calculate_max_crossarm_angle_deg(
    required_sep_m: float,
    straight_sep_m: float,
) -> int:
    """
    Maximum line angle the crossarm can accommodate (degrees, integer):
        max_angle = 2 * arccos(D_required / straight_sep)

    Returns 0 when D_required >= straight_sep (no angle possible).
    Result is floor-rounded to match the reference document convention.
    """
    if required_sep_m >= straight_sep_m:
        return 0
    ratio = required_sep_m / straight_sep_m
    ratio = max(-1.0, min(1.0, ratio))
    angle_rad = 2.0 * math.acos(ratio)
    angle_deg = math.degrees(angle_rad)
    return int(angle_deg)


def evaluate_phase_separation(
    sag_65_m: Optional[float],
    line_voltage_kv: Optional[float],
    straight_sep_m: Optional[float],
    theta_start_deg: Optional[float],
    theta_end_deg: Optional[float],
) -> str:
    """
    Returns 'PASS' if D_actual > D_required, 'FAIL' otherwise.
    Returns 'NOT ASSESSED' if any required input is missing or invalid.
    """
    if any(v is None for v in [sag_65_m, line_voltage_kv, straight_sep_m,
                                theta_start_deg, theta_end_deg]):
        return "NOT ASSESSED"
    try:
        d_req_m = calculate_required_phase_separation_m(sag_65_m, line_voltage_kv)
        _, _, d_actual_m = calculate_separation_at_angle_m(
            straight_sep_m, theta_start_deg, theta_end_deg
        )
        return "PASS" if d_actual_m > d_req_m else "FAIL"
    except (ValueError, ZeroDivisionError):
        return "NOT ASSESSED"


# ---------------------------------------------------------------------------
# 2. Ground Clearance (PDF pages 7–8)
# ---------------------------------------------------------------------------

def calculate_attachment_height_above_ground_m(
    pole_height_m: Optional[float],
    embedment_ratio: Optional[float],
    attachment_height_below_pole_top_m: Optional[float],
) -> Optional[float]:
    """
    Calculate attachment height above ground level (m):
        attachment_height = pole_height * (1 - embedment_ratio) - attachment_height_below_pole_top_m

    All three inputs must be explicitly provided. No default constants are assumed.
    Returns None if any input is None.
    """
    if pole_height_m is None or embedment_ratio is None or attachment_height_below_pole_top_m is None:
        return None
    above_ground_m = pole_height_m * (1.0 - embedment_ratio)
    return round(above_ground_m - attachment_height_below_pole_top_m, 3)


def calculate_lowest_ground_clearance_m(
    attachment_height_m: Optional[float],
    terrain_height_m: Optional[float],
    max_sag_65_m: Optional[float],
) -> Optional[float]:
    """
    Lowest clearance of the bottom circuit above ground:
        lowest = attachment_height + terrain_height - max_sag_65

    attachment_height_m : LV conductor attachment height above ground level.
    terrain_height_m    : additional ground rise at mid-span.
    max_sag_65_m        : maximum sag at 65 °C in metres.
    Returns None if any input is None.
    """
    if attachment_height_m is None or terrain_height_m is None or max_sag_65_m is None:
        return None
    return round(attachment_height_m + terrain_height_m - max_sag_65_m, 3)


def assess_ground_clearance(
    lowest_clearance_m: Optional[float],
    applicable_clearance_m: Optional[float],
) -> tuple[str, Optional[str]]:
    """
    Assess ground clearance.
    Returns (status, reason):
      ('SATISFIED', None) if lowest >= applicable
      ('FAIL', 'lowest clearance below applicable standard') if lowest < applicable
      ('NOT ASSESSED', 'input needed') if any input is None
    """
    if lowest_clearance_m is None or applicable_clearance_m is None:
        return "NOT ASSESSED", "input needed"
    if lowest_clearance_m >= applicable_clearance_m:
        return "SATISFIED", None
    return "FAIL", "lowest clearance below applicable standard"


def evaluate_ground_clearance(
    lowest_clearance_m: Optional[float],
    applicable_clearance_m: Optional[float],
) -> str:
    """
    'SATISFIED' if lowest_clearance_m >= applicable_clearance_m, else 'FAIL'.
    Returns 'NOT ASSESSED' if any input is None.
    """
    status, _ = assess_ground_clearance(lowest_clearance_m, applicable_clearance_m)
    return status


# ---------------------------------------------------------------------------
# 3. Circuit-to-Circuit Clearance (PDF page 8)
# ---------------------------------------------------------------------------

def assess_circuit_clearance(
    actual_clearance_m: Optional[float],
    required_clearance_m: Optional[float],
) -> tuple[str, Optional[str]]:
    """
    Assess circuit-to-circuit clearance.
    Returns (status, reason):
      ('SATISFIED', None) if actual >= required
      ('FAIL', 'circuit clearance below required threshold') if actual < required
      ('NOT ASSESSED', 'input needed') if any input is None
    """
    if actual_clearance_m is None or required_clearance_m is None:
        return "NOT ASSESSED", "input needed"
    if actual_clearance_m >= required_clearance_m:
        return "SATISFIED", None
    return "FAIL", "circuit clearance below required threshold"


def evaluate_circuit_clearance(
    actual_clearance_m: Optional[float],
    required_clearance_m: Optional[float],
) -> str:
    """
    'SATISFIED' if actual >= required, else 'FAIL'.
    Returns 'NOT ASSESSED' if any input is None.
    """
    status, _ = assess_circuit_clearance(actual_clearance_m, required_clearance_m)
    return status


# ---------------------------------------------------------------------------
# 4. Full pole clearance result dataclass
# ---------------------------------------------------------------------------

@dataclass
class PoleClearanceResult:
    """Clearance results for a single pole."""
    pole_no: int
    section: int

    # Phase separation
    sag_65_m: Optional[float]
    required_separation_m: Optional[float]
    crossarm_straight_m: Optional[float]
    theta_start_deg: Optional[float]
    theta_end_deg: Optional[float]
    separation_start_m: Optional[float]
    separation_end_m: Optional[float]
    separation_actual_m: Optional[float]
    max_angle_start_deg: Optional[int]
    max_angle_end_deg: Optional[int]
    separation_check: str
    separation_reason: Optional[str] = None

    # Ground clearance
    attachment_height_m: Optional[float] = None
    attachment_height_below_pole_top_m: Optional[float] = None
    terrain_height_m: Optional[float] = None
    lowest_clearance_m: Optional[float] = None
    applicable_clearance_m: Optional[float] = None
    ground_clearance_check: str = "NOT ASSESSED"
    ground_clearance_reason: Optional[str] = None

    # Circuit-to-circuit clearance
    min_vert_clear_m: Optional[float] = None
    req_vert_clear_m: Optional[float] = None
    circuit_clearance_check: str = "NOT ASSESSED"
    circuit_clearance_reason: Optional[str] = None

    # Warnings from needs_confirmation rows or missing inputs
    warnings: list[str] = field(default_factory=list)


def compute_pole_clearance(
    pole_no: int,
    section: int,
    sag_65_m: Optional[float],
    line_voltage_kv: Optional[float],
    straight_sep_m: Optional[float],
    theta_start_deg: Optional[float],
    theta_end_deg: Optional[float],
    pole_height_m: Optional[float],
    embedment_ratio: Optional[float],
    attachment_height_below_pole_top_m: Optional[float],
    terrain_height_m: Optional[float] = None,
    applicable_clearance_m: Optional[float] = None,
    vertical_spacing_11kv_lv_m: Optional[float] = None,
    req_vert_clear_m: Optional[float] = None,
) -> PoleClearanceResult:
    """
    Pure-Python calculation of clearances for a single pole.
    Fails closed: if any input is missing, checks return 'NOT ASSESSED' with reason 'input needed'.
    No constants or defaults are assumed.
    """
    warnings: list[str] = []

    # 1. Phase separation
    req_sep_m = None
    sep_start = sep_end = sep_actual = None
    max_angle = None
    sep_check = "NOT ASSESSED"
    sep_reason = None

    if any(v is None for v in [sag_65_m, line_voltage_kv, straight_sep_m, theta_start_deg, theta_end_deg]):
        sep_check = "NOT ASSESSED"
        sep_reason = "input needed"
    else:
        try:
            req_sep_m = round(calculate_required_phase_separation_m(sag_65_m, line_voltage_kv), 3)
            sep_start, sep_end, sep_actual = calculate_separation_at_angle_m(straight_sep_m, theta_start_deg, theta_end_deg)
            max_angle = calculate_max_crossarm_angle_deg(req_sep_m, straight_sep_m)
            sep_check = evaluate_phase_separation(sag_65_m, line_voltage_kv, straight_sep_m, theta_start_deg, theta_end_deg)
        except Exception as exc:
            sep_check = "NOT ASSESSED"
            sep_reason = f"calculation error: {exc}"
            warnings.append(f"Pole {pole_no}: phase separation error: {exc}")

    # 2. Ground clearance
    attachment_height_m = None
    lowest_clearance_m = None
    gc_check = "NOT ASSESSED"
    gc_reason = None

    if attachment_height_below_pole_top_m is None:
        gc_check = "NOT ASSESSED"
        gc_reason = "input needed"
        warnings.append(f"Pole {pole_no}: ground clearance NOT ASSESSED (input needed: attachment height below pole top)")
    elif pole_height_m is None or embedment_ratio is None:
        gc_check = "NOT ASSESSED"
        gc_reason = "input needed"
        warnings.append(f"Pole {pole_no}: ground clearance NOT ASSESSED (input needed: pole height or embedment ratio)")
    elif terrain_height_m is None:
        gc_check = "NOT ASSESSED"
        gc_reason = "input needed"
        warnings.append(f"Pole {pole_no}: ground clearance NOT ASSESSED (input needed: terrain height)")
    else:
        attachment_height_m = calculate_attachment_height_above_ground_m(
            pole_height_m, embedment_ratio, attachment_height_below_pole_top_m
        )
        lowest_clearance_m = calculate_lowest_ground_clearance_m(attachment_height_m, terrain_height_m, sag_65_m)
        gc_check, gc_reason = assess_ground_clearance(lowest_clearance_m, applicable_clearance_m)

    # 3. Circuit-to-circuit clearance
    min_vert_clear_m = None
    cc_check = "NOT ASSESSED"
    cc_reason = None

    if vertical_spacing_11kv_lv_m is None:
        cc_check = "NOT ASSESSED"
        cc_reason = "input needed"
        warnings.append(f"Pole {pole_no}: circuit clearance NOT ASSESSED (input needed: vertical spacing between the 11 kV and LV attachments)")
    else:
        min_vert_clear_m = vertical_spacing_11kv_lv_m
        cc_check, cc_reason = assess_circuit_clearance(min_vert_clear_m, req_vert_clear_m)

    return PoleClearanceResult(
        pole_no=pole_no,
        section=section,
        sag_65_m=sag_65_m,
        required_separation_m=req_sep_m,
        crossarm_straight_m=straight_sep_m,
        theta_start_deg=theta_start_deg,
        theta_end_deg=theta_end_deg,
        separation_start_m=sep_start,
        separation_end_m=sep_end,
        separation_actual_m=sep_actual,
        max_angle_start_deg=max_angle,
        max_angle_end_deg=max_angle,
        separation_check=sep_check,
        separation_reason=sep_reason,
        attachment_height_m=attachment_height_m,
        attachment_height_below_pole_top_m=attachment_height_below_pole_top_m,
        terrain_height_m=terrain_height_m,
        lowest_clearance_m=lowest_clearance_m,
        applicable_clearance_m=applicable_clearance_m,
        ground_clearance_check=gc_check,
        ground_clearance_reason=gc_reason,
        min_vert_clear_m=min_vert_clear_m,
        req_vert_clear_m=req_vert_clear_m,
        circuit_clearance_check=cc_check,
        circuit_clearance_reason=cc_reason,
        warnings=warnings,
    )
