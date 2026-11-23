"""Circuits, spur, earth, and configuration normalization module ported from LECO Pole Selection tool.

Functions:
- n_cond: Calculate conductor count for a voltage band
- is_lv_abc_conductor: Check if conductor is LV ABC bundle
- circuit_band_label: Label for band ('33kV', '11kV', 'LV', 'Earth')
- clearance_band_label: Label with ABC distinction
- earth_heights_of: Extract earth attachment heights list
- earth_ns_of: Extract earth conductor counts list
- parse_levels: Hierarchical level parsing
- identify_circuits: Group levels into physical circuits
- stage_band: Determine band for stage index
- bottom_most_band: Determine bottom-most band on line
- normalize_config_row: Sync band-specific and legacy heights/n_per_level
- hvabc_flags_for_list: Determine HVABC flag per level
- hvabc_level_flags: Determine HVABC flags dictionary
"""
from __future__ import annotations

import re
from typing import Any, Optional

from pole_engine.utils import num


def n_cond(config: dict[str, Any], band: str) -> int:
    """Count conductors on pole config for a voltage band (original tool line 10438-10445)."""
    explicit = num(config.get(f"n_cond_{band}"))
    if explicit is not None:
        return int(explicit)
    band_key = "HH" if band == "HH" else ("H" if band == "H" else "L")
    levels = num(config.get(f"levels_{band_key}"), 0.0) or 0.0
    if not levels:
        return 0
    if band == "L":
        return int(levels)
    return 3 if levels == 1 else int(levels * 2)


def is_lv_abc_conductor(band: str, cond: Optional[dict[str, Any]]) -> bool:
    """Check if conductor is LV ABC bundle (original tool line 10587-10589)."""
    if band != "L" or not cond:
        return False
    desc = str(cond.get("description") or cond.get("code") or "")
    return bool(re.search(r"bundle|abc|aerial", desc, re.IGNORECASE))


def circuit_band_label(band: str) -> str:
    """Display label for voltage band (original tool line 10785-10790)."""
    if band == "HH":
        return "33kV"
    if band == "H":
        return "11kV"
    if band == "E":
        return "Earth"
    return "LV"


def clearance_band_label(band: str, is_abc: bool = False) -> str:
    """Clearance band label used by clearance tables (original tool line 14409-14413)."""
    if band == "HH":
        return "33kV ABC" if is_abc else "33kV"
    if band == "H":
        return "11kV ABC" if is_abc else "11kV"
    return "LV"


def split_semi_list(s: Any) -> list[str]:
    """Split semicolon-delimited string (original tool line 14416-14418)."""
    if s is None:
        return []
    return [x.strip() for x in str(s).split(";") if x.strip() != ""]


def join_semi_list(arr: list[Any]) -> str:
    """Join list with semicolons (original tool line 14419-14421)."""
    return ";".join([str(x).strip() for x in arr if str(x).strip() != ""])


def earth_heights_of(config: Optional[dict[str, Any]]) -> list[float]:
    """Earth conductor heights in meters (original tool line 11490-11492)."""
    if not config:
        return []
    raw = str(config.get("height_E_m") or "")
    out = []
    for x in raw.split(";"):
        n = num(x.strip())
        if n is not None and n > 0:
            out.append(n)
    return out


def earth_ns_of(config: Optional[dict[str, Any]]) -> list[int]:
    """Earth conductor count per earth level (original tool line 11493-11495)."""
    if not config:
        return []
    raw = str(config.get("n_E") or "")
    out = []
    for x in raw.split(";"):
        n = num(x.strip())
        out.append(int(n) if (n is not None and n > 0) else 1)
    return out


def hvabc_flags_for_list(lst: list[Any]) -> list[bool]:
    """Determine HVABC flags from conductor count pattern per level (original tool line 14381-14394)."""
    ns = []
    for x in (lst or []):
        t = str(x if x is not None else "").strip()
        n = num(t)
        ns.append(str(int(n)) if n is not None else t)

    flags = []
    for i, n in enumerate(ns):
        if n != "1":
            flags.append(False)
            continue
        nx = ns[i + 1:]
        if not nx or nx[0] != "2":
            flags.append(True)
            continue
        if len(nx) >= 2 and (nx[1] == "4" or (nx[1] == "2" and len(nx) >= 3 and nx[2] == "2")):
            flags.append(True)
            continue
        flags.append(False)  # 1;2 bare triangle
    return flags


def hvabc_level_flags(cfg: Optional[dict[str, Any]]) -> dict[str, list[bool]]:
    """Per-level HVABC flags for 33kV and 11kV (original tool line 14396-14403)."""
    if not cfg:
        return {"HH": [], "H": []}
    normalize_config_row(cfg)
    return {
        "HH": hvabc_flags_for_list(split_semi_list(cfg.get("n_per_level_33kV"))),
        "H": hvabc_flags_for_list(split_semi_list(cfg.get("n_per_level_11kV")))
    }


def normalize_config_row(cfg: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    """Ensure config has both band fields and joined heights_m / n_per_level (original tool line 14423-14466)."""
    if not cfg or not isinstance(cfg, dict):
        return cfg

    n_hh = int(num(cfg.get("levels_HH"), 0.0) or 0.0)
    n_h = int(num(cfg.get("levels_H"), 0.0) or 0.0)
    n_l = int(num(cfg.get("levels_L"), 0.0) or 0.0)

    band_keys = ["heights_33kV_m", "n_per_level_33kV", "heights_11kV_m", "n_per_level_11kV", "heights_LV_m", "n_per_level_LV"]
    has_band = any(cfg.get(k) is not None and str(cfg.get(k)).strip() != "" for k in band_keys)
    has_legacy = (cfg.get("heights_m") is not None and str(cfg.get("heights_m")).strip() != "") or \
                 (cfg.get("n_per_level") is not None and str(cfg.get("n_per_level")).strip() != "")

    if has_band:
        h_hh = split_semi_list(cfg.get("heights_33kV_m"))
        n_33 = split_semi_list(cfg.get("n_per_level_33kV"))
        h_11 = split_semi_list(cfg.get("heights_11kV_m"))
        n_11 = split_semi_list(cfg.get("n_per_level_11kV"))
        h_lv = split_semi_list(cfg.get("heights_LV_m"))
        n_lv = split_semi_list(cfg.get("n_per_level_LV"))
        cfg["heights_m"] = join_semi_list(h_hh + h_11 + h_lv)
        cfg["n_per_level"] = join_semi_list(n_33 + n_11 + n_lv)
    elif has_legacy:
        hs = split_semi_list(cfg.get("heights_m"))
        ns = split_semi_list(cfg.get("n_per_level"))
        i = 0
        cfg["heights_33kV_m"] = join_semi_list(hs[i:i + n_hh])
        cfg["n_per_level_33kV"] = join_semi_list(ns[i:i + n_hh])
        i += n_hh
        cfg["heights_11kV_m"] = join_semi_list(hs[i:i + n_h])
        cfg["n_per_level_11kV"] = join_semi_list(ns[i:i + n_h])
        i += n_h
        cfg["heights_LV_m"] = join_semi_list(hs[i:i + n_l])
        cfg["n_per_level_LV"] = join_semi_list(ns[i:i + n_l])
    return cfg


def parse_levels(config: dict[str, Any]) -> dict[str, Any]:
    """Parse levels and attachment heights from pole configuration.

    Always computes attachment heights using standard engineering formulas:
      H_HV = pole_height * 5/6 - 0.2 (e.g. ~8.97 m for 11 m pole)
      H_LV = pole_height * 5/6 - 1.4 (e.g. ~7.77 m for 11 m pole)
    rather than using static config data.
    """
    normalize_config_row(config)
    n_hh = int(num(config.get("levels_HH"), 0.0) or 0.0)
    n_h = int(num(config.get("levels_H"), 0.0) or 0.0)
    n_l = int(num(config.get("levels_L"), 0.0) or 0.0)

    pole_height = num(config.get("pole_height_m"), 11.0) or 11.0
    h_hv = round(pole_height * 5.0 / 6.0 - 0.2, 2)
    h_lv = round(pole_height * 5.0 / 6.0 - 1.4, 2)

    heights = []
    for _ in range(n_hh):
        heights.append(h_hv)
    for _ in range(n_h):
        heights.append(h_hv)
    for _ in range(n_l):
        heights.append(h_lv)

    if not heights and (n_hh + n_h + n_l == 0):
        # Fallback if no level counts specified
        cfg_heights = [float(x) for x in split_semi_list(config.get("heights_m")) if num(x) is not None]
        if cfg_heights:
            heights = [h_hv if i == 0 else h_lv for i in range(len(cfg_heights))]
        else:
            heights = [h_hv, h_lv]

    ns = [float(x) for x in split_semi_list(config.get("n_per_level")) if num(x) is not None]
    while len(ns) < len(heights):
        idx = len(ns)
        if idx < n_hh or idx < n_hh + n_h:
            ns.append(3.0)
        else:
            ns.append(1.0)

    h_e = earth_heights_of(config)
    n_e_arr = earth_ns_of(config)
    heights = heights[:n_hh + n_h + n_l] if (n_hh + n_h + n_l > 0) else heights
    ns = ns[:len(heights)]

    for k, h in enumerate(h_e):
        heights.append(h)
        ns.append(n_e_arr[k] if k < len(n_e_arr) else 1.0)

    return {
        "nHH": n_hh,
        "nH": n_h,
        "nL": n_l + len(h_e),
        "nLV": n_l,
        "nE": len(h_e),
        "heights": heights,
        "ns": ns,
        "guyH": num(config.get("guy_h_m"), 8.4) or 8.4,
        "tguyH": num(config.get("tguy_h_m"), 8.4) or 8.4
    }


def identify_circuits(config: dict[str, Any]) -> dict[str, Any]:
    """Identify individual circuits from pole configuration N(i) pattern (original tool line 10815-10901)."""
    normalize_config_row(config)
    n_hh = int(num(config.get("levels_HH"), 0.0) or 0.0)
    n_h = int(num(config.get("levels_H"), 0.0) or 0.0)
    n_l = int(num(config.get("levels_L"), 0.0) or 0.0)

    ns = [int(num(s, 0.0) or 0.0) for s in split_semi_list(config.get("n_per_level"))]
    while len(ns) < n_hh + n_h + n_l:
        ns.append(0)
    ns = ns[:n_hh + n_h + n_l]

    circuits = []
    level_to_circuit_idx = {}
    li = 0

    def group_hv(band: str, count: int, start_li: int) -> None:
        levels = []
        for i in range(count):
            levels.append({"idx": start_li + i, "n": ns[start_li + i] if start_li + i < len(ns) else 0})
        pattern = ";".join([str(l["n"]) for l in levels])

        # Double vertical 2;2;2 -> Left & Right circuits
        if count == 3 and pattern == "2;2;2":
            v_name = "33 kV" if band == "HH" else "11 kV"
            c_l = {"band": band, "label": f"{v_name} Circuit L (vertical)", "levelIndices": [l["idx"] for l in levels], "nConductors": 3, "side": "L"}
            c_r = {"band": band, "label": f"{v_name} Circuit R (vertical)", "levelIndices": [l["idx"] for l in levels], "nConductors": 3, "side": "R"}
            i_l = len(circuits)
            circuits.append(c_l)
            circuits.append(c_r)
            for l in levels:
                level_to_circuit_idx[l["idx"]] = i_l
            return

        # 1;2 equilateral triangle -> one circuit
        if count == 2 and pattern == "1;2":
            v_name = "33 kV" if band == "HH" else "11 kV"
            c = {"band": band, "label": f"{v_name} Circuit 1", "levelIndices": [l["idx"] for l in levels], "nConductors": 3}
            ci = len(circuits)
            circuits.append(c)
            for l in levels:
                level_to_circuit_idx[l["idx"]] = ci
            return

        # Each level is its own circuit
        for j, l in enumerate(levels):
            v_name = "33 kV" if band == "HH" else "11 kV"
            c = {
                "band": band,
                "label": f"{v_name} Circuit/Stage {j + 1}",
                "levelIndices": [l["idx"]],
                "nConductors": l["n"] or 3
            }
            ci = len(circuits)
            circuits.append(c)
            level_to_circuit_idx[l["idx"]] = ci

    if n_hh > 0:
        group_hv("HH", n_hh, li)
        li += n_hh
    if n_h > 0:
        group_hv("H", n_h, li)
        li += n_h

    # LV
    if n_l > 0:
        lv_levels = []
        for i in range(n_l):
            lv_levels.append({"idx": li + i, "n": ns[li + i] if li + i < len(ns) else 0})
        all_ones = all(l["n"] == 1 for l in lv_levels)
        all_twos = all(l["n"] == 2 for l in lv_levels)

        if n_l == 4 and all_twos:
            c_l = {"band": "L", "label": "LV Bare Circuit L", "levelIndices": [l["idx"] for l in lv_levels], "nConductors": 4, "side": "L"}
            c_r = {"band": "L", "label": "LV Bare Circuit R", "levelIndices": [l["idx"] for l in lv_levels], "nConductors": 4, "side": "R"}
            i_l = len(circuits)
            circuits.append(c_l)
            circuits.append(c_r)
            for l in lv_levels:
                level_to_circuit_idx[l["idx"]] = i_l
        elif n_l == 4 and all_ones:
            c = {"band": "L", "label": "LV Bare Circuit", "levelIndices": [l["idx"] for l in lv_levels], "nConductors": 4}
            ci = len(circuits)
            circuits.append(c)
            for l in lv_levels:
                level_to_circuit_idx[l["idx"]] = ci
        elif n_l == 1:
            c = {"band": "L", "label": "LV Bundle Circuit", "levelIndices": [lv_levels[0]["idx"]], "nConductors": lv_levels[0]["n"] or 1}
            ci = len(circuits)
            circuits.append(c)
            level_to_circuit_idx[lv_levels[0]["idx"]] = ci
        else:
            for j, l in enumerate(lv_levels):
                c = {"band": "L", "label": f"LV Circuit/Stage {j + 1}", "levelIndices": [l["idx"]], "nConductors": l["n"] or 1}
                ci = len(circuits)
                circuits.append(c)
                level_to_circuit_idx[l["idx"]] = ci

    # Earth levels
    h_e = earth_heights_of(config)
    n_e = earth_ns_of(config)
    for k, h in enumerate(h_e):
        idx = n_hh + n_h + n_l + k
        c = {
            "band": "E",
            "label": f"Earth {k + 1}" if len(h_e) > 1 else "Earth",
            "levelIndices": [idx],
            "nConductors": n_e[k] if k < len(n_e) else 1,
            "earth": True
        }
        ci = len(circuits)
        circuits.append(c)
        level_to_circuit_idx[idx] = ci

    return {"circuits": circuits, "levelToCircuitIdx": level_to_circuit_idx}


def stage_band(i: int, n_hh: int, n_h: int, n_l: int) -> str:
    """Stage index to band code (original tool line 10903-10907)."""
    if i < n_hh:
        return "HH"
    if i < n_hh + n_h:
        return "H"
    return "L"


def bottom_most_band(n_hh: int, n_h: int, n_l: int) -> str:
    """Bottom-most band on pole (original tool line 10908-10913)."""
    if n_l > 0:
        return "LV"
    if n_h > 0:
        return "11kV"
    if n_hh > 0:
        return "33kV"
    return "LV"
