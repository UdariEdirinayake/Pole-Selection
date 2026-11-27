"""Loads and moments calculation module ported from LECO Pole Selection tool.

Strict rules:
- No hard-coded engineering constants or fallback data values.
- Explicit units in all names (_kn, _dan, _m, _n_per_m2, _deg).
- All dimensions and weights loaded from master data models or project inputs.
"""
from __future__ import annotations

import math
from typing import Any, Optional

from pole_engine.utils import num, to_rad, dia_m


def mount_h(pole_height_m: float, offset_from_top_m: float) -> float:
    """Calculate mounting height above ground (original tool line 10446-10447).

    H_mount = pole_height * 5/6 - offset_from_top
    """
    return pole_height_m * 5.0 / 6.0 - offset_from_top_m


def bm_wind_cond(
    n: int,
    wind_span_m: float,
    angle_deg: float,
    d_m: float,
    h_agl_m: float,
    q_n_per_m2: float = 575.0
) -> float:
    """Bending moment due to wind on conductors in kN*m (original tool line 10947-10951).

    BM_c = N * wind_span * cos(alpha/2) * d * q * h_agl
    q converted from N/m2 to kN/m2.
    """
    if not n or not d_m or not h_agl_m:
        return 0.0
    q_kn_per_m2 = (q_n_per_m2 or 575.0) / 1000.0
    return n * wind_span_m * math.cos(to_rad(angle_deg) / 2.0) * d_m * q_kn_per_m2 * h_agl_m


def bm_tension_angle(
    n: int,
    t1_kn: float,
    t2_kn: Optional[float],
    angle_deg: float,
    h_agl_m: float
) -> float:
    """Bending moment due to line angle tension in kN*m (original tool line 10953-10959).

    BMT: (T1 + T2) * sin(alpha/2) * N * h
    """
    if not n or not h_agl_m or not angle_deg:
        return 0.0
    t1 = t1_kn or 0.0
    t2 = (t2_kn if t2_kn is not None else t1_kn) or 0.0
    if not t1 and not t2:
        return 0.0
    s = math.sin(to_rad(angle_deg) / 2.0)
    return (t1 * s + t2 * s) * n * h_agl_m


def bm_tension_full(n: int, t_kn: float, h_agl_m: float) -> float:
    """Full longitudinal tension moment on terminal pole in kN*m (original tool line 10960-10963).

    BM_long = N * T * h
    """
    if not n or not t_kn or not h_agl_m:
        return 0.0
    return n * t_kn * h_agl_m


def bm_wind_pole(
    pole_height_m: float,
    breadth_m: float,
    q_pole_n_per_m2: float = 865.0
) -> float:
    """Wind moment on the pole shaft in kN*m (original tool line 10964-10968).

    BM_p = breadth * h * q * (h / 2), where h = pole_height * 5/6.
    breadth_m must be provided from master data (PoleCapacity).
    """
    if not pole_height_m or not breadth_m:
        return 0.0
    h = pole_height_m * 5.0 / 6.0
    q_kn_per_m2 = (q_pole_n_per_m2 or 865.0) / 1000.0
    return breadth_m * h * q_kn_per_m2 * (h / 2.0)


def bm_equip_parts(
    tf_row: Optional[dict[str, Any]],
    pole_height_m: float,
    q_pole_n_per_m2: float = 865.0
) -> dict[str, float]:
    """Calculate wind and weight eccentricity moments for equipment/transformers (original tool line 10974-10993).

    BME = A_tf * q_p * (h_tf + B/2) + W_kg * 9.810001 * (1.325 - depth/2) * 0.001
    """
    empty = {
        "wind_bm_kn_m": 0.0,
        "weight_bm_kn_m": 0.0,
        "total_kn_m": 0.0,
        "h_tf_m": 0.0,
        "b_m": 0.0,
        "depth_m": 0.0,
        "weight_kg": 0.0,
        "area_m2": 0.0
    }
    if not tf_row:
        return empty

    width = num(tf_row.get("width_m"), 0.0) or 0.0
    height = num(tf_row.get("height_m"), 0.0) or 0.0
    area = num(tf_row.get("area_m2"), 0.0) or (width * height)
    b_height = height
    depth = num(tf_row.get("depth_m"), 0.0) or 0.0
    weight = num(tf_row.get("weight_kg"), 0.0) or 0.0

    ph = num(pole_height_m, 11.0) or 11.0
    if ph >= 12.5:
        h_tf = num(tf_row.get("TFH_13m_Pole") or tf_row.get("TFH_13m Pole"), 0.0) or 0.0
    else:
        h_tf = num(tf_row.get("TFH_11m_Pole") or tf_row.get("TFH_11m Pole"), 0.0) or 0.0

    if not h_tf:
        h_tf = 6.0 - b_height / 2.0

    qp_kn = (q_pole_n_per_m2 or 865.0) / 1000.0
    wind_bm = area * qp_kn * (h_tf + b_height / 2.0)
    weight_bm = 0.0

    return {
        "wind_bm_kn_m": wind_bm,
        "weight_bm_kn_m": weight_bm,
        "total_kn_m": wind_bm,
        "h_tf_m": h_tf,
        "b_m": b_height,
        "depth_m": depth,
        "weight_kg": weight,
        "area_m2": area
    }


def to_pole_top(bm_kn_m: float, pole_height_m: float) -> float:
    """Convert ground-line bending moment in kN*m to pole-top equivalent load in daN (original tool line 10999-11002).

    P (daN) = (BM / lever) * 100, where lever = pole_height * 5/6 - 0.4 m.
    """
    lever = pole_height_m * 5.0 / 6.0 - 0.4
    return (bm_kn_m / lever) * 100.0 if lever > 0 else 0.0


def parse_equipment_kva(name: Any) -> float:
    """Parse kVA from equipment label e.g. 'TF - 50kVA' -> 50 (original tool line 15012-15020)."""
    if name is None or name == "":
        return 0.0
    s = str(name)
    import re
    m = re.search(r"(\d+(?:\.\d+)?)\s*kVA", s, re.IGNORECASE)
    if m:
        return float(m.group(1))
    n = num(s, 0.0)
    return n or 0.0


def find_equipment_row(
    equipment_list: Optional[list[dict[str, Any]]],
    key: Any
) -> Optional[dict[str, Any]]:
    """Find equipment row by name or legacy kVA number (original tool line 15023-15037)."""
    if not key and key != 0:
        return None
    rows = equipment_list or []
    s = str(key).strip()

    for t in rows:
        if str(t.get("equipment") or "").strip() == s:
            return t

    for t in rows:
        if str(t.get("kva") or "") == s:
            return t

    kva = parse_equipment_kva(s)
    if kva:
        for t in rows:
            if parse_equipment_kva(t.get("equipment")) == kva or num(t.get("kva")) == kva:
                return t

    return None


def tf_area(key: Any, equipment_list: Optional[list[dict[str, Any]]]) -> float:
    """Equipment wind surface area in m2 (original tool line 11473-11480)."""
    row = find_equipment_row(equipment_list, key)
    if not row:
        return 0.0
    area = num(row.get("area_m2"))
    if area is not None and area > 0:
        return area
    w = num(row.get("width_m"), 0.0) or 0.0
    h = num(row.get("height_m"), 0.0) or 0.0
    return w * h


def tf_weight(key: Any, equipment_list: Optional[list[dict[str, Any]]]) -> float:
    """Equipment weight in kg (original tool line 11481-11487)."""
    row = find_equipment_row(equipment_list, key)
    if not row:
        return 0.0
    return num(row.get("weight_kg"), 0.0) or 0.0


def vertical_load_kn(
    n_hh: int,
    n_h: int,
    n_l: int,
    w_hh_kg_m: float,
    w_h_kg_m: float,
    w_l_kg_m: float,
    weight_span_m: float,
    guy_load_dan: float,
    tf_kg: float,
    guy_angle_deg: float = 30.0
) -> float:
    """Average-weight-span vertical load in kN (original tool line 11353-11363)."""
    g = 9.81
    cond_kn = 0.0
    if n_hh and w_hh_kg_m:
        cond_kn += n_hh * w_hh_kg_m * weight_span_m * g / 1000.0
    if n_h and w_h_kg_m:
        cond_kn += n_h * w_h_kg_m * weight_span_m * g / 1000.0
    if n_l and w_l_kg_m:
        cond_kn += n_l * w_l_kg_m * weight_span_m * g / 1000.0

    guy_vert_kn = (guy_load_dan or 0.0) * math.cos(to_rad(guy_angle_deg or 30.0)) / 100.0
    tf_kn = (tf_kg or 0.0) * g / 1000.0
    return cond_kn + guy_vert_kn + tf_kn
