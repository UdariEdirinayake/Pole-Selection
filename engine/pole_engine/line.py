"""Full calculation orchestrator module ported from computeLine in docs/reference/index.html (lines 11530-13979).

Strict rules:
- Port the math and operations in the exact order of computeLine.
- No hard-coded engineering values or fallback data tables.
- Return structured dictionary results.
"""
from __future__ import annotations

import math
from typing import Any, Optional

from pole_engine.utils import num, is_missing, to_rad, dia_m
from pole_engine.circuits import (
    parse_levels,
    identify_circuits,
    stage_band,
    bottom_most_band,
    clearance_band_label,
    circuit_band_label,
    is_lv_abc_conductor,
    hvabc_flags_for_list,
    hvabc_level_flags,
    earth_heights_of,
    normalize_config_row,
)
from pole_engine.sag_tension import (
    calculate_equivalent_span_m,
    lookup_tension_kn,
    lookup_sag_m,
    conductor_sag_m,
    scale_sag,
    state_change_tension_n,
    conductor_e_n,
    conductor_alpha,
    conductor_uts_dan,
    conductor_weff_kg_m,
    horizontal_tension_from_sag_n,
    conductor_area_m2,
    catenary_unequal,
    catenary_vertical_ends,
    lookup_tension_27_kn,
    conductor_tension_kn,
)
from pole_engine.loads import (
    bm_wind_cond,
    bm_tension_angle,
    bm_tension_full,
    bm_wind_pole,
    bm_equip_parts,
    to_pole_top,
    find_equipment_row,
    tf_area,
    tf_weight,
    parse_equipment_kva,
)
from pole_engine.selection import (
    is_multi_pole_class,
    pick_unguyed,
    pick_strutted_pair,
    pick_guyed,
    find_capacity_row,
    parse_base_cap,
    push_alt,
)
from pole_engine.guys import guy_wire_load_dan, guy_long_force_dan
from pole_engine.buckling import buckling_capacity_kn
from pole_engine.insulators import (
    select_insulator_by_angle,
    cant_of,
    ins_rank,
    insulator_nominal_height_m,
)
from pole_engine.foundation import compute_foundation
from pole_engine.clearances import (
    creepage_allowance_m,
    table_ground_m,
    table_cc_m,
    cc_req,
    structure_req_m,
    min_sep,
    sep_at_angle,
    max_angle,
)


def format_pole_label(ph: Any, label: Any) -> str:
    s = str(label or "").strip()
    if not s or s in ("—", "X") or "excessive" in s.lower():
        return s
    import re
    if re.search(r"^\d+\s*/\s*\d+", s):
        return re.sub(r"^(\d+)\s*/\s*(\d+)\s*(.*)$", lambda m: f"{m.group(1)}/{m.group(2)}{' ' + m.group(3).strip() if m.group(3) else ''}", s)
    m = re.match(r"^(2x)?\s*(\d+)\s*(.*)$", s, re.IGNORECASE)
    if m:
        return f"{ph}/{(m.group(1) or '')}{m.group(2)}{' ' + m.group(3).strip() if m.group(3) else ''}"
    return f"{ph}/{s}"


def format_strutted(main_class: Any, load_dan: float) -> str:
    pair = pick_strutted_pair(load_dan)
    if not pair:
        return "X"
    import re
    main = re.sub(r"\s*U\s*$", "", str(main_class or ""), flags=re.IGNORECASE).strip() or "200"
    return f"{main} - {pair}"


def unit_weight(cond: Optional[dict[str, Any]]) -> float:
    if not cond:
        return 0.0
    return num(cond.get("Weight_kg/m") or cond.get("Weight_kg_m") or cond.get("weight_kg_m"), 0.0) or 0.0


def compute_line(line_rows: list[dict[str, Any]], settings: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
    """Execute complete line calculation following computeLine in docs/reference/index.html."""
    configs = data.get("configs") or []
    config_no = settings.get("config_no")
    config = next((c for c in configs if str(c.get("config_no")) == str(config_no)), None)
    if not config and configs:
        config = configs[0]
    if not config:
        raise ValueError(f"Unknown pole configuration: {config_no}")

    normalize_config_row(config)

    span_tables = data.get("span_tension_tables") or []
    conductors = data.get("conductors") or []
    by_band = settings.get("conductors_by_band") or {
        "HH": [settings.get("conductor_HH")] if settings.get("conductor_HH") else [],
        "H": [settings.get("conductor_H")] if settings.get("conductor_H") else [],
        "L": [settings.get("conductor_LV")] if settings.get("conductor_LV") else [],
        "E": []
    }
    if "E" not in by_band:
        by_band["E"] = []

    def code_at(band: str, idx: int) -> str:
        arr = by_band.get(band) or []
        if idx < len(arr) and arr[idx]:
            return str(arr[idx])
        return str(arr[0]) if arr else ""

    def cond_at(band: str, idx: int) -> Optional[dict[str, Any]]:
        c_code = code_at(band, idx)
        return next((c for c in conductors if str(c.get("code")) == c_code), None)

    q_cond = num(settings.get("wind_pressure_Nm2"), 575.0) or 575.0
    q_pole = num(settings.get("wind_pole_Nm2"), 865.0) or 865.0
    ttie_max = num((settings.get("tie_thresholds") or {}).get("ttie_max"), 10.0) or 10.0
    stie_max = num((settings.get("tie_thresholds") or {}).get("stie_max"), 20.0) or 20.0
    guy_angle = num(settings.get("guy_wire_angle_deg"), 30.0) or 30.0

    pole_height = num(config.get("pole_height_m"), 11.0) or 11.0
    lv = parse_levels(config)
    n_hh = lv["nHH"]
    n_h = lv["nH"]
    n_l = lv["nL"]
    n_lv = lv["nLV"]
    n_e = lv["nE"]
    heights = lv["heights"]
    ns = lv["ns"]
    guy_h = lv["guyH"]
    tguy_h = lv["tguyH"]

    n_stages = n_hh + n_h + n_l
    stage_earth = [False] * n_stages
    for k in range(n_e):
        stage_earth[n_hh + n_h + n_lv + k] = True

    stage_abc = [False] * n_stages
    flags_hh = hvabc_flags_for_list(ns[:n_hh])
    for k, f in enumerate(flags_hh):
        stage_abc[k] = f
    flags_h = hvabc_flags_for_list(ns[n_hh:n_hh + n_h])
    for k, f in enumerate(flags_h):
        stage_abc[n_hh + k] = f

    circuit_id = identify_circuits(config)
    stage_cond = [None] * n_stages
    band_circuit_ordinal = {"HH": 0, "H": 0, "L": 0, "E": 0}

    for circ in circuit_id.get("circuits") or []:
        b = circ["band"]
        ord_idx = band_circuit_ordinal[b]
        band_circuit_ordinal[b] += 1
        cond = cond_at(b, ord_idx)
        for li in circ.get("levelIndices") or []:
            if li < len(stage_cond) and not stage_cond[li]:
                stage_cond[li] = cond

    for i in range(n_hh):
        stage_cond[i] = cond_at("HH", i) or stage_cond[i]
    for i in range(n_h):
        stage_cond[n_hh + i] = cond_at("H", i) or stage_cond[n_hh + i]
    for i in range(n_lv):
        stage_cond[n_hh + n_h + i] = cond_at("L", i) or stage_cond[n_hh + n_h + i]
    for k in range(n_e):
        stage_cond[n_hh + n_h + n_lv + k] = cond_at("E", k) or None

    n_cond_hh = sum(ns[:n_hh])
    n_cond_h = sum(ns[n_hh:n_hh + n_h])
    n_cond_l = sum(ns[n_hh + n_h:n_stages])

    capacities = data.get("capacities") or []
    pole_breadth = 0.28
    if capacities:
        breadths = [
            num(c.get("avg_breadth_m"), 0.0) or 0.0
            for c in capacities
            if num(c.get("pole_height_m") or c.get("height_m")) == pole_height
            and num(c.get("avg_breadth_m"), 0.0) > 0
            and not is_multi_pole_class(c)
        ]
        if breadths:
            pole_breadth = max(breadths)

    rows = []
    for r in line_rows:
        rows.append({
            **r,
            "pole_no": int(num(r.get("pole_no"), 1.0) or 1.0),
            "aft": num(r.get("aft_span_m"), 0.0) or 0.0,
            "fore": num(r.get("fore_span_m"), 0.0) or 0.0,
            "elev_delta": num(r.get("elev_delta_m"), 0.0) or 0.0,
            "angle": num(r.get("angle_deg"), 0.0) or 0.0,
            "soil": r.get("soil_class"),
            "equipment": r.get("equipment") or r.get("transformer_kva") or "",
            "kva": parse_equipment_kva(r.get("equipment") or r.get("transformer_kva")),
            "section": r.get("section") or 1,
            "span_environment": r.get("span_environment") or "along or across any road or street",
            "survey_points": r.get("survey_points") if isinstance(r.get("survey_points"), list) else [],
            "structure_points": r.get("structure_points") if isinstance(r.get("structure_points"), list) else [],
            "spur_enabled": bool(r.get("spur_enabled")),
            "spur_circuits": r.get("spur_circuits") if isinstance(r.get("spur_circuits"), list) else [],
            "guy_theta_enabled": bool(r.get("guy_theta_enabled")),
            "guy_theta_deg": num(r.get("guy_theta_deg"), 0.0) or 0.0 if r.get("guy_theta_enabled") else 0.0,
            "guy_pole_angle_deg": num(r.get("guy_pole_angle_deg"), guy_angle) or guy_angle,
            "crossarms": r.get("crossarms") or {"HH": [], "H": []},
            "circuit_sections": r.get("circuit_sections") or {},
            "transition": bool(r.get("transition")),
        })

    abs_elev = {}
    run_elev = 0.0
    for r in rows:
        abs_elev[f"{r['section']}:{r['pole_no']}"] = run_elev
        r["abs_elev"] = run_elev
        run_elev += r["elev_delta"]

    section_unequal = {}
    for r in rows:
        key = str(r["section"])
        if key not in section_unequal:
            section_unequal[key] = False
        if abs(r["elev_delta"]) > 1e-6 or (r["survey_points"] and len(r["survey_points"])):
            section_unequal[key] = True

    stage_bands = []
    stage_volt_labels = []
    stage_clr_bands = []
    for i in range(n_stages):
        b = stage_band(i, n_hh, n_h, n_l)
        stage_bands.append(b)
        stage_volt_labels.append("Earth" if stage_earth[i] else f"{circuit_band_label(b)}{' ABC' if stage_abc[i] else ''}")
        stage_clr_bands.append("Earth" if stage_earth[i] else clearance_band_label(b, stage_abc[i]))

    ins_desc_hh = str(settings.get("insulator_HH_desc") or settings.get("insulator_hh") or "").strip()
    ins_desc_h = str(settings.get("insulator_H_desc") or settings.get("insulator_h") or "").strip()
    insulators_master = data.get("insulators") or []

    def ins_hgt_stage(i: int) -> float:
        band = stage_bands[i]
        if not band or band == "L" or stage_abc[i]:
            return 0.0
        desc = ins_desc_hh if band == "HH" else ins_desc_h
        return insulator_nominal_height_m(insulators_master, desc, 33 if band == "HH" else 11)

    def attach_ht(i: int) -> float:
        return (heights[i] if i < len(heights) else 0.0) + ins_hgt_stage(i)

    height_order = list(range(n_stages))
    height_order.sort(key=lambda idx: (attach_ht(idx), -idx), reverse=True)
    bottom_stage_idx = height_order[-1] if n_stages > 0 else 0
    bottom_band = "Earth" if (n_stages > 0 and stage_earth[bottom_stage_idx]) else bottom_most_band(n_hh, n_h, n_lv)

    def same_circuit(i: int, j: int) -> bool:
        return any(
            i in (c.get("levelIndices") or []) and j in (c.get("levelIndices") or [])
            for c in (circuit_id.get("circuits") or [])
        )

    section_spans: dict[Any, list[float]] = {}
    for r in rows:
        sec = r["section"]
        if sec not in section_spans:
            section_spans[sec] = []
        if r["fore"] > 0:
            section_spans[sec].append(r["fore"])

    tf_map = settings.get("tension_factors") or {}

    def factor_for(sec: Any, band: str, idx: int, circuit_sec_no: Optional[str] = None) -> float:
        circ1 = idx + 1
        cs_key = f"{band}:{circ1}|{circuit_sec_no}" if circuit_sec_no else f"{band}:{circ1}"
        if cs_key in tf_map:
            pct = num(tf_map[cs_key], 100.0) or 100.0
            return pct / 100.0
        sec_map = tf_map.get(str(sec)) or {}
        if cs_key in sec_map:
            pct = num(sec_map[cs_key], 100.0) or 100.0
            return pct / 100.0
        pct = num(sec_map.get(f"{band}:{idx}"), 100.0) or 100.0
        return pct / 100.0

    calc_method = settings.get("calc_method") or "leco_standard"
    section_eq = {}
    section_ten = {}
    section_t65 = {}

    for sec, spans in section_spans.items():
        eq = calculate_equivalent_span_m(spans)
        section_eq[sec] = eq
        stage_t = []
        for i, sc in enumerate(stage_cond):
            raw_t, _ = conductor_tension_kn(sc, eq, span_tables)
            b = stage_band(i, n_hh, n_h, n_l)
            loc_idx = i if b == "HH" else (i - n_hh if b == "H" else i - n_hh - n_h)
            fac = factor_for(sec, b, loc_idx)
            stage_t.append(raw_t * fac)

        section_ten[sec] = {
            "stages": stage_t,
            "HH": stage_t[0] if n_cond_hh and len(stage_t) > 0 else 0.0,
            "H": stage_t[n_hh] if n_cond_h and len(stage_t) > n_hh else 0.0,
            "L": stage_t[n_hh + n_h] if n_cond_l and len(stage_t) > n_hh + n_h else 0.0,
            "method": calc_method
        }

        t65_stages = []
        for i, sc in enumerate(stage_cond):
            if not sc or eq <= 0:
                t65_stages.append(None)
                continue
            b = stage_band(i, n_hh, n_h, n_l)
            loc_idx = i if b == "HH" else (i - n_hh if b == "H" else i - n_hh - n_h)
            fac = factor_for(sec, b, loc_idx)
            w_kg = unit_weight(sc)
            s65_eq, _ = conductor_sag_m(sc, eq, span_tables, "sag_65_m")
            if w_kg and s65_eq > 0:
                h65 = horizontal_tension_from_sag_n(w_kg, eq, s65_eq)
                if h65 > 0:
                    t65_stages.append(h65 * fac)
                    continue
            t27_kn, _ = lookup_tension_27_kn(sc, eq, span_tables)
            t27_n = t27_kn * 1000.0 * fac
            if not w_kg or not t27_n:
                t65_stages.append(None)
                continue
            e_n = conductor_e_n(sc) or (6600.0 * 9.80665e6)
            alpha = conductor_alpha(sc) or 0.000023
            a_m2 = conductor_area_m2(sc)
            t65_stages.append(state_change_tension_n(t27_n, w_kg, e_n, alpha, a_m2, eq, 27.0, 65.0))

        section_t65[sec] = t65_stages

    # Tension checks vs UTS
    eds_pct = (num(settings.get("eds_pct_uts"), 20.0) or 20.0) / 100.0
    max_pct = (num(settings.get("max_stress_pct_uts"), 40.0) or 40.0) / 100.0
    tension_checks = []

    for sec, eq_s in section_eq.items():
        ten = section_ten.get(sec) or {}
        for i, sc in enumerate(stage_cond):
            if not sc:
                continue
            uts_dan = conductor_uts_dan(sc)
            if not uts_dan:
                continue
            b = stage_band(i, n_hh, n_h, n_l)
            loc = i if b == "HH" else (i - n_hh if b == "H" else i - n_hh - n_h)
            fac = max(0.05, factor_for(sec, b, loc))
            t15 = ten.get("stages", [])[i] if i < len(ten.get("stages", [])) else None
            t27_raw, _ = lookup_tension_27_kn(sc, eq_s, span_tables)
            t27 = (t27_raw or 0.0) * fac

            limit15 = (uts_dan * max_pct) / 100.0
            limit27 = (uts_dan * eds_pct) / 100.0
            ok15 = t15 is not None and t15 <= limit15 + 1e-9
            ok27 = t27 is not None and t27 <= limit27 + 1e-9
            eds_ref = is_lv_abc_conductor(b, sc)
            eds_status = "na" if t27 is None else ("ok" if ok27 else ("caution" if eds_ref else "fail"))

            label = stage_volt_labels[i] if i < len(stage_volt_labels) else f"C{i+1}"
            pct15 = (t15 * 100.0 / uts_dan) * 100.0 if (uts_dan > 0 and t15 is not None) else None
            pct27 = (t27 * 100.0 / uts_dan) * 100.0 if (uts_dan > 0 and t27 is not None) else None

            tension_checks.append({
                "section": sec,
                "stage": i,
                "circuitLabel": label,
                "band": b,
                "code": sc.get("code"),
                "description": sc.get("description") or "",
                "T15w_kN": t15,
                "T27_kN": t27,
                "UTS_daN": uts_dan,
                "limit15_kN": limit15,
                "limit27_kN": limit27,
                "pct15_uts": pct15,
                "pct27_uts": pct27,
                "eds_pct": eds_pct * 100.0,
                "max_pct": max_pct * 100.0,
                "ok15": ok15,
                "ok27": ok27,
                "eds_status": eds_status,
                "eds_reference": eds_ref,
                "ok": ok15 and (ok27 or eds_ref)
            })

    results = []
    prev_section = None

    for idx, r in enumerate(rows):
        wind_span = (r["aft"] + r["fore"]) / 2.0
        weight_span = wind_span
        is_first = idx == 0
        is_last = idx == len(rows) - 1
        is_new_section = r["section"] != prev_section and idx > 0
        is_terminal = is_first or is_last or r["aft"] == 0.0 or r["fore"] == 0.0
        is_section_pole = not is_terminal and is_new_section
        if not is_terminal and r["transition"]:
            is_section_pole = True
        prev_section = r["section"]

        eq_span = section_eq.get(r["section"]) or calculate_equivalent_span_m([x for x in [r["aft"], r["fore"]] if x > 0])
        ten_fore = section_ten.get(r["section"]) or {"HH": 0.0, "H": 0.0, "L": 0.0, "stages": []}
        ten_aft = ten_fore
        if idx > 0 and rows[idx - 1]["section"] in section_ten:
            ten_aft = section_ten[rows[idx - 1]["section"]]

        stage_t2 = ten_fore.get("stages") or [0.0] * n_stages
        stage_t1 = ten_aft.get("stages") or [0.0] * n_stages

        bm_c = 0.0
        bm_t = 0.0
        bm_t_long = 0.0
        bm_t_long_section = 0.0
        cos_half = math.cos(to_rad(r["angle"]) / 2.0)
        sin_half = math.sin(to_rad(r["angle"]) / 2.0)
        qc = q_cond / 1000.0

        for i in range(n_stages):
            sc = stage_cond[i]
            di = dia_m(sc)
            ni = ns[i] if i < len(ns) else 0
            hi = heights[i] if i < len(heights) else 0.0
            t1 = stage_t1[i] if i < len(stage_t1) else 0.0
            t2 = stage_t2[i] if i < len(stage_t2) else 0.0

            bm_c += qc * di * wind_span * cos_half * ni * hi
            if not is_terminal:
                bm_t += (t1 * sin_half) * ni * hi + (t2 * sin_half) * ni * hi

            bm_t_long += ni * t2 * hi
            if not is_terminal:
                bm_t_long_section += (t1 - t2) * cos_half * ni * hi

        bm_p = bm_wind_pole(pole_height, pole_breadth, q_pole)
        tf_row = find_equipment_row(data.get("equipment") or data.get("transformers"), r["equipment"] or r["kva"])
        equip_parts = bm_equip_parts(tf_row, pole_height, q_pole)
        bm_e = equip_parts["total_kn_m"]

        pole_top_load = to_pole_top(bm_c + bm_t + bm_p + bm_e, pole_height)
        bm_long_full = (bm_t_long + bm_p + equip_parts["wind_bm_kn_m"] - equip_parts["weight_bm_kn_m"]) if is_terminal else abs(bm_t_long_section)
        residual_load = to_pole_top(bm_c + bm_p + bm_e, pole_height)

        guy_h_use = tguy_h if is_terminal else guy_h
        ell = max(pole_height * 5.0 / 6.0 - 0.4, 0.5)

        bm_guy_for_g = bm_t_long if is_terminal else (bm_t if bm_t > 0 else abs(bm_t_long_section))
        guy_load = guy_wire_load_dan(bm_guy_for_g, guy_h_use, guy_angle, 0.0) if bm_guy_for_g > 0 else 0.0

        long_load_dan = to_pole_top(bm_long_full, pole_height) if is_terminal else (abs(bm_t_long_section) / ell) * 100.0

        unguyed = pick_unguyed(pole_height, pole_top_load, capacities, allow_2x=True)
        if unguyed and long_load_dan > 0 and long_load_dan > unguyed["cap"] * 0.25:
            unguyed = None
        unguyed_label = unguyed["label"] if unguyed else "X"

        unguyed_no2x = pick_unguyed(pole_height, pole_top_load, capacities, allow_2x=False)
        if unguyed_no2x and long_load_dan > 0 and long_load_dan > unguyed_no2x["cap"] * 0.25:
            unguyed_no2x = None

        guy_wires_master = sorted(data.get("guy_wires") or [], key=lambda g: num(g.get("working_load_daN") or g.get("working_load_dan"), 0.0) or 0.0)
        selected_guy = next((g for g in guy_wires_master if (num(g.get("working_load_daN") or g.get("working_load_dan"), 0.0) or 0.0) >= guy_load), None)
        g_cls = str(selected_guy.get("code") or "L") if selected_guy else "H"

        guyed = pick_guyed(pole_height, residual_load, g_cls, capacities)
        tf_kg = tf_weight(r["equipment"] or r["kva"], data.get("equipment") or data.get("transformers"))

        # Vertical loads and buckling
        v_cond_kn = 0.0
        elev_this = r["abs_elev"]
        elev_next = elev_this + r["elev_delta"]
        elev_prev = rows[idx - 1]["abs_elev"] if idx > 0 else elev_this

        for i in range(n_stages):
            sc = stage_cond[i]
            if not sc:
                continue
            ni = ns[i] if i < len(ns) else 0
            if not ni:
                continue
            t_fore = stage_t2[i] if i < len(stage_t2) else 0.0
            t_aft = stage_t1[i] if i < len(stage_t1) else 0.0
            attach_h = attach_ht(i)

            if r["fore"] > 0:
                ends = catenary_vertical_ends(sc, t_fore, r["fore"], elev_this, elev_next, attach_h, attach_h)
                v_cond_kn += ni * ends["V_start_kN"]
            if r["aft"] > 0:
                ends = catenary_vertical_ends(sc, t_aft, r["aft"], elev_prev, elev_this, attach_h, attach_h)
                v_cond_kn += ni * ends["V_end_kN"]

        guy_vert_kn = (guy_load * math.cos(to_rad(guy_angle))) / 100.0
        v_eq_kn = (tf_kg * 9.81) / 1000.0
        v_tot_kn = v_cond_kn + guy_vert_kn + v_eq_kn
        buckling_demand = abs(v_tot_kn) * 2.5

        base = guyed["base"] if guyed else "200"
        guyed_before_buckling = f"{int(pole_height)}/{base} {g_cls}"
        buckling_kn = buckling_capacity_kn(pole_height, base, capacities)
        buckling_ok = buckling_kn >= buckling_demand
        buckling_compliance = "Pass" if buckling_ok else "Fail"

        # Buckling upsize
        base_b = base
        cap_b = buckling_kn
        order = ["200", "350", "500", "850", "1200"]
        bi = order.index(base_b) if base_b in order else 0
        while cap_b < buckling_demand and bi < len(order) - 1:
            bi += 1
            base_b = order[bi]
            cap_b = buckling_capacity_kn(pole_height, base_b, capacities)

        buck_ok_final = cap_b >= buckling_demand
        recommended_on_buckling = f"{int(pole_height)}/{base_b} {g_cls}" if buck_ok_final else f"X (need >{buckling_demand:.0f} kN)"

        strut_main = base if guyed else "200"
        bm_tension_for_strut = bm_t_long if is_terminal else bm_t
        pole_top_load_strut = to_pole_top(bm_tension_for_strut, pole_height)
        strutted_label = format_strutted(strut_main, pole_top_load_strut)

        # Recommendation selection
        if unguyed_no2x:
            recommended = unguyed_no2x["label"]
            most_economic = unguyed_no2x["label"]
        elif recommended_on_buckling != "—" and not recommended_on_buckling.startswith("X"):
            recommended = recommended_on_buckling
            most_economic = recommended_on_buckling
        elif strutted_label != "X":
            recommended = strutted_label
            most_economic = strutted_label
        else:
            recommended = "X"
            most_economic = "X"

        # Foundation calculation
        fd = compute_foundation({
            "poleHeight": pole_height,
            "recommended": recommended,
            "isTerminal": is_terminal,
            "isGuyedOrStrut": ("S" in recommended or "/" in recommended),
            "heights": heights,
            "ns": ns,
            "nHH": n_hh,
            "nH": n_h,
            "nL": n_l,
            "stageCond": stage_cond,
            "stageT1": stage_t1,
            "stageT2": stage_t2,
            "windSpan": wind_span,
            "weightSpan": weight_span,
            "angleDeg": r["angle"],
            "qCond": q_cond,
            "qPole": q_pole,
            "guyLoadDaN": guy_load if ("/" in recommended) else 0.0,
            "guyAngleDeg": guy_angle,
            "tfWeightKg": tf_kg,
            "tfArea": equip_parts["area_m2"],
            "equipment": r["equipment"],
            "tfKva": r["kva"],
            "soilClass": r["soil"],
            "data": data
        })

        # Sags and clearances
        l_fore = r["fore"] if r["fore"] > 0 else (r["aft"] if r["aft"] > 0 else 0.0)
        elev_a = r["abs_elev"]
        elev_b = elev_a + r["elev_delta"]
        sag65 = []
        sag27 = []
        stage_profiles = []
        lowest_clearance = None

        t65_sec = section_t65.get(r["section"]) or []

        for i in range(n_stages):
            sc = stage_cond[i]
            s27_eq, _ = conductor_sag_m(sc, eq_span, span_tables, "sag_27_m")
            b_stage = stage_band(i, n_hh, n_h, n_l)
            loc_idx = i if b_stage == "HH" else (i - n_hh if b_stage == "H" else i - n_hh - n_h)
            fac_s = max(0.05, factor_for(r["section"], b_stage, loc_idx))
            sag27.append(scale_sag(s27_eq, l_fore, eq_span) / fac_s)

            t65_n = t65_sec[i] if i < len(t65_sec) else None
            if not sc or l_fore <= 0 or not t65_n or t65_n <= 0:
                s65_eq, _ = conductor_sag_m(sc, eq_span, span_tables, "sag_65_m")
                sag65.append(scale_sag(s65_eq, l_fore, eq_span))
                stage_profiles.append(None)
            else:
                cat = catenary_unequal(sc, t65_n, l_fore, elev_a, elev_b, attach_ht(i), attach_ht(i), r["survey_points"])
                sag65.append(cat["maxSag_m"])
                stage_profiles.append(cat)
                if i == bottom_stage_idx:
                    lowest_clearance = cat["minClearance_m"]

        bottom_h = attach_ht(bottom_stage_idx)
        bottom_sag65 = sag65[bottom_stage_idx] if bottom_stage_idx < len(sag65) else 0.0
        if lowest_clearance is None:
            lowest_clearance = bottom_h - bottom_sag65

        ground_clearances = data.get("ground_clearances") or []
        appl_clear = table_ground_m(ground_clearances, stage_clr_bands[bottom_stage_idx], r["span_environment"])
        ground_ok = lowest_clearance >= appl_clear - 1e-6

        # Circuit-to-circuit clearance
        circuit_clearances = data.get("circuit_clearances") or []
        cc_pairs = []
        for k in range(len(height_order) - 1):
            i_up = height_order[k]
            i_down = height_order[k + 1]
            rq = cc_req(circuit_clearances, stage_clr_bands[i_up], stage_clr_bands[i_down], settings)
            req = rq["value"]
            pu = stage_profiles[i_up] if i_up < len(stage_profiles) else None
            pl = stage_profiles[i_down] if i_down < len(stage_profiles) else None

            if pu and pl and pu.get("samples") and pl.get("samples") and len(pu["samples"]) == len(pl["samples"]):
                min_vert = min([pu["samples"][q]["yCond"] - pl["samples"][q]["yCond"] for q in range(len(pu["samples"]))])
            else:
                hu = attach_ht(i_up)
                hl = attach_ht(i_down)
                su = sag65[i_up] if i_up < len(sag65) else 0.0
                sl = sag65[i_down] if i_down < len(sag65) else 0.0
                min_vert = (hu - su) - (hl - sl)

            same = same_circuit(i_up, i_down)
            ok = None if same else (min_vert >= req - 1e-6)
            cc_pairs.append({
                "from": i_up,
                "to": i_down,
                "clearance_m": min_vert,
                "required_m": None if same else req,
                "ok": ok
            })

        all_cc_ok = len(cc_pairs) == 0 or all(p["ok"] is not False for p in cc_pairs)

        # Insulators
        ins_levels = []
        dead_end = bool(is_terminal or is_section_pole)
        ins_gov = {"HH": None, "H": None}

        for i in range(n_hh + n_h):
            b = "HH" if i < n_hh else "H"
            volt = "33kV" if b == "HH" else "11kV"
            sc = stage_cond[i]
            sel_desc = ins_desc_hh if b == "HH" else ins_desc_h
            cant = cant_of(sel_desc, insulators_master)

            res = select_insulator_by_angle(
                r["angle"], sel_desc, volt, dead_end, ttie_max, stie_max,
                {"T1_kN": stage_t1[i] if i < len(stage_t1) else 0.0, "T2_kN": stage_t2[i] if i < len(stage_t2) else 0.0, "qCond": q_cond, "dia_m": dia_m(sc), "windSpan": wind_span, "cantilever_kN": cant}
            )
            lv_res = {
                "band": b, "stage": i, "insulator": res["insulator"], "tie": res["tie"], "detail": res["detail"],
                "R_kN": res["R_kN"], "R_recalc_kN": res["R_recalc_kN"], "cantilever_kN": cant or None, "note": res.get("note") or ""
            }
            ins_levels.append(lv_res)
            rk = ins_rank(res)
            g = ins_gov[b]
            if not g or rk > g["rank"] or (rk == g["rank"] and (res.get("R_kN") or 0.0) > (g["lv"].get("R_kN") or 0.0)):
                ins_gov[b] = {"rank": rk, "lv": lv_res}

        tie_hh = ins_gov["HH"]["lv"]["tie"] if ins_gov["HH"] else ""
        tie_h = ins_gov["H"]["lv"]["tie"] if ins_gov["H"] else ""
        tie = " / ".join([t for t in [tie_hh, tie_h] if t and t != "—"])

        alt_list: list[str] = []
        push_alt(unguyed_label, "unguyed", alt_list, recommended)
        if recommended_on_buckling != "—":
            push_alt(recommended_on_buckling, "guyed", alt_list, recommended)
        push_alt(strutted_label, "strutted", alt_list, recommended)

        results.append({
            "section": r["section"],
            "pole_no": r["pole_no"],
            "aft": r["aft"],
            "fore": r["fore"],
            "wind_span": wind_span,
            "weight_span": weight_span,
            "angle": r["angle"],
            "soil": r["soil"],
            "eq_span": eq_span,
            "bm_wind_cond_kNm": bm_c,
            "bm_tension_kNm": 0.0 if is_terminal else bm_t,
            "bm_long_kNm": bm_long_full,
            "bm_pole_kNm": bm_p,
            "bm_equip_kNm": bm_e,
            "pole_top_load_daN": pole_top_load,
            "terminal_long_load_daN": long_load_dan,
            "load_without_tension_daN": residual_load,
            "guy_load_daN": guy_load,
            "unguyed": unguyed_label,
            "guyed": guyed["label"] if guyed else "",
            "guy_arrangement": f"{g_cls} · α_g={int(guy_angle)}°" if guy_load > 0 else g_cls,
            "strutted": strutted_label,
            "most_economic": format_pole_label(pole_height, most_economic),
            "recommended": format_pole_label(pole_height, recommended),
            "buckling_capacity_kN": buckling_kn,
            "buckling_demand_kN": buckling_demand,
            "buckling_ok": buckling_ok,
            "buckling_check": "PASS" if buckling_ok else "FAIL",
            "rec_guy_unguy": guyed_before_buckling,
            "rec_on_buckling": recommended_on_buckling,
            "foundation": fd,
            "tie": tie,
            "insulator_levels": ins_levels,
            "sag65_m": sag65,
            "sag27_m": sag27,
            "lowest_clearance_m": lowest_clearance,
            "applicable_clearance_m": appl_clear,
            "ground_clearance_ok": ground_ok,
            "circuit_clearance_ok": all_cc_ok,
            "is_terminal": is_terminal,
            "is_section": is_section_pole,
        })

    # Phase separation check
    crossarm_spacings = data.get("crossarm_spacings") or []
    for idx, r in enumerate(results):
        next_r = results[idx + 1] if idx + 1 < len(results) else None
        has_fore = r["fore"] > 0 and next_r is not None
        sep_checks = []

        for i in range(n_hh):
            sag = r["sag65_m"][i] if i < len(r["sag65_m"]) else None
            v = 33.0
            d_req = (0.75 * math.sqrt(max(0.0, sag)) + (v * v) / 20000.0) if (sag is not None and has_fore) else None
            c_a = "6"
            c_b = "6"
            ang = sep_at_angle(min_sep(c_a, crossarm_spacings), min_sep(c_b, crossarm_spacings), r, next_r if has_fore else None, d_req)
            sep_checks.append({
                "band": "HH", "stage": i + 1, "voltage_kV": v, "sag_m": sag, "D_req_m": d_req, "D_actual_m": ang["D_eff"], **ang
            })

        for i in range(n_h):
            si = n_hh + i
            sag = r["sag65_m"][si] if si < len(r["sag65_m"]) else None
            v = 11.0
            d_req = (0.75 * math.sqrt(max(0.0, sag)) + (v * v) / 20000.0) if (sag is not None and has_fore) else None
            c_a = "10"
            c_b = "10"
            ang = sep_at_angle(min_sep(c_a, crossarm_spacings), min_sep(c_b, crossarm_spacings), r, next_r if has_fore else None, d_req)
            sep_checks.append({
                "band": "H", "stage": i + 1, "voltage_kV": v, "sag_m": sag, "D_req_m": d_req, "D_actual_m": ang["D_eff"], **ang
            })

        r["separation_checks"] = sep_checks

    return {
        "poleHeight": pole_height,
        "config": config,
        "results": results,
        "sections": list(section_spans.keys()),
        "sectionEq": section_eq,
        "sectionTen": section_ten,
        "stageVoltLabels": stage_volt_labels,
        "stageBands": stage_bands,
        "nStages": n_stages,
        "bottomBand": bottom_band,
        "tensionChecks": tension_checks,
        "calc_method": calc_method,
    }
