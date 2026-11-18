"""Units module for explicit unit conversions.

Strict rule: All conversions must be explicit with documented units.
Calculations are not yet implemented.
"""

def m_to_mm(value_m: float) -> float:
    """Explicitly converts meters to millimeters."""
    return value_m * 1000.0


def mm_to_m(value_mm: float) -> float:
    """Explicitly converts millimeters to meters."""
    return value_mm / 1000.0
