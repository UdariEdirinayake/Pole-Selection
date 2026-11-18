"""Sag-tension calculation engine according to LECO standards.

Strict rules from AGENTS.md:
- No hard-coded engineering values. Physical constants and thresholds must be loaded or passed in.
- Explicit unit conversion and explicit units in all function names and types.
- Pure Python calculation engine; no web framework code.
- Chart lookup with linear interpolation as specified in docs/result.pdf.
- Never extrapolate outside lookup table bounds -> return NOT ASSESSED.
- Flagged rows (needs_confirmation=True) carry warning messages.
"""
from dataclasses import dataclass, field
import math
from typing import Callable, Optional


@dataclass
class TableLookupPoint:
    """A single span tension point from a master lookup table."""
    span_m: float
    tension_15c_wind_kn: float
    tension_27c_kn: float
    sag_15c_m: float
    sag_27c_m: float
    sag_65c_m: float
    needs_confirmation: bool = False
    confirmation_note: Optional[str] = None


@dataclass
class TableLookupResult:
    """Result of looking up sag-tension data for an equivalent span."""
    is_assessed: bool
    status: str  # 'PASS' | 'NOT ASSESSED'
    reason: Optional[str]
    equivalent_span_m: float
    tension_15c_wind_kn: Optional[float] = None
    tension_27c_kn: Optional[float] = None
    sag_15c_m: Optional[float] = None
    sag_27c_m: Optional[float] = None
    sag_65c_m: Optional[float] = None
    warnings: list[str] = field(default_factory=list)


def calculate_equivalent_span_m(spans_m: list[float]) -> float:
    """Calculate the Ruling / Equivalent Span for a strain section in meters (m).

    Formula:
        L_eq = sqrt(sum(s^3) / sum(s))

    Args:
        spans_m: List of individual span lengths in meters.

    Returns:
        Equivalent span length in meters.

    Raises:
        ValueError: If spans_m is empty or contains zero/negative lengths.
    """
    if not spans_m:
        raise ValueError("Cannot calculate equivalent span from an empty list of spans.")

    for s in spans_m:
        if s <= 0:
            raise ValueError(f"Span length must be strictly positive, got {s} m.")

    sum_cubed = sum(s ** 3 for s in spans_m)
    sum_linear = sum(spans_m)

    return math.sqrt(sum_cubed / sum_linear)


def lookup_sag_tension_table(
    table_points: list[TableLookupPoint],
    equivalent_span_m: float,
) -> TableLookupResult:
    """Look up tensions and sags from a conductor's lookup table by linear interpolation.

    Strict rules:
    - If equivalent_span_m is outside table bounds [min, max], returns NOT ASSESSED with explanation.
    - Never extrapolates.
    - If bounding points have needs_confirmation=True, results carry a warning list.

    Args:
        table_points: List of TableLookupPoint sorted by span_m.
        equivalent_span_m: Equivalent span in meters.

    Returns:
        TableLookupResult with interpolated values or NOT ASSESSED status.
    """
    if not table_points:
        return TableLookupResult(
            is_assessed=False,
            status="NOT ASSESSED",
            reason="Lookup table has no calibration data points.",
            equivalent_span_m=equivalent_span_m,
        )

    # Sort points by span_m
    pts = sorted(table_points, key=lambda p: p.span_m)
    min_span = pts[0].span_m
    max_span = pts[-1].span_m

    if equivalent_span_m < min_span or equivalent_span_m > max_span:
        return TableLookupResult(
            is_assessed=False,
            status="NOT ASSESSED",
            reason=(
                f"Equivalent span {equivalent_span_m:.2f} m is outside lookup table range "
                f"[{min_span:.1f} m, {max_span:.1f} m]. Extrapolation is strictly forbidden."
            ),
            equivalent_span_m=equivalent_span_m,
        )

    # Check for exact match
    for p in pts:
        if math.isclose(p.span_m, equivalent_span_m, rel_tol=1e-6):
            warnings = []
            if p.needs_confirmation:
                warnings.append(
                    f"Lookup point at {p.span_m:.1f} m requires confirmation: {p.confirmation_note or 'Unverified calibration data'}"
                )
            return TableLookupResult(
                is_assessed=True,
                status="PASS",
                reason=None,
                equivalent_span_m=equivalent_span_m,
                tension_15c_wind_kn=p.tension_15c_wind_kn,
                tension_27c_kn=p.tension_27c_kn,
                sag_15c_m=p.sag_15c_m,
                sag_27c_m=p.sag_27c_m,
                sag_65c_m=p.sag_65c_m,
                warnings=warnings,
            )

    # Find interval for linear interpolation
    p1 = None
    p2 = None
    for i in range(len(pts) - 1):
        if pts[i].span_m <= equivalent_span_m <= pts[i + 1].span_m:
            p1 = pts[i]
            p2 = pts[i + 1]
            break

    if p1 is None or p2 is None:
        return TableLookupResult(
            is_assessed=False,
            status="NOT ASSESSED",
            reason=f"Could not locate interpolation bracket for span {equivalent_span_m:.2f} m.",
            equivalent_span_m=equivalent_span_m,
        )

    fraction = (equivalent_span_m - p1.span_m) / (p2.span_m - p1.span_m)

    t_15_wind = p1.tension_15c_wind_kn + fraction * (p2.tension_15c_wind_kn - p1.tension_15c_wind_kn)
    t_27 = p1.tension_27c_kn + fraction * (p2.tension_27c_kn - p1.tension_27c_kn)
    s_15 = p1.sag_15c_m + fraction * (p2.sag_15c_m - p1.sag_15c_m)
    s_27 = p1.sag_27c_m + fraction * (p2.sag_27c_m - p1.sag_27c_m)
    s_65 = p1.sag_65c_m + fraction * (p2.sag_65c_m - p1.sag_65c_m)

    warnings = []
    if p1.needs_confirmation:
        warnings.append(
            f"Lookup lower bound at {p1.span_m:.1f} m requires confirmation: {p1.confirmation_note or 'Unverified calibration data'}"
        )
    if p2.needs_confirmation:
        warnings.append(
            f"Lookup upper bound at {p2.span_m:.1f} m requires confirmation: {p2.confirmation_note or 'Unverified calibration data'}"
        )

    return TableLookupResult(
        is_assessed=True,
        status="PASS",
        reason=None,
        equivalent_span_m=equivalent_span_m,
        tension_15c_wind_kn=round(t_15_wind, 5),
        tension_27c_kn=round(t_27, 5),
        sag_15c_m=round(s_15, 5),
        sag_27c_m=round(s_27, 5),
        sag_65c_m=round(s_65, 5),
        warnings=warnings,
    )


def get_pole_sag_span_m(fore_span_m: float, aft_span_m: float) -> float:
    """Determine the effective span for pole sag calculation.

    Rule from engineering specification:
        Use the fore span, and the aft span when the fore span is 0 (terminal pole, e.g. Pole 13).

    Args:
        fore_span_m: Forward span length in meters.
        aft_span_m: Aft / back span length in meters.

    Returns:
        Effective span length in meters for sag evaluation.
    """
    if fore_span_m and fore_span_m > 0:
        return fore_span_m
    return aft_span_m or 0.0


def scale_sag_to_actual_span_m(
    sag_at_equivalent_span_m: float,
    actual_span_m: float,
    equivalent_span_m: float,
) -> float:
    """Scale sag from equivalent span to each pole's actual span using the parabolic rule.

    Scaling rule derived from docs/result.pdf & docs/result_reference.json:
        S(L) = S(L_eq) * (L / L_eq)^2

    Requires exact (unrounded) equivalent span for precision.

    Args:
        sag_at_equivalent_span_m: Sag at the equivalent span in meters (m).
        actual_span_m: The actual span length for the specific span in meters (m).
        equivalent_span_m: The exact (unrounded) equivalent span of the strain section in meters (m).

    Returns:
        Scaled sag at the actual span in meters (m).
    """
    if actual_span_m <= 0:
        return 0.0
    if equivalent_span_m <= 0:
        raise ValueError("Equivalent span must be strictly positive.")

    ratio = actual_span_m / equivalent_span_m
    return sag_at_equivalent_span_m * (ratio ** 2)


def calculate_tension_pct_of_uts(
    tension_kn: float,
    ultimate_tensile_strength_kn: float,
) -> float:
    """Calculate tension as an explicit percentage of Ultimate Tensile Strength (UTS).

    Args:
        tension_kn: Mechanical tension in kilonewtons (kN).
        ultimate_tensile_strength_kn: Conductor UTS in kilonewtons (kN).

    Returns:
        Percentage of UTS (e.g. 35.0 for 35.0%).
    """
    if ultimate_tensile_strength_kn <= 0:
        raise ValueError("UTS must be strictly positive.")
    return (tension_kn / ultimate_tensile_strength_kn) * 100.0


def default_eds_assessment(ratio_pct: float, limit_pct: float = 20.0) -> str:
    """Default EDS check evaluator.

    Production rule: EDS status must stay NOT ASSESSED until a rule is approved
    by project engineering authorities.
    """
    return "NOT ASSESSED"


assess_eds_check = default_eds_assessment


def assess_max_stress_15c_wind(ratio_pct: float, limit_pct: float = 40.0) -> str:
    """Evaluate maximum working stress at 15°C + wind against design parameter limit.

    Args:
        ratio_pct: Calculated tension as % of UTS.
        limit_pct: Maximum allowable stress as % of UTS (default 40.0%).

    Returns:
        'OK' if within limit, else 'FAIL'.
    """
    return "OK" if ratio_pct <= limit_pct else "FAIL"
