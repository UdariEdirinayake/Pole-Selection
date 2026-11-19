"""Buckling capacity module ported from LECO Pole Selection tool.

Rules:
- buckling_capacity_kn: Looks up critical buckling load from PoleCapacity master table.
- Strict copy boundary: Does not hard-code the BUCKLING table. Fails closed (returns 0.0 or raises) if missing.
"""
from __future__ import annotations

import re
from typing import Any, Optional

from pole_engine.utils import num


def buckling_capacity_kn(
    pole_height_m: float,
    class_base: Any,
    capacities: Optional[list[dict[str, Any]]]
) -> float:
    """Buckling capacity in kN from master table (original tool line 11332-11344).

    Strict rule: Never use hardcoded fallback table. If missing in capacities, returns 0.0.
    """
    if not capacities:
        return 0.0

    base = re.sub(r"[^0-9]", "", str(class_base))[:4]
    if not base:
        return 0.0

    h = num(pole_height_m)
    for c in capacities:
        ch = num(c.get("pole_height_m") or c.get("height_m"))
        cl = str(c.get("class_label") or "")
        cb = num(c.get("critical_buckling_kN") or c.get("critical_buckling_kn"), 0.0)
        if ch == h and base in cl and cb is not None and cb > 0:
            return cb

    return 0.0
