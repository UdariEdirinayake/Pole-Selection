"""Pole selection module ported from LECO Pole Selection tool.

Rules:
- is_multi_pole_class: Regex match for multi-pole (2x...)
- pick_unguyed: Select lightest unguyed pole from PoleCapacity master list
- pick_strutted_pair: PS.BAS 3230-3270 threshold rules:
    P <= 745.41 -> 200/200 S
    P <= 1349.74 -> 200/350 S
    P <= 1601.5 -> 200/500 S
    P <= 2441.83 -> 200/850 S
- pick_guyed: Select guyed pole class from PoleCapacity list
- find_capacity_row: Match pole capacity record by label/mount type
- parse_base_cap: Extract base capacity
- push_alt: Collect distinct alternatives
"""
from __future__ import annotations

import re
from typing import Any, Optional

from pole_engine.utils import num


def is_multi_pole_class(c: Any) -> bool:
    """Check if pole class is multi-pole e.g. 2x850 (original tool line 10456)."""
    if isinstance(c, dict):
        label = str(c.get("class_label") or "")
    else:
        label = str(c or "")
    return bool(re.search(r"^\s*\d+\s*[x×]", label, re.IGNORECASE))


def pick_unguyed(
    pole_height_m: float,
    load_dan: float,
    capacities: list[dict[str, Any]],
    allow_2x: bool = True,
    no_double: bool = False
) -> Optional[dict[str, Any]]:
    """Pick lightest single/double unguyed pole capable of carrying load_dan (original tool line 11055-11066).

    Loads from capacities master data, sorted by capacity_daN ASC.
    """
    if not capacities:
        return None

    h = num(pole_height_m)
    matching = []
    for c in capacities:
        ch = num(c.get("pole_height_m") or c.get("height_m"))
        mount = str(c.get("mount_type") or "").lower()
        if ch == h and mount == "unguyed":
            cap = num(c.get("capacity_daN") or c.get("capacity_dan"), 0.0)
            matching.append({
                "label": str(c.get("class_label") or ""),
                "cap": cap,
                "row": c
            })

    matching.sort(key=lambda x: x["cap"])

    permit_2x = allow_2x and not no_double
    for o in matching:
        if not permit_2x and is_multi_pole_class(o["label"]):
            continue
        if load_dan <= o["cap"]:
            return o

    return None


def pick_strutted_pair(load_dan: float) -> Optional[str]:
    """Strutted pole rule thresholds from original tool line 11076-11084 (PS.BAS 3230-3270).

    P <= 745.41 -> 200/200 S
    P <= 1349.74 -> 200/350 S
    P <= 1601.5 -> 200/500 S
    P <= 2441.83 -> 200/850 S
    """
    p = num(load_dan, 0.0) or 0.0
    if p <= 0:
        return None
    if p <= 745.41:
        return "200/200 S"
    if p <= 1349.74:
        return "200/350 S"
    if p <= 1601.5:
        return "200/500 S"
    if p <= 2441.83:
        return "200/850 S"
    return None


def pick_guyed(
    pole_height_m: float,
    residual_dan: float,
    guy_cls: str,
    capacities: list[dict[str, Any]]
) -> Optional[dict[str, Any]]:
    """Pick guyed pole class capable of carrying residual transverse load (original tool line 11320-11331)."""
    if not capacities:
        return None

    h = num(pole_height_m)
    matching = []
    for c in capacities:
        ch = num(c.get("pole_height_m") or c.get("height_m"))
        mount = str(c.get("mount_type") or "").lower()
        if ch == h and mount in ("guyed", "unguyed"):
            cap = num(c.get("capacity_daN") or c.get("capacity_dan"), 0.0)
            matching.append({
                "label": str(c.get("class_label") or ""),
                "cap": cap,
                "row": c
            })

    matching.sort(key=lambda x: x["cap"])

    for o in matching:
        if is_multi_pole_class(o["label"]):
            continue
        if residual_dan <= o["cap"]:
            base = re.sub(r"\s*U\s*$", "", o["label"]).strip()
            return {
                "label": f"{base} {guy_cls}",
                "base": base,
                "cap": o["cap"],
                "guyClass": guy_cls
            }

    if matching:
        last = matching[-1]
        base = re.sub(r"\s*U\s*$", "", last["label"]).strip()
        return {
            "label": f"{base} H",
            "base": base,
            "cap": last["cap"],
            "guyClass": "H"
        }

    return None


def find_capacity_row(
    capacities: Optional[list[dict[str, Any]]],
    pole_height_m: float,
    recommended: str
) -> Optional[dict[str, Any]]:
    """Match capacity row by pole height and recommendation string (original tool line 11101-11134)."""
    if not capacities:
        return None

    rec = str(recommended or "").strip()
    h = num(pole_height_m)
    rows = [
        c for c in capacities
        if num(c.get("pole_height_m") or c.get("height_m")) == h
    ]
    if not rows:
        return None

    # Strutted: match mount_type == 'strutted'
    if re.search(r"S\b", rec) or re.search(r"-\s*\d+/\d+", rec):
        m = re.search(r"(\d+/\d+\s*S)", rec, re.IGNORECASE)
        pair = m.group(1).replace(" ", "") if m else ""
        for r in rows:
            if str(r.get("mount_type") or "").lower() == "strutted":
                cl = str(r.get("class_label") or "").replace(" ", "")
                if pair in cl:
                    return r

    # Guyed: e.g. "11/350 M" or "350 M"
    gm = re.search(r"(\d+)\s*/\s*(\d+)\s*([LMH]|2H|\d+H)", rec, re.IGNORECASE) or re.search(r"(\d+)\s*([LMH]|2H)", rec, re.IGNORECASE)
    if gm:
        cls_name = (gm.group(2) + " " + gm.group(3)) if len(gm.groups()) >= 3 and gm.group(3) else (gm.group(1) + " " + gm.group(2))
        for r in rows:
            if str(r.get("mount_type") or "").lower() == "guyed":
                if str(r.get("class_label") or "").strip().lower() == cls_name.strip().lower():
                    return r

    # Unguyed: "850 U" or "2x850 U"
    um = re.search(r"(2x)?\s*(\d+)\s*U", rec, re.IGNORECASE)
    if um:
        lab = ((um.group(1) or "") + um.group(2) + " U").replace(" ", "").lower()
        for r in rows:
            cl = str(r.get("class_label") or "").replace(" ", "").lower()
            if cl == lab:
                return r

    return rows[0] if rows else None


def parse_base_cap(
    lab: str,
    capacities: Optional[list[dict[str, Any]]],
    pole_height_m: float
) -> Optional[dict[str, Any]]:
    """Parse base capacity from pole label (original tool line 13079-13086)."""
    m = re.search(r"(\d+)\s*/\s*(\d+)", str(lab or ""))
    if not m:
        return None
    cap_want = float(m.group(2))
    h = num(pole_height_m)
    if capacities:
        for c in capacities:
            ch = num(c.get("pole_height_m") or c.get("height_m"))
            cl = str(c.get("class_label") or "")
            cap = num(c.get("capacity_daN") or c.get("capacity_dan"), 0.0)
            if ch == h and abs(cap - cap_want) < 1.0 and not is_multi_pole_class(cl):
                return {"label": cl, "cap": cap}

    return {"label": f"{int(cap_want)} U", "cap": cap_want}


def push_alt(
    label: Optional[str],
    kind: str,
    alt_list: list[str],
    recommended: str
) -> None:
    """Collect distinct alternative pole recommendations (original tool line 13193-13199)."""
    if not label or label in ("X", "—") or label.startswith("X"):
        return
    n = re.sub(r"\s+", " ", str(label)).strip()
    rec_n = re.sub(r"\s+", " ", str(recommended)).strip()
    if n == rec_n:
        return
    if any(a.startswith(n) for a in alt_list):
        return
    alt_list.append(f"{n} ({kind})")
