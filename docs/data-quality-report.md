# Phase 1 Data Quality & Audit Report

**Source File:** `data/source/LECO_Pole_Selection_Construction_Data.xlsx`  
**Dataset Version:** `LECO_Import_20261118_063829` (SHA-256: `63ae74f4b93198ee3e2cb5038f45b5972ee7857ea293c6179b0ba6a1251c9103`)  
**Audit Date:** 2026-11-18  

---

## 1. Row Counts per Sheet

| Sheet Name | Raw Excel Rows | Header Row | Imported Records | Status |
| :--- | :---: | :---: | :---: | :--- |
| **Pole Configurations** | 0 | None | 0 | **GAP**: Sheet is completely empty |
| **Conductors** | 25 | Row 3 | 22 | Imported with SI unit conversions |
| **Span-Tension Tables** | 150 | Row 3 | 147 | Imported (11 lookup tables, spans 10 m to 120 m) |
| **Insulators** | 7 | Row 3 | 4 | Imported |
| **Cross-arm Spacings** | 20 | Row 3 | 17 | Imported |
| **Equipment** | 11 | Row 3 | 8 | Imported with SI unit conversions |
| **Pole Capacities** | 47 | Row 3 | 44 | Imported with SI unit conversions |
| **Guy Wires** | 7 | Row 3 | 4 | Imported with SI unit conversions |
| **Soil Classes** | 8 | Row 3 | 5 | Imported (Classes 1–5 with min/max bearing) |
| **Ground Clearances** | 23 | Row 3 | 20 | Imported |
| **Structure Clearances** | 10 | Row 3 | 7 | Imported |
| **Circuit Clearances** | 24 | Row 3 | 21 | Imported |
| **Sample Line Input** | 16 | Row 3 | 13 | Imported (Poles 1–13, Sections 1–3) |
| **Design Parameters (Seed)**| N/A | N/A | 10 | Seeded from design specifications |
| **Total Master Records** | | | **318** | |

---

## 2. Identified Data Gaps

1. **Empty Sheet — `Pole Configurations`:**
   - The sheet contains 0 rows and no header. Recorded as a structural data gap. Conductor framing and cross-arm configuration combinations will require project owner specification.
2. **Missing Cross-arm Config Numbers:**
   - Present configuration numbers: `[1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20]`.
   - Missing numbers in sequence: **Config 7, Config 8, and Config 13**.
3. **Empty Insulator Tension MFL:**
   - All 4 insulator types (`33kV Post`, `11kV Post`, `33kV Pin`, `11kV Pin`) have NULL in the `Tension MFL kN` column. All 4 rows are flagged with `needs_confirmation = true`.
4. **Conductors without Sag-Tension Data:**
   - Conductors 12 through 22 have no associated lookup table (`LOOKUP TABLE = NULL`). Flagged with `needs_confirmation = true` and `confirmation_note = "no sag-tension data"`.

---

## 3. Monotonicity Audit of Span-Tension Tables

Every span-tension lookup table was audited across increasing span distance (`span_m`):
- **Tension (`tension_kn`)** and **Tension at 27°C (`tension_27_kn`)**: checked for monotonic behavior.
- **Sag at 15°C (`sag_15_m`)**, **Sag at 27°C (`sag_27_m`)**, and **Sag at 65°C (`sag_65_m`)**: checked for monotonic behavior.

### Results:
| Table ID | Span Range (m) | Point Count | Tension Monotonic | Sag Monotonic | Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **UQ** | 10 – 65 | 12 | True | True | Verified PASS |
| **UP** | 10 – 65 | 12 | True | True | Verified PASS |
| **UR** | 10 – 65 | 12 | True | True | Verified PASS |
| **UA-7.90** | 10 – 65 | 12 | True | True | Verified PASS |
| **UB-7.90** | 10 – 65 | 12 | True | True | Verified PASS |
| **UC-7.90** | 10 – 65 | 12 | True | True | Verified PASS |
| **UE-7.90** | 10 – 65 | 12 | True | True | Verified PASS |
| **UD-2.74** | 10 – 65 | 12 | True | True | Verified PASS |
| **UC-22.3** | 40 – 120 | 17 | True | True | Verified PASS |
| **UE-22.3** | 40 – 120 | 17 | True | True | Verified PASS |
| **UD-7.85** | 40 – 120 | 17 | True | True | Verified PASS |

*Note: All 11 tables exhibit strictly monotonic behavior. No anomalies or reversals detected.*

---

## 4. Audit of NULL and `NEEDS_VALUE` Fields

In accordance with `AGENTS.md` rules:
- No values were filled, guessed, or approximated.
- Cells containing `NEEDS_VALUE` were converted to `NULL` and flagged with `needs_confirmation = true`.

### Occurrences of `NEEDS_VALUE`:
- **Conductors Sheet:**
  - Row 15 (Code 12, SWG 1): `EVERYDAY TENSION DAN = NEEDS_VALUE` → Stored as `NULL`
  - Row 16 (Code 13, SWG 2): `EVERYDAY TENSION DAN = NEEDS_VALUE` → Stored as `NULL`
  - Row 17 (Code 14, SWG 1/0): `EVERYDAY TENSION DAN = NEEDS_VALUE` → Stored as `NULL`
  - Row 18 (Code 15, SWG 1/0): `EVERYDAY TENSION DAN = NEEDS_VALUE` → Stored as `NULL`

---

## 5. Summary of `needs_confirmation` Rows

| Table | Flagged Rows | Reasons |
| :--- | :---: | :--- |
| **Conductor** | 11 | 4 rows contain `NEEDS_VALUE`; 11 rows missing lookup table ("no sag-tension data") |
| **Insulator** | 4 | All 4 rows have empty `Tension MFL kN` |
| **GroundClearance** | 10 | Source notes explicitly state "confirm" or require project owner review |
| **StructureClearance** | 3 | Rows with notes stating "confirm" (e.g. 33kV ABC, 11kV ABC, Earth conductor) |
| **CircuitClearance** | 15 | Cross-circuit separation matrix notes requesting confirmation |
| **Total Flagged Rows** | **43** | All preserved with explicit `confirmation_note` |

---

## 6. Seeded Design Parameters

Seeded with source citations and confirmed project constraints:
1. `wind_conductor`: **575.0 N/m²** (Explicitly confirmed by project owner; do **not** use 400 N/m²).
2. `wind_pole`: **865.0 N/m²**.
3. `max_stress_pct_uts`: **40.0%**.
4. `everyday_stress_pct_uts`: **20.0%**.
5. `guy_angle_deg`: **30.0°**.
6. `top_tie_max_deg`: **10.0°**.
7. `side_tie_max_deg`: **20.0°**.
8. `soil_rotation_rad`: **0.01 rad**.
9. `embedment_ratio`: **1/6 (0.1667)**.
10. `pole_top_load_offset_m`: **0.4 m**.
