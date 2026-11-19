"""Foundation and bearing capacity calculation module ported from LECO Pole Selection tool.

Rules:
- Embedment ratio P = PH / 6 must be loaded from design_parameter or explicit input, never hard-coded.
- Overturning moment about fulcrum at depth delta = P / sqrt(2).
- Soil subgrade and bearing capacity loaded strictly from master data (SoilClass table).
- Footprint parsed from PoleCapacity footprint_mm.
- Replicate Foundation Type A, B, C selection logic.
"""
from __future__ import annotations

import math
import re
from typing import Any, Optional

from pole_engine.utils import num, to_rad, dia_m
from pole_engine.loads import find_equipment_row, bm_equip_parts
from pole_engine.selection import find_capacity_row


def parse_footprint_mm(fp: Any) -> dict[str, float]:
    """Parse footprint e.g. '300x300' into L and W in mm (original tool line 11086-11091)."""
    s = re.sub(r"\s+", "", str(fp or "").lower())
    m = re.match(r"^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)", s)
    if not m:
        return {"L": 0.0, "W": 0.0}
    return {"L": float(m.group(1)), "W": float(m.group(2))}


def parse_bearing_min(s: Any) -> float:
    """Parse minimum bearing capacity in kN/m2 (original tool line 11092-11100)."""
    t = str(s or "").strip()
    if not t or t.startswith("<"):
        return 0.0
    m = re.findall(r"(\d+(?:\.\d+)?)", t)
    if not m:
        return 0.0
    return float(m[0])


def compute_foundation(opts: dict[str, Any]) -> dict[str, Any]:
    """Calculate foundation overturning, vertical loads, and bearing types A/B/C (original tool line 11135-11311)."""
    pole_height = num(opts.get("poleHeight") or opts.get("pole_height"), 11.0) or 11.0
    embedment_ratio = num(opts.get("embedment_ratio"), 1.0 / 6.0) or (1.0 / 6.0)
    p_embed = pole_height * embedment_ratio
    delta = p_embed / math.sqrt(2.0)

    recommended = opts.get("recommended") or ""
    is_terminal = bool(opts.get("isTerminal") or opts.get("is_terminal"))
    is_guyed_or_strut = bool(opts.get("isGuyedOrStrut") or opts.get("is_guyed_or_strut"))
    heights = opts.get("heights") or []
    ns = opts.get("ns") or []
    n_hh = int(opts.get("nHH") or 0)
    n_h = int(opts.get("nH") or 0)
    n_l = int(opts.get("nL") or 0)
    stage_cond = opts.get("stageCond") or []
    stage_t1 = opts.get("stageT1") or []
    stage_t2 = opts.get("stageT2") or []
    wind_span = num(opts.get("windSpan") or opts.get("wind_span"), 0.0) or 0.0
    weight_span = num(opts.get("weightSpan") or opts.get("weight_span"), 0.0) or 0.0
    angle_deg = num(opts.get("angleDeg") or opts.get("angle_deg"), 0.0) or 0.0
    q_cond = num(opts.get("qCond") or opts.get("q_cond"), 575.0) or 575.0
    q_pole = num(opts.get("qPole") or opts.get("q_pole"), 865.0) or 865.0
    guy_load_dan = num(opts.get("guyLoadDaN") or opts.get("guy_load_dan"), 0.0) or 0.0
    guy_angle_deg = num(opts.get("guyAngleDeg") or opts.get("guy_angle_deg"), 30.0) or 30.0
    tf_weight_kg = num(opts.get("tfWeightKg") or opts.get("tf_weight_kg"), 0.0) or 0.0
    soil_class = str(opts.get("soilClass") or opts.get("soil_class") or "")
    data = opts.get("data") or {}

    cos_half = math.cos(to_rad(angle_deg) / 2.0)
    sin_half = math.sin(to_rad(angle_deg) / 2.0)
    qc = q_cond / 1000.0

    bm_c_f = 0.0
    bm_t_f = 0.0
    bm_long_f = 0.0

    total_levels = min(len(heights), n_hh + n_h + n_l)
    for i in range(total_levels):
        hi = (heights[i] if i < len(heights) else 0.0) + delta
        ni = ns[i] if i < len(ns) else 0
        sc = stage_cond[i] if i < len(stage_cond) else None
        di = dia_m(sc)
        t1 = stage_t1[i] if (i < len(stage_t1) and stage_t1[i] is not None) else 0.0
        t2 = stage_t2[i] if (i < len(stage_t2) and stage_t2[i] is not None) else 0.0

        bm_c_f += qc * di * wind_span * cos_half * ni * hi
        if not is_guyed_or_strut:
            if not is_terminal:
                bm_t_f += (t1 * sin_half + t2 * sin_half) * ni * hi
                bm_long_f += (t1 - t2) * cos_half * ni * hi
            else:
                bm_long_f += ni * t2 * hi

    h_agl = pole_height * 5.0 / 6.0
    qp = q_pole / 1000.0
    capacities = data.get("capacities") or []
    cap_row = find_capacity_row(capacities, pole_height, recommended)

    b = num(cap_row.get("avg_breadth_m") if cap_row else None, 0.28) or 0.28
    force_pole = b * h_agl * qp
    bm_p_f = force_pole * (h_agl / 2.0 + delta)

    tf_key = opts.get("equipment") or opts.get("tfKva") or opts.get("transformer_kva")
    tf_row = find_equipment_row(data.get("equipment") or data.get("transformers"), tf_key)
    ep = bm_equip_parts(tf_row, pole_height, q_pole)

    if ep.get("area_m2") or ep.get("weight_kg"):
        wind_f = ep["area_m2"] * qp * (ep["h_tf_m"] + ep["b_m"] / 2.0 + delta)
        weight_f = ep["weight_bm_kn_m"]
        bm_e_f = wind_f + weight_f
    else:
        a_area = num(opts.get("tfArea"), 0.0) or 0.0
        force_eq = a_area * qp
        bm_e_f = force_eq * (6.0 + delta)

    bmf = bm_c_f + bm_p_f + bm_e_f
    if not is_guyed_or_strut:
        if is_terminal:
            bmf += bm_long_f
        else:
            bmf += bm_t_f + abs(bm_long_f)

    soil_classes = data.get("soil_classes") or []
    soil_record = next((s for s in soil_classes if str(s.get("class") or s.get("soil_class")) == soil_class), {})
    k_subgrade = num(
        soil_record.get("subgrade_kN/m3") or
        soil_record.get("subgrade_MN/m3") or
        soil_record.get("subgrade_kn_m3") or
        soil_record.get("subgrade_kNm2m"),
        0.0
    ) or 0.0

    b_gl = num(cap_row.get("below_gl_breadth_m") if cap_row else None, b) or b
    theta_soil = 0.01  # rad
    sum_cube = math.pow(delta, 3) + math.pow(max(p_embed - delta, 0.0), 3)
    mg = (k_subgrade * b_gl * theta_soil / 3.0) * sum_cube
    stable = mg > bmf

    b_min = None
    if k_subgrade > 0 and sum_cube > 0:
        denom = (k_subgrade * theta_soil / 3.0) * sum_cube
        if denom > 0:
            b_min = bmf / denom

    alt_rec = "—" if stable else (
        f"Min below-GL breadth B ≥ {b_min:.3f} m (or breast/heel block)" if b_min is not None
        else "Breast block / heel block or enlarge hole and concrete"
    )

    w_pole = num(cap_row.get("weight_kg") if cap_row else None, 0.0) * 9.81 / 1000.0
    w_tf = tf_weight_kg * 9.81 / 1000.0

    w_cond = 0.0
    for i in range(total_levels):
        ni = ns[i] if i < len(ns) else 0
        sc = stage_cond[i] if i < len(stage_cond) else None
        w_unit = num(sc.get("Weight_kg/m") or sc.get("Weight_kg_m") or sc.get("weight_kg_m"), 0.0) or 0.0 if sc else 0.0
        w_cond += (w_unit * ni * weight_span) * 9.81 / 1000.0

    guy_vert = (guy_load_dan * math.cos(to_rad(guy_angle_deg))) / 100.0
    v_tot = w_pole + w_tf + w_cond + guy_vert

    footprint_str = str(cap_row.get("footprint_mm") if cap_row else "")
    fp = parse_footprint_mm(footprint_str)
    bearing = parse_bearing_min(soil_record.get("bearing_kNm2") or soil_record.get("bearing_kn_m2"))

    types = [
        {"name": "A", "d": 0.0},
        {"name": "B", "d": 200.0},
        {"name": "C", "d": 400.0}
    ]
    caps = {}
    rec_type = "X"
    for t in types:
        lm = (fp["L"] + t["d"]) / 1000.0
        wm = (fp["W"] + t["d"]) / 1000.0
        area = lm * wm
        cap = area * bearing
        caps[t["name"]] = cap
        if rec_type == "X" and cap >= v_tot:
            rec_type = t["name"]

    area_min_m2 = (v_tot / bearing) if bearing > 0 else None

    if stable and rec_type != "X":
        found_rec = f"Type {rec_type}"
    else:
        parts = []
        if not stable and b_min is not None:
            parts.append(f"Overturning: min B ≥ {b_min:.3f} m")
        elif not stable:
            parts.append("Overturning: enlarge / breast-heel block")
        if rec_type == "X" and area_min_m2 is not None:
            parts.append(f"Enlarge the footprint > {area_min_m2:.3f} m²")
        elif rec_type == "X":
            parts.append("Enlarge the footprint (bearing capacity insufficient; soil bearing data missing)")
        elif stable:
            parts.append(f"Type {rec_type}")
        found_rec = "; ".join(parts) or "—"

    return {
        "soil_class": soil_class,
        "bmf_kNm": bmf,
        "mg_kNm": mg,
        "subgrade_k": k_subgrade,
        "stable": stable,
        "overturning_alt": alt_rec,
        "weight_pole_kN": w_pole,
        "weight_tf_kN": w_tf,
        "weight_cond_kN": w_cond,
        "conductor_vertical_kN": w_cond,
        "guy_vert_kN": guy_vert,
        "total_vertical_kN": v_tot,
        "bearing_A_kN": caps.get("A", 0.0),
        "bearing_B_kN": caps.get("B", 0.0),
        "bearing_C_kN": caps.get("C", 0.0),
        "foundation_type": rec_type,
        "embedment_m": p_embed,
        "fulcrum_delta_m": delta,
        "footprint_mm": footprint_str,
        "below_gl_m": b_gl,
        "B_min_m": b_min,
        "area_min_m2": area_min_m2,
        "foundation_recommendation": found_rec
    }
