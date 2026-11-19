"""Guy wire calculation module ported from LECO Pole Selection tool.

Formulas:
- guy_wire_load_dan: Tension along guy wire (daN)
    G = BM / (h_g * sin(alpha) * cos(theta)) * 100
- guy_long_force_dan: Longitudinal horizontal force (daN) from angled guy:
    Fl = G * sin(alpha) * sin(theta)
"""
from __future__ import annotations

import math
from typing import Optional

from pole_engine.utils import to_rad


def guy_wire_load_dan(
    bm_tension_kn_m: float,
    guy_height_m: float = 8.4,
    guy_angle_deg: float = 30.0,
    theta_deg: float = 0.0
) -> float:
    """Guy tension along the guy wire in daN (original tool line 11023-11031).

    G = BM / (h_g * sin(alpha) * cos(theta)) * 100
    alpha = guy angle to pole, theta = guy angle to transverse.
    When |theta| -> 90 deg, cos(theta) -> 0 and G -> inf (cannot resist transverse moment).
    """
    h = guy_height_m if (guy_height_m and guy_height_m > 0) else 8.4
    a = guy_angle_deg if (guy_angle_deg and guy_angle_deg > 0) else 30.0
    th = theta_deg or 0.0
    cos_th = math.cos(to_rad(th))
    if abs(cos_th) < 1e-6:
        return 1e9

    denom = h * math.sin(to_rad(a)) * cos_th
    return (bm_tension_kn_m / denom) * 100.0 if denom > 0 else 0.0


def guy_long_force_dan(
    guy_load_dan: float,
    guy_angle_deg: float = 30.0,
    theta_deg: float = 0.0
) -> float:
    """Longitudinal horizontal force (daN) from angled guy (original tool line 11033-11037).

    Fl = G * sin(alpha) * sin(theta)
    """
    a = guy_angle_deg if (guy_angle_deg and guy_angle_deg > 0) else 30.0
    th = theta_deg or 0.0
    return (guy_load_dan or 0.0) * math.sin(to_rad(a)) * math.sin(to_rad(th))
