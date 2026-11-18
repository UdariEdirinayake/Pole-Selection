"""Explicit physical unit conversions adhering to AGENTS.md rules.

No hardcoded calculation formulas or engineering values.
Every unit conversion is purely dimensional with explicit naming.
"""

# Gravitational acceleration constant used strictly for mass-force dimensional conversion (kg to N)
# Standard gravity ISO 80000-3: 9.80665 m/s²
GRAVITY_ACCELERATION_M_PER_S2 = 9.80665


def dan_to_kn(val_dan: float | None) -> float | None:
    """Explicitly converts decanewtons (daN) to kilonewtons (kN).
    1 daN = 10 N = 0.01 kN
    """
    if val_dan is None:
        return None
    return val_dan * 0.01


def kg_to_n(val_kg: float | None) -> float | None:
    """Explicitly converts mass in kilograms (kg) to weight force in newtons (N) under standard gravity.
    F = m * g (g = 9.80665 m/s²)
    """
    if val_kg is None:
        return None
    return val_kg * GRAVITY_ACCELERATION_M_PER_S2


def mm_to_m(val_mm: float | None) -> float | None:
    """Explicitly converts millimeters (mm) to meters (m)."""
    if val_mm is None:
        return None
    return val_mm / 1000.0


def m_to_mm(val_m: float | None) -> float | None:
    """Explicitly converts meters (m) to millimeters (mm)."""
    if val_m is None:
        return None
    return val_m * 1000.0


def mm2_to_m2(val_mm2: float | None) -> float | None:
    """Explicitly converts square millimeters (mm²) to square meters (m²)."""
    if val_mm2 is None:
        return None
    return val_mm2 * 1e-6


def kg_per_mm2_to_n_per_m2(val_kg_per_mm2: float | None) -> float | None:
    """Explicitly converts kg/mm² to N/m².
    1 kg/mm² = 9.80665 N / 1e-6 m² = 9.80665e6 N/m²
    """
    if val_kg_per_mm2 is None:
        return None
    return val_kg_per_mm2 * GRAVITY_ACCELERATION_M_PER_S2 * 1e6


def kg_per_m_to_n_per_m(val_kg_per_m: float | None) -> float | None:
    """Explicitly converts linear mass density kg/m to linear force weight N/m."""
    if val_kg_per_m is None:
        return None
    return val_kg_per_m * GRAVITY_ACCELERATION_M_PER_S2
