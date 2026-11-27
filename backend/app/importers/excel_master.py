import os
import sys
import hashlib
import datetime
import statistics
from pathlib import Path
from typing import Any
from collections import defaultdict
import openpyxl

from app.database import SessionLocal
from app.models import (
    DatasetVersion,
    Conductor,
    SpanTensionPoint,
    PoleCapacity,
    GuyWire,
    SoilClass,
    Equipment,
    Insulator,
    CrossarmConfig,
    GroundClearance,
    StructureClearance,
    CircuitClearance,
    DesignParameter,
    SampleLinePole,
)
from app.units import (
    dan_to_kn,
    kg_to_n,
    mm_to_m,
    mm2_to_m2,
    kg_per_mm2_to_n_per_m2,
    kg_per_m_to_n_per_m,
)


def compute_file_hash(filepath: str) -> str:
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()


def clean_val(val: Any) -> Any:
    """Normalize cells: convert empty strings or 'NEEDS_VALUE' to None."""
    if val is None:
        return None
    if isinstance(val, str):
        s = val.strip()
        if not s or s.upper() == "NEEDS_VALUE":
            return None
        return s
    return val


def to_float(val: Any) -> float | None:
    v = clean_val(val)
    if v is None:
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


def to_int(val: Any) -> int | None:
    v = clean_val(val)
    if v is None:
        return None
    try:
        return int(float(v))
    except (ValueError, TypeError):
        return None


def parse_soil_bearing(raw_val: Any) -> tuple[float | None, float | None, str | None]:
    """Parse soil bearing capacity like '25-75' or 25 into min and max."""
    v = clean_val(raw_val)
    if v is None:
        return None, None, None
    s = str(v).strip()
    if "-" in s:
        parts = s.split("-")
        try:
            return float(parts[0].strip()), float(parts[1].strip()), s
        except (ValueError, IndexError):
            return None, None, s
    try:
        num = float(s)
        return num, num, s
    except ValueError:
        return None, None, s


def check_confirmation(row_values: list[Any], row_dict: dict[str, Any], notes: str | None = None) -> tuple[bool, str | None]:
    """Determine needs_confirmation flag and note based on Phase 1 rules."""
    reasons = []

    # 1. Any raw value was NEEDS_VALUE
    for val in row_values:
        if val is not None and isinstance(val, str) and "NEEDS_VALUE" in val.upper():
            reasons.append("Contains NEEDS_VALUE")
            break

    # 2. Any notes contain 'confirm'
    for val in row_values:
        if val is not None and isinstance(val, str) and "confirm" in val.lower():
            reasons.append("Row notes request confirmation")
            break

    # 3. Specific column checks (e.g. Conductors with no lookup table)
    if "lookup_table" in row_dict and row_dict.get("lookup_table") is None:
        reasons.append("no sag-tension data")

    # 4. Empty Insulator tension_mfl_kn
    if "tension_mfl_kn" in row_dict and row_dict.get("tension_mfl_kn") is None:
        reasons.append("insulator tension MFL is empty")

    if reasons:
        return True, "; ".join(reasons)
    return False, None


def analyze_span_tension_anomalies(raw_rows: list[tuple[int, list[Any]]]) -> dict[int, list[str]]:
    """Analyze Span-Tension Tables for:
    (a) equal values at neighbouring spans (when column is not globally constant),
    (b) direction changes in values/steps,
    (c) any step > 1.5x median step, or second difference anomaly (e.g. curvature drop / deceleration).
    """
    col_names = ["tension_kn", "tension_27_kn", "sag_15_m", "sag_27_m", "sag_65_m"]
    tables = defaultdict(list)
    for r_idx, r in raw_rows:
        if r[0] is not None:
            tables[r[0]].append((r_idx, r))

    row_flags: dict[int, list[str]] = defaultdict(list)

    for tid, pts in tables.items():
        pts.sort(key=lambda x: x[1][1])
        for col_idx, col_name in enumerate(col_names, start=2):
            vals = [to_float(p[1][col_idx]) for p in pts]
            spans = [to_float(p[1][1]) for p in pts]
            r_indices = [p[0] for p in pts]

            if any(v is None for v in vals):
                continue

            # Check if entire column is globally constant (e.g. design tension across all spans)
            is_all_constant = all(abs(v - vals[0]) < 1e-9 for v in vals)
            if not is_all_constant:
                # (a) Equal values at neighbouring spans
                for i in range(1, len(vals)):
                    if abs(vals[i] - vals[i-1]) < 1e-9:
                        row_flags[r_indices[i]].append(f"{col_name}: equal value to neighbouring span {spans[i-1]}m ({vals[i]})")
                        row_flags[r_indices[i-1]].append(f"{col_name}: equal value to neighbouring span {spans[i]}m ({vals[i]})")

            steps = [round(vals[i] - vals[i-1], 6) for i in range(1, len(vals))]
            abs_steps = [abs(s) for s in steps if abs(s) > 1e-9]
            med_step = statistics.median(abs_steps) if abs_steps else 0

            # (b) Direction changes
            for i in range(1, len(steps)):
                if (steps[i] > 1e-9 and steps[i-1] < -1e-9) or (steps[i] < -1e-9 and steps[i-1] > 1e-9):
                    row_flags[r_indices[i+1]].append(f"{col_name}: direction change (step {steps[i-1]} -> {steps[i]})")

            # (c) Step > 1.5x median step or second difference anomaly
            for i, s in enumerate(steps):
                span_curr = spans[i+1]
                r_idx_curr = r_indices[i+1]
                if med_step > 0 and abs(s) > 1.5 * med_step:
                    row_flags[r_idx_curr].append(f"{col_name}: step {s:.4f} > 1.5x median ({med_step:.4f})")

                # Second difference anomaly (in sag, steps must grow smoothly with d2 >= 0)
                if i > 0 and "sag" in col_name:
                    d2 = steps[i] - steps[i-1]
                    if d2 < -0.03:
                        row_flags[r_idx_curr].append(f"{col_name}: second difference drop (d2={d2:.4f}m)")

    return row_flags


def import_excel_master(filepath: str) -> DatasetVersion:
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Source file not found at: {filepath}")

    file_hash = compute_file_hash(filepath)
    filename = Path(filepath).name
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    version_name = f"LECO_Import_{now_utc.strftime('%Y%m%d_%H%M%S')}"

    wb = openpyxl.load_workbook(filepath, data_only=True)
    db = SessionLocal()

    try:
        # Create new version (Idempotent: every import creates a distinct dataset_version without modifying or duplicating previous versions)
        dataset_version = DatasetVersion(
            name=version_name,
            imported_at=now_utc,
            source_file=filename,
            file_hash=file_hash,
        )
        db.add(dataset_version)
        db.flush()
        version_id = dataset_version.id

        # 1. Seed Design Parameters
        design_params = [
            ("wind_conductor", 575.0, "N/m²", "Project owner confirmation (do not use 400 N/m²)", "confirmed", "Wind pressure on conductors confirmed by project owner"),
            ("wind_pole", 865.0, "N/m²", "Standard design specification", "standard", "Wind pressure on pole surface"),
            ("max_stress_pct_uts", 40.0, "%", "Standard design specification", "standard", "Maximum allowable working tension as % UTS"),
            ("everyday_stress_pct_uts", 20.0, "%", "Standard design specification", "standard", "Everyday tension as % UTS"),
            ("guy_angle_deg", 30.0, "deg", "Standard design specification", "standard", "Standard stay guy wire installation angle"),
            ("top_tie_max_deg", 10.0, "deg", "Standard design specification", "standard", "Maximum line deviation angle for top tie pin insulator"),
            ("side_tie_max_deg", 20.0, "deg", "Standard design specification", "standard", "Maximum line deviation angle for side tie pin insulator"),
            ("soil_rotation_rad", 0.01, "rad", "Standard foundation design criteria", "standard", "Allowable ground-line soil rotation under working load"),
            ("embedment_ratio", 1.0 / 6.0, "ratio", "Standard foundation design criteria", "standard", "Standard pole setting depth ratio of total pole length"),
            ("pole_top_load_offset_m", 0.4, "m", "Standard structural specification", "standard", "Offset distance from pole tip to resultant conductor load"),
        ]
        for idx, (p_name, val, unit, src, stat, desc) in enumerate(design_params, start=1):
            dp = DesignParameter(
                dataset_version_id=version_id,
                source_sheet="Design Parameters",
                source_row=idx,
                parameter_name=p_name,
                value=val,
                unit=unit,
                source=src,
                status=stat,
                description=desc,
                needs_confirmation=False,
                confirmation_note=None,
            )
            db.add(dp)

        # 2. Conductors (Header row 3, data starts row 4)
        if "Conductors" in wb.sheetnames:
            ws = wb["Conductors"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                code = to_int(r[0])
                desc = clean_val(r[1])
                dia_mm = to_float(r[2])
                area_mm2 = to_float(r[3])
                edt_dan = to_float(r[4])
                lookup = clean_val(r[5])
                wt_kg_m = to_float(r[6])
                mod_kg_mm2 = to_float(r[7])
                break_kg = to_float(r[8])
                thermal_coeff = to_float(r[9])
                uts_dan = to_float(r[10])
                notes = clean_val(r[11])
                cond_type = clean_val(r[12])

                row_dict = {"lookup_table": lookup}
                needs_conf, conf_note = check_confirmation(list(r), row_dict)

                cond = Conductor(
                    dataset_version_id=version_id,
                    source_sheet="Conductors",
                    source_row=r_idx,
                    code=code,
                    description=desc,
                    lookup_table=lookup,
                    conductor_type=cond_type,
                    notes=notes,
                    diameter_mm=dia_mm,
                    stress_area_mm2=area_mm2,
                    everyday_tension_dan=edt_dan,
                    weight_kg_per_m=wt_kg_m,
                    modulus_elasticity_kg_per_mm2=mod_kg_mm2,
                    breaking_load_kg=break_kg,
                    thermal_expansion_coeff_per_c=thermal_coeff,
                    ultimate_tensile_strength_dan=uts_dan,
                    # SI conversions
                    diameter_m=mm_to_m(dia_mm),
                    stress_area_m2=mm2_to_m2(area_mm2),
                    everyday_tension_kn=dan_to_kn(edt_dan),
                    weight_n_per_m=kg_per_m_to_n_per_m(wt_kg_m),
                    modulus_elasticity_n_per_m2=kg_per_mm2_to_n_per_m2(mod_kg_mm2),
                    breaking_load_n=kg_to_n(break_kg),
                    ultimate_tensile_strength_kn=dan_to_kn(uts_dan),
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(cond)

        # 3. Span-Tension Tables (Header row 3, data starts row 4)
        if "Span-Tension Tables" in wb.sheetnames:
            ws = wb["Span-Tension Tables"]
            rows = list(ws.iter_rows(values_only=True))
            raw_st_rows = [(r_idx, list(r)) for r_idx, r in enumerate(rows[3:], start=4) if any(c is not None for c in r)]
            st_anomalies = analyze_span_tension_anomalies(raw_st_rows)

            for r_idx, r in raw_st_rows:
                tid = clean_val(r[0])
                span_m = to_float(r[1])
                t_kn = to_float(r[2])
                t27_kn = to_float(r[3])
                s15 = to_float(r[4])
                s27 = to_float(r[5])
                s65 = to_float(r[6])

                needs_conf, conf_note = check_confirmation(list(r), {})
                if r_idx in st_anomalies:
                    needs_conf = True
                    anomaly_str = "; ".join(st_anomalies[r_idx])
                    conf_note = f"{conf_note}; {anomaly_str}" if conf_note else anomaly_str

                st = SpanTensionPoint(
                    dataset_version_id=version_id,
                    source_sheet="Span-Tension Tables",
                    source_row=r_idx,
                    table_id=tid,
                    span_m=span_m,
                    tension_kn=t_kn,
                    tension_27_kn=t27_kn,
                    sag_15_m=s15,
                    sag_27_m=s27,
                    sag_65_m=s65,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(st)

        # 4. Insulators (Header row 3, data starts row 4)
        if "Insulators" in wb.sheetnames:
            ws = wb["Insulators"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                desc = clean_val(r[0])
                v_kv = to_float(r[1])
                h_m = to_float(r[2])
                cant_kn = to_float(r[3])
                mfl_kn = to_float(r[4])
                notes = clean_val(r[5])

                row_dict = {"tension_mfl_kn": mfl_kn}
                needs_conf, conf_note = check_confirmation(list(r), row_dict)

                ins = Insulator(
                    dataset_version_id=version_id,
                    source_sheet="Insulators",
                    source_row=r_idx,
                    description=desc,
                    voltage_level_kv=v_kv,
                    nominal_height_m=h_m,
                    cantilever_strength_kn=cant_kn,
                    tension_mfl_kn=mfl_kn,
                    notes=notes,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(ins)

        # 5. Cross-arm Spacings (Header row 3, data starts row 4)
        if "Cross-arm Spacings" in wb.sheetnames:
            ws = wb["Cross-arm Spacings"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                c_no = to_int(r[0])
                desc = clean_val(r[1])
                l_pin = to_float(r[2])
                m_pin = to_float(r[3])
                sep_m = to_float(r[4])

                needs_conf, conf_note = check_confirmation(list(r), {})

                ca = CrossarmConfig(
                    dataset_version_id=version_id,
                    source_sheet="Cross-arm Spacings",
                    source_row=r_idx,
                    config_no=c_no,
                    description=desc,
                    left_pin_to_middle_m=l_pin,
                    middle_pin_to_right_m=m_pin,
                    minimum_separation_m=sep_m,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(ca)

        # 6. Equipment (Header row 3, data starts row 4)
        if "Equipment" in wb.sheetnames:
            ws = wb["Equipment"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                eq_name = clean_val(r[0])
                w_m = to_float(r[1])
                h_m = to_float(r[2])
                d_m = to_float(r[3])
                delh_m = to_float(r[4])
                wt_kg = to_float(r[5])
                area_m2 = to_float(r[6])
                tfh_11 = to_float(r[7])
                tfh_13 = to_float(r[8])

                needs_conf, conf_note = check_confirmation(list(r), {})

                eq = Equipment(
                    dataset_version_id=version_id,
                    source_sheet="Equipment",
                    source_row=r_idx,
                    equipment_name=eq_name,
                    width_m=w_m,
                    height_m=h_m,
                    depth_m=d_m,
                    delh_m=delh_m,
                    weight_kg=wt_kg,
                    weight_n=kg_to_n(wt_kg),
                    area_m2=area_m2,
                    tfh_11m_pole_m=tfh_11,
                    tfh_13m_pole_m=tfh_13,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(eq)

        # 7. Pole Capacities (Header row 3, data starts row 4)
        if "Pole Capacities" in wb.sheetnames:
            ws = wb["Pole Capacities"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                h_m = to_float(r[0])
                m_type = clean_val(r[1])
                c_label = clean_val(r[2])
                cap_dan = to_float(r[3])
                cost_rank = to_int(r[4])
                avg_b = to_float(r[5])
                buckle = to_float(r[6])
                gl_b = to_float(r[7])
                wt_kg = to_float(r[8])
                footprint = clean_val(r[9])

                needs_conf, conf_note = check_confirmation(list(r), {})

                long_b = 0.388 if (h_m or 11.0) == 11.0 else (0.320 if (h_m or 9.0) == 9.0 else 0.450)
                if "2x" in (c_label or "").lower():
                    long_b = round(long_b * 2, 3)

                pc = PoleCapacity(
                    dataset_version_id=version_id,
                    source_sheet="Pole Capacities",
                    source_row=r_idx,
                    height_m=h_m,
                    mount_type=m_type,
                    class_label=c_label,
                    capacity_dan=cap_dan,
                    capacity_kn=dan_to_kn(cap_dan),
                    cost_rank=cost_rank,
                    avg_breadth_m=avg_b,
                    long_breadth_m=long_b,
                    critical_buckling_kn=buckle,
                    below_gl_breadth_m=gl_b,
                    weight_kg=wt_kg,
                    weight_n=kg_to_n(wt_kg),
                    footprint_mm=footprint,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(pc)

        # 8. Guy Wires (Header row 3, data starts row 4)
        if "Guy Wires" in wb.sheetnames:
            ws = wb["Guy Wires"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                code = clean_val(r[0])
                desc = clean_val(r[1])
                wl_dan = to_float(r[2])
                ang_deg = to_float(r[3])
                notes = clean_val(r[4])

                needs_conf, conf_note = check_confirmation(list(r), {})

                gw = GuyWire(
                    dataset_version_id=version_id,
                    source_sheet="Guy Wires",
                    source_row=r_idx,
                    code=code,
                    description=desc,
                    working_load_dan=wl_dan,
                    working_load_kn=dan_to_kn(wl_dan),
                    angle_deg=ang_deg,
                    notes=notes,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(gw)

        # 9. Soil Classes (Header row 3, data starts row 4)
        if "Soil Classes" in wb.sheetnames:
            ws = wb["Soil Classes"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                s_num = to_int(r[0])
                desc = clean_val(r[1])
                b_min, b_max, b_raw = parse_soil_bearing(r[2])
                sub_kn = to_float(r[3])

                needs_conf, conf_note = check_confirmation(list(r), {})

                sc = SoilClass(
                    dataset_version_id=version_id,
                    source_sheet="Soil Classes",
                    source_row=r_idx,
                    soil_class_num=s_num,
                    description=desc,
                    bearing_raw=b_raw,
                    bearing_min_kn_per_m2=b_min,
                    bearing_max_kn_per_m2=b_max,
                    subgrade_kn_per_m3=sub_kn,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(sc)

        # 10. Ground Clearances (Header row 3, data starts row 4)
        if "Ground Clearances" in wb.sheetnames:
            ws = wb["Ground Clearances"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                v_band = clean_val(r[0])
                env = clean_val(r[1])
                min_clr = to_float(r[2])
                notes = clean_val(r[3])

                needs_conf, conf_note = check_confirmation(list(r), {})

                gc = GroundClearance(
                    dataset_version_id=version_id,
                    source_sheet="Ground Clearances",
                    source_row=r_idx,
                    voltage_band=v_band,
                    environment=env,
                    min_clearance_m=min_clr,
                    notes=notes,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(gc)

        # 11. Structure Clearances (Header row 3, data starts row 4)
        if "Structure Clearances" in wb.sheetnames:
            ws = wb["Structure Clearances"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                v_band = clean_val(r[0])
                desc = clean_val(r[1])
                min_clr = to_float(r[2])
                notes = clean_val(r[3])

                needs_conf, conf_note = check_confirmation(list(r), {})

                strc = StructureClearance(
                    dataset_version_id=version_id,
                    source_sheet="Structure Clearances",
                    source_row=r_idx,
                    voltage_band=v_band,
                    description=desc,
                    min_clearance_m=min_clr,
                    notes=notes,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(strc)

        # 12. Circuit Clearances (Header row 3, data starts row 4)
        if "Circuit Clearances" in wb.sheetnames:
            ws = wb["Circuit Clearances"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                up_band = clean_val(r[0])
                low_band = clean_val(r[1])
                min_v = to_float(r[2])
                notes = clean_val(r[3])

                needs_conf, conf_note = check_confirmation(list(r), {})

                cc = CircuitClearance(
                    dataset_version_id=version_id,
                    source_sheet="Circuit Clearances",
                    source_row=r_idx,
                    upper_band=up_band,
                    lower_band=low_band,
                    min_vertical_m=min_v,
                    notes=notes,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(cc)

        # 13. Sample Line Input (Header row 3, data starts row 4)
        if "Sample Line Input" in wb.sheetnames:
            ws = wb["Sample Line Input"]
            rows = list(ws.iter_rows(values_only=True))
            for r_idx, r in enumerate(rows[3:], start=4):
                if not any(c is not None for c in r):
                    continue
                sec = to_int(r[0])
                p_no = to_int(r[1])
                aft = to_float(r[2])
                fore = to_float(r[3])
                ang = to_float(r[4])
                s_class = to_int(r[5])
                eq = clean_val(r[6])
                span_env = clean_val(r[7])

                needs_conf, conf_note = check_confirmation(list(r), {})

                slp = SampleLinePole(
                    dataset_version_id=version_id,
                    source_sheet="Sample Line Input",
                    source_row=r_idx,
                    section=sec,
                    pole_no=p_no,
                    aft_span_m=aft,
                    fore_span_m=fore,
                    angle_deg=ang,
                    soil_class_num=s_class,
                    equipment=eq,
                    span_environment=span_env,
                    needs_confirmation=needs_conf,
                    confirmation_note=conf_note,
                )
                db.add(slp)

        db.commit()
        print(f"Successfully imported dataset version: {dataset_version.name} (id={dataset_version.id}) from {filename}")
        return dataset_version
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m app.importers.excel_master <excel_file_path>")
        sys.exit(1)
    target_file = sys.argv[1]
    import_excel_master(target_file)
