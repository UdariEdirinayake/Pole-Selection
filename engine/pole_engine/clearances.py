"""Clearances, phase separation, and uplift calculation module ported from LECO Pole Selection tool.

Rules:
- All regulatory and user clearances loaded from master data (GroundClearance, CircuitClearance, StructureClearance).
- creepage_allowance_m: Loaded from DesignParameter or explicit settings, not literals.
- sep_at_angle: D_eff = min(D_start*cos(theta_start/2), D_end*cos(theta_end/2))
- max_angle: 2 * arccos(D_req / D)
- Uplift checks per conductor level on pin/post insulators.
"""
from __future__ import annotations

import math
import re
from typing import Any, Optional

from pole_engine.utils import num, to_rad


def creepage_allowance_m(
    settings: dict[str, Any],
    band: str,
    cond: Optional[dict[str, Any]],
    is_abc: bool = False,
    is_earth: bool = False
) -> float:
    """Creepage allowance p (m) from settings/design parameters (original tool line 10590-10600)."""
    desc = str(cond.get("description") or cond.get("code") or "").lower() if cond else ""
    if is_earth:
        return num(settings.get("cb_creep_earth"), 0.4) or 0.4
    if band == "HH":
        return num(settings.get("cb_creep_33abc"), 0.3) if is_abc else num(settings.get("cb_creep_33"), 0.3) or 0.3
    if band == "H":
        return num(settings.get("cb_creep_11abc"), 0.3) if is_abc else num(settings.get("cb_creep_11"), 0.3) or 0.3
    # LV
    if re.search(r"bundle|abc|aerial", desc):
        return num(settings.get("cb_creep_lvabc"), 0.4) or 0.4
    return num(settings.get("cb_creep_lvbare"), 0.2) or 0.2


def top_attach_offset_m(band: str) -> float:
    """Offset of top attachment from pole top (original tool line 10601-10604)."""
    return 0.12 if band == "L" else 0.2


def max_allowable_sag_flat_m(
    pole_height_m: float,
    o_m: float,
    p_m: float,
    sum_t_m: float,
    r_m: float
) -> float:
    """Flat-terrain max allowable sag (m) for bottom circuit (original tool line 10609-10613):
        S = q - (o + p + sum_t + r), q = PH * 5/6
    """
    q = pole_height_m * 5.0 / 6.0
    return q - (o_m + p_m + sum_t_m + r_m)


def base_band_of(lab: str) -> str:
    """Strip ABC suffix from band label (original tool line 11871)."""
    b = re.sub(r"\s*ABC$", "", str(lab or ""), flags=re.IGNORECASE).strip()
    return "LV" if b == "Earth" else b


def band_rows_of(rows_in: Optional[list[dict[str, Any]]], lab: str) -> list[dict[str, Any]]:
    """Filter rows matching voltage band label (original tool line 11872-11877)."""
    rows = rows_in or []
    vb_of = lambda g: str(g.get("voltage_band") if g.get("voltage_band") is not None else (g.get("voltage") or "")).strip()
    hit = [g for g in rows if vb_of(g) == lab]
    if not hit and base_band_of(lab) != lab:
        hit = [g for g in rows if vb_of(g) == base_band_of(lab)]
    return hit


def table_ground_m(
    ground_clearances: Optional[list[dict[str, Any]]],
    band_label: str,
    env: str
) -> float:
    """Regulatory ground clearance from table (original tool line 11883-11890)."""
    rows_gc = band_rows_of(ground_clearances, band_label)
    if not rows_gc:
        return 5.5
    env_l = str(env or "").strip().lower()
    for g in rows_gc:
        if str(g.get("environment") or g.get("description") or "").strip().lower() == env_l:
            return num(g.get("min_clearance_m"), 5.5) or 5.5
    return max([num(g.get("min_clearance_m"), 0.0) or 0.0 for g in rows_gc] or [5.5])


def table_cc_m(
    circuit_clearances: Optional[list[dict[str, Any]]],
    u: str,
    l: str
) -> float:
    """Regulatory circuit-to-circuit vertical clearance (original tool line 11903-11909)."""
    rows_cc = circuit_clearances or []
    find = lambda a, b: next(
        (c for c in rows_cc if str(c.get("upper_band") or "").strip() == a and str(c.get("lower_band") or "").strip() == b),
        None
    )
    hit = find(u, l) or find(l, u)
    if not hit:
        bu = base_band_of(u)
        bl = base_band_of(l)
        hit = find(bu, bl) or find(bl, bu)
    return num(hit.get("min_vertical_m"), 1.2) if hit else 1.2


def cc_req(
    circuit_clearances: Optional[list[dict[str, Any]]],
    u: str,
    l: str,
    settings: Optional[dict[str, Any]] = None
) -> dict[str, Any]:
    """Circuit-to-circuit requirement {value, source} (original tool line 11911-11925)."""
    u_e = str(u or "").strip() == "Earth"
    l_e = str(l or "").strip() == "Earth"
    if u_e and l_e:
        return {"value": 0.0, "source": "none"}
    if u_e or l_e:
        return cc_req(circuit_clearances, "LV" if u_e else u, "LV" if l_e else l, settings)

    is_user_clr = (settings or {}).get("clearance_source") == "user"
    if is_user_clr:
        uc = (settings or {}).get("user_cc") or {}
        v = num(uc.get(f"{u}|{l}"))
        if v is None:
            v = num(uc.get(f"{l}|{u}"))
        if v is not None:
            return {"value": v, "source": "user"}

    return {"value": table_cc_m(circuit_clearances, u, l), "source": "regulatory"}


def structure_req_m(
    structure_clearances: Optional[list[dict[str, Any]]],
    band_label: str,
    cond: Optional[dict[str, Any]] = None
) -> Optional[float]:
    """Structure/building/tree clearance requirement (original tool line 11928-11939)."""
    lab = band_label
    desc = str(cond.get("description") or cond.get("code") or "") if cond else ""
    if band_label == "LV":
        lab = "LV Bundle" if re.search(r"bundle|abc|aerial", desc, re.IGNORECASE) else "LV Bare"

    rows_s = band_rows_of(structure_clearances, lab)
    if not rows_s and band_label == "Earth":
        rows_s = band_rows_of(structure_clearances, "LV Bundle")
    if not rows_s and band_label == "LV":
        rows_s = [x for x in (structure_clearances or []) if re.match(r"^LV", str(x.get("voltage_band") or ""), re.IGNORECASE)]
    if not rows_s:
        return None

    s0 = rows_s[0]
    v = num(s0.get("min_clearance_m") if s0.get("min_clearance_m") is not None else (s0.get("vertical_m") if s0.get("vertical_m") is not None else s0.get("clearance_m")))
    return v if (v is not None and v > 0) else None


def min_sep(code: str, xa_rows: Optional[list[dict[str, Any]]]) -> Optional[float]:
    """Crossarm minimum separation from crossarm_spacings table (original tool line 13868-13871)."""
    if not xa_rows:
        return None
    for x in xa_rows:
        if str(x.get("config_no") or "").strip() == str(code).strip():
            return num(x.get("minimum_separation_m"))
    return None


def max_angle(d: Optional[float], d_req: Optional[float]) -> Optional[float]:
    """Max line angle for crossarm spacing D (original tool line 13884):
        theta_max = 2 * arccos(D_req / D) * 180 / pi
    """
    if d is not None and d_req is not None:
        if d_req < d and d > 0:
            return 2.0 * math.acos(d_req / d) * 180.0 / math.pi
        return 0.0
    return None


def sep_at_angle(
    d_a: Optional[float],
    d_b: Optional[float],
    p_a: Any,
    p_b: Any,
    d_req: Optional[float]
) -> dict[str, Any]:
    """Phase separation with line angle correction (original tool line 13885-13901).

    Crossarm sits on angle bisector -> D_eff = min(D_A*cos(th_A/2), D_B*cos(th_B/2)).
    """
    pole_angle = lambda p: 0.0 if (not p or getattr(p, "is_terminal", False) or (isinstance(p, dict) and p.get("is_terminal"))) else abs(num(getattr(p, "angle", None) if not isinstance(p, dict) else p.get("angle"), 0.0) or 0.0)

    th_a = pole_angle(p_a)
    th_b = pole_angle(p_b) if p_b else 0.0

    e_a = d_a * math.cos(to_rad(th_a) / 2.0) if d_a is not None else None
    e_b = d_b * math.cos(to_rad(th_b) / 2.0) if (p_b and d_b is not None) else None

    d_s = None
    if d_a is not None and d_b is not None and p_b:
        d_s = min(d_a, d_b)
    elif d_a is not None:
        d_s = d_a
    elif d_b is not None:
        d_s = d_b

    d_e = None
    gov = ""
    if e_a is not None and e_b is not None:
        d_e = min(e_a, e_b)
        gov = "end" if e_b < e_a else "start"
    elif e_a is not None:
        d_e = e_a
        gov = "start"
    elif e_b is not None:
        d_e = e_b
        gov = "end"

    ok = (d_e > d_req) if (d_req is not None and d_e is not None) else None
    ok_straight = (d_s > d_req) if (d_req is not None and d_s is not None) else None

    return {
        "D_start_m": d_a,
        "D_end_m": d_b if p_b else None,
        "D_straight_m": d_s,
        "D_eff": d_e,
        "angle_start_deg": th_a,
        "angle_end_deg": th_b if p_b else None,
        "max_angle_start_deg": max_angle(d_a, d_req),
        "max_angle_end_deg": max_angle(d_b, d_req) if p_b else None,
        "fail_by_angle": (ok is False and ok_straight is True),
        "gov_end": gov,
        "ok": ok
    }


# ---------------------------------------------------------------------------
# Phase 4B API compatibility shims
# ---------------------------------------------------------------------------
from dataclasses import dataclass, field

def calculate_required_phase_separation_m(sag_65_m: float, line_voltage_kv: float) -> float:
    if sag_65_m < 0:
        raise ValueError(f"sag_65_m must be >= 0, got {sag_65_m}")
    if line_voltage_kv <= 0:
        raise ValueError(f"line_voltage_kv must be > 0, got {line_voltage_kv}")
    return 0.75 * math.sqrt(sag_65_m) + (line_voltage_kv ** 2) / 20_000.0

def calculate_separation_at_angle_m(straight_sep_m: float, theta_start_deg: float, theta_end_deg: float) -> tuple[float, float, float]:
    d_start_m = straight_sep_m * math.cos(to_rad(theta_start_deg / 2.0))
    d_end_m = straight_sep_m * math.cos(to_rad(theta_end_deg / 2.0))
    d_actual_m = min(d_start_m, d_end_m)
    return round(d_start_m, 3), round(d_end_m, 3), round(d_actual_m, 3)

def calculate_max_crossarm_angle_deg(required_sep_m: float, straight_sep_m: float) -> int:
    if required_sep_m >= straight_sep_m:
        return 0
    ratio = max(-1.0, min(1.0, required_sep_m / straight_sep_m))
    return int(math.degrees(2.0 * math.acos(ratio)))

def evaluate_phase_separation(sag_65_m: Optional[float], line_voltage_kv: Optional[float], straight_sep_m: Optional[float], theta_start_deg: Optional[float], theta_end_deg: Optional[float]) -> str:
    if any(v is None for v in [sag_65_m, line_voltage_kv, straight_sep_m, theta_start_deg, theta_end_deg]):
        return "NOT ASSESSED"
    try:
        d_req = calculate_required_phase_separation_m(sag_65_m, line_voltage_kv)
        _, _, d_act = calculate_separation_at_angle_m(straight_sep_m, theta_start_deg, theta_end_deg)
        return "PASS" if d_act > d_req else "FAIL"
    except Exception:
        return "NOT ASSESSED"

def calculate_attachment_height_above_ground_m(pole_height_m: Optional[float], embedment_ratio: Optional[float], attachment_height_below_pole_top_m: Optional[float]) -> Optional[float]:
    if pole_height_m is None or embedment_ratio is None or attachment_height_below_pole_top_m is None:
        return None
    return round(pole_height_m * (1.0 - embedment_ratio) - attachment_height_below_pole_top_m, 3)

def calculate_lowest_ground_clearance_m(attachment_height_m: Optional[float], terrain_height_m: Optional[float], max_sag_65_m: Optional[float]) -> Optional[float]:
    if attachment_height_m is None or terrain_height_m is None or max_sag_65_m is None:
        return None
    return round(attachment_height_m + terrain_height_m - max_sag_65_m, 3)

def assess_ground_clearance(lowest_clearance_m: Optional[float], applicable_clearance_m: Optional[float]) -> tuple[str, Optional[str]]:
    if lowest_clearance_m is None or applicable_clearance_m is None:
        return "NOT ASSESSED", "input needed"
    if lowest_clearance_m >= applicable_clearance_m:
        return "SATISFIED", None
    return "FAIL", "lowest clearance below applicable standard"

def evaluate_ground_clearance(lowest_clearance_m: Optional[float], applicable_clearance_m: Optional[float]) -> str:
    status, _ = assess_ground_clearance(lowest_clearance_m, applicable_clearance_m)
    return status

def assess_circuit_clearance(actual_clearance_m: Optional[float], required_clearance_m: Optional[float]) -> tuple[str, Optional[str]]:
    if actual_clearance_m is None or required_clearance_m is None:
        return "NOT ASSESSED", "input needed"
    if actual_clearance_m >= required_clearance_m:
        return "SATISFIED", None
    return "FAIL", "circuit clearance below required threshold"

def evaluate_circuit_clearance(actual_clearance_m: Optional[float], required_clearance_m: Optional[float]) -> str:
    status, _ = assess_circuit_clearance(actual_clearance_m, required_clearance_m)
    return status

@dataclass
class PoleClearanceResult:
    pole_no: int
    section: int
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
    separation_reason: Optional[str] = None
    attachment_height_m: Optional[float] = None
    attachment_height_below_pole_top_m: Optional[float] = None
    terrain_height_m: Optional[float] = None
    lowest_clearance_m: Optional[float] = None
    applicable_clearance_m: Optional[float] = None
    ground_clearance_check: str = "NOT ASSESSED"
    ground_clearance_reason: Optional[str] = None
    min_vert_clear_m: Optional[float] = None
    req_vert_clear_m: Optional[float] = None
    circuit_clearance_check: str = "NOT ASSESSED"
    circuit_clearance_reason: Optional[str] = None
    warnings: list[str] = field(default_factory=list)

def compute_pole_clearance(
    pole_no: int,
    section: int,
    sag_65_m: Optional[float],
    line_voltage_kv: Optional[float],
    straight_sep_m: Optional[float],
    theta_start_deg: Optional[float],
    theta_end_deg: Optional[float],
    pole_height_m: Optional[float],
    embedment_ratio: Optional[float],
    attachment_height_below_pole_top_m: Optional[float],
    terrain_height_m: Optional[float] = None,
    applicable_clearance_m: Optional[float] = None,
    vertical_spacing_11kv_lv_m: Optional[float] = None,
    req_vert_clear_m: Optional[float] = None,
) -> PoleClearanceResult:
    warnings: list[str] = []
    req_sep_m = None
    sep_start = sep_end = sep_actual = None
    max_angle = None
    sep_check = "NOT ASSESSED"
    sep_reason = None

    if any(v is None for v in [sag_65_m, line_voltage_kv, straight_sep_m, theta_start_deg, theta_end_deg]):
        sep_check = "NOT ASSESSED"
        sep_reason = "input needed"
    else:
        try:
            req_sep_m = round(calculate_required_phase_separation_m(sag_65_m, line_voltage_kv), 3)
            sep_start, sep_end, sep_actual = calculate_separation_at_angle_m(straight_sep_m, theta_start_deg, theta_end_deg)
            max_angle = calculate_max_crossarm_angle_deg(req_sep_m, straight_sep_m)
            sep_check = evaluate_phase_separation(sag_65_m, line_voltage_kv, straight_sep_m, theta_start_deg, theta_end_deg)
        except Exception as exc:
            sep_check = "NOT ASSESSED"
            sep_reason = f"calculation error: {exc}"
            warnings.append(f"Pole {pole_no}: phase separation error: {exc}")

    attachment_height_m = None
    lowest_clearance_m = None
    gc_check = "NOT ASSESSED"
    gc_reason = None

    if attachment_height_below_pole_top_m is None:
        gc_check = "NOT ASSESSED"
        gc_reason = "input needed"
        warnings.append(f"Pole {pole_no}: ground clearance NOT ASSESSED (input needed: attachment height below pole top)")
    elif pole_height_m is None or embedment_ratio is None:
        gc_check = "NOT ASSESSED"
        gc_reason = "input needed"
        warnings.append(f"Pole {pole_no}: ground clearance NOT ASSESSED (input needed: pole height or embedment ratio)")
    elif terrain_height_m is None:
        gc_check = "NOT ASSESSED"
        gc_reason = "input needed"
        warnings.append(f"Pole {pole_no}: ground clearance NOT ASSESSED (input needed: terrain height)")
    else:
        attachment_height_m = calculate_attachment_height_above_ground_m(
            pole_height_m, embedment_ratio, attachment_height_below_pole_top_m
        )
        lowest_clearance_m = calculate_lowest_ground_clearance_m(attachment_height_m, terrain_height_m, sag_65_m)
        gc_check, gc_reason = assess_ground_clearance(lowest_clearance_m, applicable_clearance_m)

    min_vert_clear_m = None
    cc_check = "NOT ASSESSED"
    cc_reason = None

    if vertical_spacing_11kv_lv_m is None:
        cc_check = "NOT ASSESSED"
        cc_reason = "input needed"
        warnings.append(f"Pole {pole_no}: circuit clearance NOT ASSESSED (input needed: vertical spacing between the 11 kV and LV attachments)")
    else:
        min_vert_clear_m = vertical_spacing_11kv_lv_m
        cc_check, cc_reason = assess_circuit_clearance(min_vert_clear_m, req_vert_clear_m)

    return PoleClearanceResult(
        pole_no=pole_no,
        section=section,
        sag_65_m=sag_65_m,
        required_separation_m=req_sep_m,
        crossarm_straight_m=straight_sep_m,
        theta_start_deg=theta_start_deg,
        theta_end_deg=theta_end_deg,
        separation_start_m=sep_start,
        separation_end_m=sep_end,
        separation_actual_m=sep_actual,
        max_angle_start_deg=max_angle,
        max_angle_end_deg=max_angle,
        separation_check=sep_check,
        separation_reason=sep_reason,
        attachment_height_m=attachment_height_m,
        attachment_height_below_pole_top_m=attachment_height_below_pole_top_m,
        terrain_height_m=terrain_height_m,
        lowest_clearance_m=lowest_clearance_m,
        applicable_clearance_m=applicable_clearance_m,
        ground_clearance_check=gc_check,
        ground_clearance_reason=gc_reason,
        min_vert_clear_m=min_vert_clear_m,
        req_vert_clear_m=req_vert_clear_m,
        circuit_clearance_check=cc_check,
        circuit_clearance_reason=cc_reason,
        warnings=warnings,
    )
