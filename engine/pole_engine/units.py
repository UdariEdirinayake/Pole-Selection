"""Units module for explicit unit conversions.

Strict rules from AGENTS.md:
- Explicit unit conversions only (e.g. diameter_mm, weight_kg, weight_n).
- No implicit assumptions about units.
- Standard gravity is g = 9.80665 m/s² for kg -> N conversions.
"""

STANDARD_GRAVITY_M_PER_S2: float = 9.80665


def m_to_mm(value_m: float) -> float:
    """Explicitly converts meters (m) to millimeters (mm)."""
    return value_m * 1000.0


def mm_to_m(value_mm: float) -> float:
    """Explicitly converts millimeters (mm) to meters (m)."""
    return value_mm / 1000.0


def dan_to_kn(tension_dan: float) -> float:
    """Explicitly converts decanewtons (daN) to kilonewtons (kN). 1 daN = 10 N = 0.01 kN."""
    return tension_dan / 100.0


def kn_to_dan(tension_kn: float) -> float:
    """Explicitly converts kilonewtons (kN) to decanewtons (daN). 1 kN = 100 daN."""
    return tension_kn * 100.0


def kg_to_n(mass_kg: float) -> float:
    """Explicitly converts kilograms (kg) to Newtons (N) using standard gravity g = 9.80665 m/s²."""
    return mass_kg * STANDARD_GRAVITY_M_PER_S2


def n_to_kn(force_n: float) -> float:
    """Explicitly converts Newtons (N) to kilonewtons (kN)."""
    return force_n / 1000.0


def kn_to_n(force_kn: float) -> float:
    """Explicitly converts kilonewtons (kN) to Newtons (N)."""
    return force_kn * 1000.0
