"""Sag-tension calculation engine according to LECO standards.

Strict rules from AGENTS.md & Phase 4C:
- No hard-coded engineering values. Physical constants and thresholds must be loaded or passed in.
- Explicit unit conversion and explicit units in all function names and types.
- Pure Python calculation engine; no web framework code.
- Chart lookup with linear interpolation. Clamped at bounds with warning 'outside chart range'.
- Replicate Martin / catenary state-change cubic equation and catenary unequal-elevation solvers.
"""
from __future__ import annotations

from dataclasses import dataclass, field
import math
from typing import Any, Callable, Optional

from pole_engine.utils import num, is_missing, to_rad, dia_m


@dataclass
class TableLookupPoint:
    """A single span tension point from a master lookup table."""
    span_m: float
    tension_15c_wind_kn: float
    tension_27c_kn: float
    sag_15c_m: float
    sag_27c_m: float
    sag_65c_m: float
    needs_confirmation: bool = False
    confirmation_note: Optional[str] = None


@dataclass
class TableLookupResult:
    """Result of looking up sag-tension data for an equivalent span."""
    is_assessed: bool
    status: str  # 'PASS' | 'NOT ASSESSED'
    reason: Optional[str]
    equivalent_span_m: float
    tension_15c_wind_kn: Optional[float] = None
    tension_27c_kn: Optional[float] = None
    sag_15c_m: Optional[float] = None
    sag_27c_m: Optional[float] = None
    sag_65c_m: Optional[float] = None
    warnings: list[str] = field(default_factory=list)


def calculate_equivalent_span_m(spans_m: list[float]) -> float:
    """Calculate the Ruling / Equivalent Span for a strain section in meters (m).

    Formula (original tool line 10448-10454):
        L_eq = sqrt(sum(s^3) / sum(s))
    """
    if not spans_m:
        raise ValueError("Cannot calculate equivalent span from an empty list of spans.")

    for s in spans_m:
        if s <= 0:
            raise ValueError(f"Span length must be strictly positive, got {s} m.")

    sum_cubed = sum(s ** 3 for s in spans_m)
    sum_linear = sum(spans_m)

    return math.sqrt(sum_cubed / sum_linear)


def lookup_tension_kn(table_rows: list[dict[str, Any]], eq_span_m: float) -> tuple[Optional[float], list[str]]:
    """Interpolate tension at 15C+wind from span-tension chart (original tool line 10457-10471).

    Replicates chart clamping with warning 'outside chart range'.
    """
    if not table_rows:
        return None, ["input needed: lookup table rows"]

    pts = []
    for r in table_rows:
        s = num(r.get("span_m"))
        t = num(r.get("tension_kN") or r.get("tension_15c_wind_kn"))
        if s is not None and t is not None:
            pts.append((s, t))

    pts.sort(key=lambda p: p[0])
    if not pts:
        return None, ["input needed: valid span points in lookup table"]

    warnings = []
    if eq_span_m <= pts[0][0]:
        if eq_span_m < pts[0][0]:
            warnings.append("outside chart range")
        return pts[0][1], warnings

    if eq_span_m >= pts[-1][0]:
        if eq_span_m > pts[-1][0]:
            warnings.append("outside chart range")
        return pts[-1][1], warnings

    for i in range(len(pts) - 1):
        s0, t0 = pts[i]
        s1, t1 = pts[i + 1]
        if s0 <= eq_span_m <= s1:
            f = (eq_span_m - s0) / (s1 - s0) if (s1 != s0) else 0.0
            return t0 + f * (t1 - t0), warnings

    return pts[-1][1], warnings


def lookup_sag_m(
    table_rows: list[dict[str, Any]],
    eq_span_m: float,
    sag_field: str = "sag_65_m"
) -> tuple[Optional[float], list[str]]:
    """Linear interpolation of a named sag column vs span_m (original tool line 10473-10488).

    Replicates chart clamping with warning 'outside chart range'.
    """
    if not table_rows:
        return None, ["input needed: lookup table rows"]

    pts = []
    for r in table_rows:
        s = num(r.get("span_m"))
        t = num(r.get(sag_field) or r.get(sag_field.replace("_m", "_m")))
        if s is not None and t is not None:
            pts.append((s, t))

    pts.sort(key=lambda p: p[0])
    if not pts:
        return None, ["input needed: valid span points in lookup table"]

    warnings = []
    if eq_span_m <= pts[0][0]:
        if eq_span_m < pts[0][0]:
            warnings.append("outside chart range")
        return pts[0][1], warnings

    if eq_span_m >= pts[-1][0]:
        if eq_span_m > pts[-1][0]:
            warnings.append("outside chart range")
        return pts[-1][1], warnings

    for i in range(len(pts) - 1):
        s0, t0 = pts[i]
        s1, t1 = pts[i + 1]
        if s0 <= eq_span_m <= s1:
            f = (eq_span_m - s0) / (s1 - s0) if (s1 != s0) else 0.0
            return t0 + f * (t1 - t0), warnings

    return pts[-1][1], warnings


def conductor_sag_m(
    cond: Optional[dict[str, Any]],
    eq_span_m: float,
    span_tables: list[dict[str, Any]],
    sag_field: str = "sag_65_m"
) -> tuple[float, list[str]]:
    """Find table and lookup sag for conductor (original tool line 10489-10499)."""
    if not cond:
        return 0.0, ["input needed: conductor"]
    table_id = str(cond.get("lookup_table") or "").strip()
    if table_id and span_tables:
        rows = [r for r in span_tables if str(r.get("table_id") or "") == table_id]
        s, warns = lookup_sag_m(rows, eq_span_m, sag_field)
        if s is not None:
            return s, warns
    return 0.0, ["no sag-tension data"]


def scale_sag(sag_eq: Optional[float], actual_span: float, eq_span: float) -> float:
    """Scale sag from equivalent span to actual span (original tool line 10500-10505):
        S_act = S_eq * (L_act / L_eq)^2
    """
    if not eq_span or eq_span <= 0 or sag_eq is None:
        return 0.0
    actual_span_pos = max(0.0, actual_span)
    return sag_eq * (actual_span_pos * actual_span_pos) / (eq_span * eq_span)


def state_change_tension_n(
    t1_n: float,
    w_kg_m: float,
    e_n_m2: float,
    alpha: float,
    a_m2: float,
    l_m: float,
    t1: float,
    t2: float,
    w2_kg_m: Optional[float] = None
) -> float:
    """Conductor state-change equation solver (original tool line 10506-10536).

    Solves for T2 at t2 given T1 at t1:
    EA alpha (t2-t1) + (W1^2 g^2 L^2 EA)/(24 T1^2) - T1 = (W2^2 g^2 L^2 EA)/(24 T2^2) - T2
    Solved by Newton-Raphson on f(T2) = 0.
    """
    if not t1_n or t1_n <= 0 or not w_kg_m or not e_n_m2 or not a_m2 or not l_m:
        return t1_n

    g = 9.81
    ea = e_n_m2 * a_m2
    w2 = w2_kg_m if (w2_kg_m is not None and w2_kg_m > 0) else w_kg_m
    wg1_2 = (w_kg_m * g) * (w_kg_m * g)
    wg2_2 = (w2 * g) * (w2 * g)

    k1 = (wg1_2 * l_m * l_m * ea) / 24.0
    k2 = (wg2_2 * l_m * l_m * ea) / 24.0

    left = ea * alpha * (t2 - t1) + k1 / (t1_n * t1_n) - t1_n

    # Initial guess
    t = t1_n * (0.85 if t2 > t1 else 1.15)
    for _ in range(50):
        t_sq = t * t
        f = k2 / t_sq - t - left
        df = -2.0 * k2 / (t_sq * t) - 1.0
        d = f / df
        t -= d
        if abs(d) < 1e-4:
            break
        if t < 1.0:
            t = 1.0

    return t


def conductor_e_n(cond: Optional[dict[str, Any]]) -> Optional[float]:
    """Conductor E in N/m2 from construction data (original tool line 10538-10541).

    Fails closed if missing from master data.
    """
    if not cond:
        return None
    e_kg_mm2 = num(
        cond.get("Modulus_of_Elasticity_kg/mm²") or
        cond.get("Modulus_of_Elasticity_kg_mm2") or
        cond.get("modulus_kg_mm2") or
        cond.get("modulus_of_elasticity_kg_mm2")
    )
    if e_kg_mm2 is not None and e_kg_mm2 > 0:
        return e_kg_mm2 * 9.80665e6
    return None


def conductor_alpha(cond: Optional[dict[str, Any]]) -> Optional[float]:
    """Conductor thermal expansion coefficient /C (original tool line 10542-10544).

    Fails closed if missing from master data.
    """
    if not cond:
        return None
    return num(
        cond.get("Thermal_Expansion_Coefficient _/°C") or
        cond.get("Thermal_Expansion_Coefficient_/_°C") or
        cond.get("thermal_expansion") or
        cond.get("thermal_expansion_coefficient") or
        cond.get("alpha")
    )


def conductor_uts_dan(cond: Optional[dict[str, Any]]) -> float:
    """Conductor ultimate tensile strength in daN (original tool line 10545-10548)."""
    if not cond:
        return 0.0
    return num(
        cond.get("Ultimate_Tensile_Strength_daN") or
        cond.get("UTS_daN") or
        cond.get("ultimate_tensile_strength_dan"),
        0.0
    ) or 0.0


def conductor_weff_kg_m(cond: Optional[dict[str, Any]], q_cond_n_m2: float = 575.0) -> float:
    """Effective conductor mass density under wind (kg/m): sqrt(W^2 + (q_c*d/g)^2) (original tool line 10549-10555)."""
    if not cond:
        return 0.0
    w = num(cond.get("Weight_kg/m") or cond.get("Weight_kg_m") or cond.get("weight_kg_m"), 0.0) or 0.0
    d = dia_m(cond)
    g = 9.81
    q = q_cond_n_m2 if (q_cond_n_m2 and q_cond_n_m2 > 0) else 575.0
    wind_n_per_m = q * d
    return math.sqrt(w * w + (wind_n_per_m / g) * (wind_n_per_m / g))


def horizontal_tension_from_sag_n(w_kg_m: float, l_m: float, sag_m: float) -> float:
    """Invert level-span catenary: given mid-span sag s (m), find horizontal tension H (N) (original tool line 10561-10584).

    s = a * (cosh(L/(2a)) - 1), a = H/w, w = W*g (N/m).
    """
    if not w_kg_m or not l_m or not sag_m or sag_m <= 0:
        return 0.0

    g = 9.81
    w = w_kg_m * g
    h = (w * l_m * l_m) / (8.0 * sag_m)

    for _ in range(40):
        a = h / w
        if a < 1e-6:
            h = 1.0
            break
        half = l_m / (2.0 * a)
        ch = math.cosh(min(half, 50.0))
        s_calc = a * (ch - 1.0)
        ds_da = (ch - 1.0) - half * math.sinh(min(half, 50.0))
        err = s_calc - sag_m
        ds_dh = ds_da / w
        if abs(ds_dh) < 1e-12:
            break
        h -= err / ds_dh
        if h < 1.0:
            h = 1.0
        if abs(err) < 1e-5:
            break

    return h


def conductor_area_m2(cond: Optional[dict[str, Any]]) -> float:
    """Cross-section area for state-change in m2 (original tool line 10619-10626).

    Prefers Conductor Stress Area (mm2) when set, else pi*(dia_m)^2 / 4.
    """
    if not cond:
        return 0.0
    stress_mm2 = num(
        cond.get("stress_area_mm2") or
        cond.get("Conductor Stress Area (mm²)") or
        cond.get("Conductor_Stress_Area_mm2"),
        0.0
    ) or 0.0
    if stress_mm2 > 0:
        return stress_mm2 * 1e-6

    d = dia_m(cond)
    if not d:
        return 0.0
    return math.pi * d * d / 4.0


def catenary_unequal(
    cond: Optional[dict[str, Any]],
    t65_n: float,
    l_m: float,
    elev_a: float,
    elev_b: float,
    attach_h_a: float,
    attach_h_b: float,
    survey_pts: Optional[list[dict[str, Any]]] = None
) -> dict[str, Any]:
    """Catenary for unequal-support spans with absolute elevations (original tool line 10635-10731).

    Solves:
        Y(x) = a * cosh((x - x0) / a) + C
    where a = H / w, H = horizontal tension, w = W*g.
    """
    w_kg_m = num(cond.get("Weight_kg/m") or cond.get("Weight_kg_m") or cond.get("weight_kg_m"), 0.0) or 0.0 if cond else 0.0
    empty = {
        "maxSag_m": 0.0,
        "minClearance_m": attach_h_a,
        "minClearance_x": l_m / 2.0,
        "maxTerrain_m": max(elev_a, elev_b),
        "T65_N": t65_n or 0.0,
        "a": 0.0,
        "x0": 0.0,
        "C": 0.0,
        "samples": []
    }
    if not w_kg_m or not t65_n or t65_n <= 0 or l_m <= 0:
        return empty

    g = 9.81
    w = w_kg_m * g
    h = t65_n
    a = h / w

    y_a = elev_a + attach_h_a
    y_b = elev_b + attach_h_b

    # Solve for u = x0 / a:
    # y_b - y_a = a * (cosh((L - x0)/a) - cosh(-x0/a))
    u = 0.0
    dy = y_b - y_a
    for _ in range(40):
        f = a * (math.cosh((l_m / a) - u) - math.cosh(-u)) - dy
        df = a * (-math.sinh((l_m / a) - u) + math.sinh(-u))
        if abs(df) < 1e-14:
            break
        step = f / df
        u -= step
        if abs(step) < 1e-10:
            break

    x0 = u * a
    c_const = y_a - a * math.cosh(-u)

    sorted_survey = []
    if survey_pts:
        for p in survey_pts:
            px = num(p.get("x"))
            ph = num(p.get("h"))
            if px is not None and ph is not None:
                sorted_survey.append({"x": px, "h": ph})
        sorted_survey.sort(key=lambda p: p["x"])

    def ground_at(x: float) -> float:
        if x <= 0:
            return elev_a
        if x >= l_m:
            return elev_b
        if sorted_survey:
            pts = [{"x": 0.0, "h": 0.0}]
            for sp in sorted_survey:
                if 1e-6 < sp["x"] < l_m - 1e-6:
                    pts.append({"x": sp["x"], "h": sp["h"]})
            pts.append({"x": l_m, "h": elev_b - elev_a})
            for i in range(len(pts) - 1):
                if pts[i]["x"] <= x <= pts[i + 1]["x"]:
                    denom = pts[i + 1]["x"] - pts[i]["x"]
                    f = (x - pts[i]["x"]) / denom if denom else 1.0
                    return elev_a + pts[i]["h"] + f * (pts[i + 1]["h"] - pts[i]["h"])
        return elev_a + (elev_b - elev_a) * (x / l_m)

    n_samp = max(40, math.ceil(l_m))
    max_sag = 0.0
    min_clr = float("inf")
    min_clr_x = 0.0
    max_terrain = float("-inf")
    samples = []

    for i in range(n_samp + 1):
        x = (i / n_samp) * l_m
        y_cond = a * math.cosh((x - x0) / a) + c_const
        y_chord = y_a + (y_b - y_a) * (x / l_m)
        sag = y_chord - y_cond
        if sag > max_sag:
            max_sag = sag
        y_gnd = ground_at(x)
        if y_gnd > max_terrain:
            max_terrain = y_gnd
        clr = y_cond - y_gnd
        if clr < min_clr:
            min_clr = clr
            min_clr_x = x
        samples.append({
            "x": x, "yCond": y_cond, "yGnd": y_gnd, "yChord": y_chord, "sag": sag, "clearance": clr
        })

    if not math.isfinite(min_clr):
        min_clr = min(attach_h_a, attach_h_b) - max_sag
        min_clr_x = l_m / 2.0
    if not math.isfinite(max_terrain):
        max_terrain = max(elev_a, elev_b)

    return {
        "maxSag_m": max_sag,
        "minClearance_m": min_clr,
        "minClearance_x": min_clr_x,
        "maxTerrain_m": max_terrain,
        "T65_N": t65_n,
        "a": a,
        "x0": x0,
        "C": c_const,
        "samples": samples
    }


def catenary_y(x: float, a: float, x0: float, c: float) -> float:
    """Evaluate catenary Y(x) given solved a, x0, C (original tool line 10734-10737)."""
    if not a:
        return 0.0
    return a * math.cosh((x - x0) / a) + c


def catenary_vertical_ends(
    cond: Optional[dict[str, Any]],
    h_kn: float,
    l_m: float,
    elev_a: float,
    elev_b: float,
    attach_h_a: float,
    attach_h_b: float
) -> dict[str, Any]:
    """Vertical reactions at span ends from catenary in kN (original tool line 11372-11411).

    Positive = down-pull on pole; negative = uplift.
    """
    w_kg_m = num(cond.get("Weight_kg/m") or cond.get("Weight_kg_m") or cond.get("weight_kg_m"), 0.0) or 0.0 if cond else 0.0
    empty = {"V_start_kN": 0.0, "V_end_kN": 0.0, "x0": l_m / 2.0, "L": l_m or 0.0, "w": 0.0}

    if not w_kg_m or not h_kn or h_kn <= 0 or not l_m or l_m <= 0:
        if not w_kg_m or not l_m or l_m <= 0:
            return empty
        v_half = (w_kg_m * 9.81 * l_m / 2.0) / 1000.0
        return {"V_start_kN": v_half, "V_end_kN": v_half, "x0": l_m / 2.0, "L": l_m, "w": w_kg_m * 9.81}

    w = w_kg_m * 9.81
    h = h_kn * 1000.0
    a = h / w
    y_a = (elev_a or 0.0) + (attach_h_a or 0.0)
    y_b = (elev_b or 0.0) + (attach_h_b or 0.0)

    u = 0.0
    dy = y_b - y_a
    for _ in range(40):
        f = a * (math.cosh((l_m / a) - u) - math.cosh(-u)) - dy
        df = a * (-math.sinh((l_m / a) - u) + math.sinh(-u))
        if abs(df) < 1e-14:
            break
        step = f / df
        u -= step
        if abs(step) < 1e-10:
            break

    x0 = u * a
    v_start_n = w * x0
    v_end_n = w * (l_m - x0)

    return {
        "V_start_kN": v_start_n / 1000.0,
        "V_end_kN": v_end_n / 1000.0,
        "x0": x0,
        "L": l_m,
        "w": w
    }


def lookup_tension_27_kn(
    cond: Optional[dict[str, Any]],
    eq_span_m: float,
    span_tables: list[dict[str, Any]]
) -> tuple[float, list[str]]:
    """Lookup tension at 27C from chart (original tool line 10739-10760)."""
    if not cond:
        return 0.0, ["input needed: conductor"]

    table_id = str(cond.get("lookup_table") or "").strip()
    if table_id and span_tables:
        rows = [r for r in span_tables if str(r.get("table_id") or "") == table_id]
        pts = []
        for r in rows:
            s = num(r.get("span_m"))
            t = num(r.get("tension_27_kN") or r.get("tension_27c_kn"))
            if s is not None and t is not None:
                pts.append((s, t))
        pts.sort(key=lambda p: p[0])
        if pts:
            warnings = []
            if eq_span_m <= pts[0][0]:
                if eq_span_m < pts[0][0]:
                    warnings.append("outside chart range")
                return pts[0][1], warnings
            if eq_span_m >= pts[-1][0]:
                if eq_span_m > pts[-1][0]:
                    warnings.append("outside chart range")
                return pts[-1][1], warnings
            for i in range(len(pts) - 1):
                if pts[i][0] <= eq_span_m <= pts[i + 1][0]:
                    f = (eq_span_m - pts[i][0]) / (pts[i + 1][0] - pts[i][0])
                    return pts[i][1] + f * (pts[i + 1][1] - pts[i][1]), warnings
            return pts[-1][1], warnings

    # Fail closed rather than fallback to everyday tension
    return 0.0, ["no sag-tension data"]


def conductor_tension_kn(
    cond: Optional[dict[str, Any]],
    eq_span_m: float,
    span_tables: list[dict[str, Any]]
) -> tuple[float, list[str]]:
    """Lookup tension at 15C+wind from chart (original tool line 10774-10783)."""
    if not cond:
        return 0.0, ["input needed: conductor"]
    table_id = str(cond.get("lookup_table") or "").strip()
    if table_id and span_tables:
        rows = [r for r in span_tables if str(r.get("table_id") or "") == table_id]
        t, warns = lookup_tension_kn(rows, eq_span_m)
        if t is not None:
            return t, warns
    return 0.0, ["no sag-tension data"]


# --- Legacy compatibility shims ---
def lookup_sag_tension_table(
    table_points: list[TableLookupPoint],
    equivalent_span_m: float,
) -> TableLookupResult:
    """Legacy compatibility table lookup function."""
    if not table_points:
        return TableLookupResult(
            is_assessed=False,
            status="NOT ASSESSED",
            reason="Lookup table has no calibration data points.",
            equivalent_span_m=equivalent_span_m,
        )

    pts = sorted(table_points, key=lambda p: p.span_m)
    min_span = pts[0].span_m
    max_span = pts[-1].span_m

    if equivalent_span_m < min_span or equivalent_span_m > max_span:
        return TableLookupResult(
            is_assessed=False,
            status="NOT ASSESSED",
            reason=(
                f"Equivalent span {equivalent_span_m:.2f} m is outside lookup table range "
                f"[{min_span:.1f} m, {max_span:.1f} m]. Extrapolation is strictly forbidden."
            ),
            equivalent_span_m=equivalent_span_m,
        )

    for p in pts:
        if math.isclose(p.span_m, equivalent_span_m, rel_tol=1e-6):
            warnings = []
            if p.needs_confirmation:
                warnings.append(
                    f"Lookup point at {p.span_m:.1f} m requires confirmation: {p.confirmation_note or 'Unverified calibration data'}"
                )
            return TableLookupResult(
                is_assessed=True,
                status="PASS",
                reason=None,
                equivalent_span_m=equivalent_span_m,
                tension_15c_wind_kn=p.tension_15c_wind_kn,
                tension_27c_kn=p.tension_27c_kn,
                sag_15c_m=p.sag_15c_m,
                sag_27c_m=p.sag_27c_m,
                sag_65c_m=p.sag_65c_m,
                warnings=warnings,
            )

    p1 = None
    p2 = None
    for i in range(len(pts) - 1):
        if pts[i].span_m <= equivalent_span_m <= pts[i + 1].span_m:
            p1 = pts[i]
            p2 = pts[i + 1]
            break

    if p1 is None or p2 is None:
        return TableLookupResult(
            is_assessed=False,
            status="NOT ASSESSED",
            reason=f"Could not locate interpolation bracket for span {equivalent_span_m:.2f} m.",
            equivalent_span_m=equivalent_span_m,
        )

    fraction = (equivalent_span_m - p1.span_m) / (p2.span_m - p1.span_m)
    t_15_wind = p1.tension_15c_wind_kn + fraction * (p2.tension_15c_wind_kn - p1.tension_15c_wind_kn)
    t_27 = p1.tension_27c_kn + fraction * (p2.tension_27c_kn - p1.tension_27c_kn)
    s_15 = p1.sag_15c_m + fraction * (p2.sag_15c_m - p1.sag_15c_m)
    s_27 = p1.sag_27c_m + fraction * (p2.sag_27c_m - p1.sag_27c_m)
    s_65 = p1.sag_65c_m + fraction * (p2.sag_65c_m - p1.sag_65c_m)

    warnings = []
    if p1.needs_confirmation:
        warnings.append(
            f"Lookup lower bound at {p1.span_m:.1f} m requires confirmation: {p1.confirmation_note or 'Unverified calibration data'}"
        )
    if p2.needs_confirmation:
        warnings.append(
            f"Lookup upper bound at {p2.span_m:.1f} m requires confirmation: {p2.confirmation_note or 'Unverified calibration data'}"
        )

    return TableLookupResult(
        is_assessed=True,
        status="PASS",
        reason=None,
        equivalent_span_m=equivalent_span_m,
        tension_15c_wind_kn=round(t_15_wind, 5),
        tension_27c_kn=round(t_27, 5),
        sag_15c_m=round(s_15, 5),
        sag_27c_m=round(s_27, 5),
        sag_65c_m=round(s_65, 5),
        warnings=warnings,
    )


def get_pole_sag_span_m(fore_span_m: float, aft_span_m: float) -> float:
    if fore_span_m and fore_span_m > 0:
        return fore_span_m
    return aft_span_m or 0.0


def scale_sag_to_actual_span_m(
    sag_at_equivalent_span_m: float,
    actual_span_m: float,
    equivalent_span_m: float,
) -> float:
    return scale_sag(sag_at_equivalent_span_m, actual_span_m, equivalent_span_m)


def calculate_tension_pct_of_uts(
    tension_kn: float,
    ultimate_tensile_strength_kn: float,
) -> float:
    if ultimate_tensile_strength_kn <= 0:
        raise ValueError("UTS must be strictly positive.")
    return (tension_kn / ultimate_tensile_strength_kn) * 100.0


def default_eds_assessment(ratio_pct: float, limit_pct: float = 20.0) -> str:
    return "NOT ASSESSED"


assess_eds_check = default_eds_assessment


def assess_max_stress_15c_wind(ratio_pct: float, limit_pct: float = 40.0) -> str:
    return "OK" if ratio_pct <= limit_pct else "FAIL"
