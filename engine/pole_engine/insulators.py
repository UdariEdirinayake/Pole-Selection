"""Insulators and ties module ported from LECO Pole Selection tool.

Rules:
- insulator_load: Resultant pin load
- select_insulator_by_angle: Rule thresholds from Design Parameters:
    alpha <= ttie_max -> TTIE
    ttie_max < alpha <= stie_max -> STIE
    alpha > stie_max -> 2x Selected + 2STIE
    Dead end / terminal / section -> TEN**
- cant_of: Cantilever strength from Insulator table
- ins_rank: Governing insulator rank
- ins_band_out: Combine insulator output per voltage band
- ins_hgt_stage: Nominal insulator height per stage
"""
from __future__ import annotations

import math
from typing import Any, Optional

from pole_engine.utils import num, to_rad


def insulator_load(
    t_kn: float,
    dia_mm: float,
    wind_span_m: float,
    angle_deg: float
) -> float:
    """Insulator pin load (original tool line 11412-11414)."""
    return (
        2.0 * t_kn * 100.0 * math.sin(to_rad(angle_deg) / 2.0)
        + 57.5 * dia_mm * wind_span_m / 1000.0
    )


def select_insulator_by_angle(
    angle_deg: float,
    selected_desc: Optional[str],
    voltage_label: str,
    is_dead_end: bool,
    ttie_max: float = 10.0,
    stie_max: float = 20.0,
    opts: Optional[dict[str, Any]] = None
) -> dict[str, Any]:
    """Select insulator and tie type by angle and cantilever check (original tool line 11423-11469)."""
    desc = (selected_desc or "").strip() or f"{voltage_label} insulator"
    if is_dead_end:
        return {
            "insulator": f"{voltage_label} TEN**",
            "tie": "",
            "detail": "TEN**",
            "R_kN": None,
            "R_recalc_kN": None,
            "note": ""
        }

    a = num(angle_deg, 0.0) or 0.0
    t_max = num(ttie_max, 10.0) or 10.0
    s_max = num(stie_max, 20.0) or 20.0

    r_res = None
    r_recalc = None
    note = ""
    base = None

    if opts and (opts.get("T1_kN") is not None or opts.get("T2_kN") is not None):
        t1 = num(opts.get("T1_kN"), 0.0) or 0.0
        t2 = num(opts.get("T2_kN"), 0.0) or 0.0
        qc = (num(opts.get("qCond"), 575.0) or 575.0) / 1000.0  # kN/m2
        d = num(opts.get("dia_m"), 0.0) or 0.0
        sw = num(opts.get("windSpan"), 0.0) or 0.0
        s = math.sin(to_rad(a) / 2.0)
        c = math.cos(to_rad(a) / 2.0)
        r_res = t1 * s + t2 * s + qc * d * sw * c
        cant = num(opts.get("cantilever_kN"), 0.0) or 0.0

        if cant > 0 and r_res > cant + 1e-9:
            s4 = math.sin(to_rad(a) / 4.0)
            r_recalc = t1 * s4 + t2 * s4 + qc * d * sw * c
            if r_recalc <= cant + 1e-9:
                base = {
                    "insulator": f"2×{desc}",
                    "tie": "2STIE",
                    "detail": f"2×{desc} (R>{cant} kN → 2× pin)"
                }
            else:
                base = {
                    "insulator": desc,
                    "tie": "—",
                    "detail": desc,
                    "note": "Tension Insulator required, re-run program with making section"
                }

    if not base:
        if a <= t_max:
            base = {"insulator": desc, "tie": "TTIE", "detail": desc}
        elif a <= s_max:
            base = {"insulator": desc, "tie": "STIE", "detail": desc}
        else:
            base = {"insulator": f"2×{desc}", "tie": "2STIE", "detail": f"2×{desc}"}

    base["R_kN"] = r_res
    base["R_recalc_kN"] = r_recalc
    base["note"] = base.get("note") or note
    return base


def cant_of(desc: Optional[str], insulator_rows: Optional[list[dict[str, Any]]]) -> float:
    """Cantilever strength in kN from insulator master table (original tool line 13569-13572)."""
    if not desc or not insulator_rows:
        return 0.0
    for x in insulator_rows:
        if str(x.get("description") or "").strip() == str(desc).strip():
            return num(x.get("cantilever_strength_kN") or x.get("cantilever_strength_kn"), 0.0) or 0.0
    return 0.0


def ins_rank(res: dict[str, Any]) -> int:
    """Governing severity rank of insulator result (original tool line 13573)."""
    if res.get("note"):
        return 4
    if res.get("tie") == "2STIE" or str(res.get("insulator") or "").startswith("2×"):
        return 3
    if res.get("tie") == "STIE":
        return 2
    return 1


def insulator_nominal_height_m(
    insulators: Optional[list[dict[str, Any]]],
    description: Optional[str],
    voltage_kv: Any
) -> float:
    """Nominal insulator height in meters (original tool line 10792-10801)."""
    rows = insulators or []
    if description:
        for r in rows:
            if str(r.get("description") or "").strip() == str(description).strip():
                return num(r.get("nominal_height_m"), 0.0) or 0.0

    v = str(voltage_kv).replace("kV", "").replace("kv", "").strip()
    for r in rows:
        v_row = str(r.get("voltage_level_kV") or r.get("voltage_level_kv") or "").strip()
        if v_row == v or v_row == str(voltage_kv).strip():
            return num(r.get("nominal_height_m"), 0.0) or 0.0

    return 0.0
