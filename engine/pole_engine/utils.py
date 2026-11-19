"""Utility functions ported from original LECO Pole Selection tool.

Copied logic:
- num: Parse float with fallback
- is_missing: Null/NaN/empty check
- to_rad: Convert degrees to radians
- dia_m: Extract diameter in meters from conductor
"""
from __future__ import annotations

import math
from typing import Any, Optional


def num(v: Any, fallback: Optional[float] = None) -> Optional[float]:
    """Parse float with fallback (original tool line 10425-10429)."""
    if v is None or v == "":
        return fallback
    try:
        n = float(v)
        return n if math.isfinite(n) else fallback
    except (ValueError, TypeError):
        return fallback


def is_missing(v: Any) -> bool:
    """Check if value is missing or non-finite (original tool line 10430-10433)."""
    if v is None or v == "":
        return True
    try:
        n = float(v)
        return not math.isfinite(n)
    except (ValueError, TypeError):
        return True


def to_rad(deg: float) -> float:
    """Convert degrees to radians (original tool line 10434-10437)."""
    return deg * math.pi / 180.0


def dia_m(cond: Optional[dict[str, Any]]) -> float:
    """Extract conductor diameter in meters (original tool line 10784)."""
    if not cond:
        return 0.0
    d_mm = num(cond.get("diameter_mm"), 0.0) or 0.0
    return d_mm / 1000.0
