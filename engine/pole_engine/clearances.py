"""
Phase 4B – Clearances and Phase Separation Engine.

All formulas trace to docs/result.pdf (pages 7–9).
No hard-coded engineering constants; parameters come from master data or
are reported as 'input needed' when unavailable.

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
    line_voltage_kv: float = 11.0,
) -> float:
    """
    Required phase separation D (metres):
        D = 0.75 * sqrt(sag_65_m) + V^2 / 20 000

    Where sag_65_m is the maximum sag at 65 °C in metres and V is the
    line voltage in kV.  Formula sourced from docs/result.pdf page 9 note.
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
    # Clamp numerical noise
    ratio = max(-1.0, min(1.0, ratio))
    angle_rad = 2.0 * math.acos(ratio)
    angle_deg = math.degrees(angle_rad)
    return int(angle_deg)  # floor (truncate) to match reference


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

def calculate_lowest_ground_clearance_m(
    attachment_height_m: float,
    terrain_height_m: float,
    max_sag_65_m: float,
) -> float:
    """
    Lowest clearance of the bottom circuit above ground:
        lowest = attachment_height + terrain_height - max_sag_65

    attachment_height_m : LV conductor attachment height above ground level.
    terrain_height_m    : additional ground rise at mid-span (default 0.0).
    max_sag_65_m        : maximum sag at 65 °C in metres.
    """
    return round(attachment_height_m + terrain_height_m - max_sag_65_m, 3)


def evaluate_ground_clearance(
    lowest_clearance_m: float,
    applicable_clearance_m: float,
) -> str:
    """
    'SATISFIED' if lowest_clearance_m >= applicable_clearance_m, else 'FAIL'.
    """
    return "SATISFIED" if lowest_clearance_m >= applicable_clearance_m else "FAIL"


# ---------------------------------------------------------------------------
# 3. Circuit-to-Circuit Clearance (PDF page 8)
# ---------------------------------------------------------------------------

def evaluate_circuit_clearance(
    actual_clearance_m: float,
    required_clearance_m: float,
) -> str:
    """
    'SATISFIED' if actual >= required, else 'FAIL'.
    """
    return "SATISFIED" if actual_clearance_m >= required_clearance_m else "FAIL"


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

    # Ground clearance
    attachment_height_m: Optional[float]
    terrain_height_m: Optional[float]
    lowest_clearance_m: Optional[float]
    applicable_clearance_m: Optional[float]
    ground_clearance_check: str

    # Circuit-to-circuit clearance
    min_vert_clear_m: Optional[float]
    req_vert_clear_m: Optional[float]
    circuit_clearance_check: str

    # Warnings from needs_confirmation rows
    warnings: list[str] = field(default_factory=list)
