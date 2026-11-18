# Phase 1 Data Quality & Audit Report

**Source File:** `data/source/LECO_Pole_Selection_Construction_Data.xlsx`  
**Latest Dataset Version:** `LECO_Import_20261118_065626` (SHA-256: `63ae74f4b93198ee3e2cb5038f45b5972ee7857ea293c6179b0ba6a1251c9103`)  
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

## 3. Comprehensive Span-Tension Monotonicity & Step Audit

For every span-tension table and every column (`tension_kn`, `tension_27_kn`, `sag_15_m`, `sag_27_m`, `sag_65_m`), the importer strictly checks:
- **(a) Equal values at neighbouring spans:** Equal values between adjacent spans (excluding columns intentionally designed globally constant across all spans).
- **(b) Direction changes:** Any reversal or unexpected inflection in curve progression.
- **(c) Step > 1.5x median step & Second difference anomalies:** Steps exceeding 1.5x the table's median step, or parabolic sag curvature drops ($d^2 < -0.03\text{ m}$).

> **Rule:** No values are changed or smoothed. Every affected row is marked with `needs_confirmation = true` and a detailed explanatory note.

### Detailed Anomaly Findings:

#### 1. Table `UQ` (7 flagged rows)
- **Span 15 m (Row 5):** `tension_kn` step $0.2390\text{ kN} > 1.5\times\text{median}$ ($0.1510\text{ kN}$).
- **Span 20 m (Row 6):** `tension_kn` step $0.2390\text{ kN} > 1.5\times\text{median}$ ($0.1510\text{ kN}$).
- **Span 45 m (Row 11):** `sag_15_m` second difference drop ($d^2 = -0.0500\text{ m}$). The sag step abruptly decelerates from $0.20\text{ m}$ to $0.15\text{ m}$ before jumping again.
- **Span 50 m (Row 12):** `sag_15_m` step $0.3200\text{ m} > 1.5\times\text{median}$ ($0.1800\text{ m}$).
- **Span 55 m (Row 13):** `sag_15_m` second difference drop ($d^2 = -0.0500\text{ m}$).
- **Span 60 m (Row 14):** `sag_15_m` step $0.2900\text{ m} > 1.5\times\text{median}$; `sag_27_m` step $0.2800\text{ m} > 1.5\times\text{median}$.
- **Span 65 m (Row 15):** `sag_15_m` step $1.0200\text{ m} > 1.5\times\text{median}$ ($0.1800\text{ m}$); sag jumps from $1.98\text{ m}$ directly to $3.00\text{ m}$! Also `sag_27_m` step $0.30\text{ m} > 1.5\times$ and `sag_65_m` step $0.32\text{ m} > 1.5\times$.

#### 2. Table `UD-2.74` (7 flagged rows)
- **Span 15 m (Row 89):** `tension_kn` step $-0.1820\text{ kN} > 1.5\times\text{median}$ ($0.0670\text{ kN}$).
- **Span 20 m (Row 90):** `tension_kn` step $-0.1810\text{ kN} > 1.5\times\text{median}$ ($0.0670\text{ kN}$).
- **Span 25 m (Row 91):** `tension_kn` step $-0.1540\text{ kN} > 1.5\times\text{median}$ ($0.0670\text{ kN}$).
- **Span 30 m (Row 92):** `tension_kn` step $-0.1190\text{ kN} > 1.5\times\text{median}$ ($0.0670\text{ kN}$).
- **Span 55 m (Row 97):** `sag_65_m` equal to neighbouring span 60 m ($1.42\text{ m}$).
- **Span 60 m (Row 98):** `sag_65_m` equal to neighbouring span 55 m ($1.42\text{ m}$); zero sag increase between 55 m and 60 m ($d^2 = -0.2000\text{ m}$). Also `sag_15_m` and `sag_27_m` steps $> 1.5\times\text{median}$.
- **Span 65 m (Row 99):** `sag_65_m` step jumps $0.4700\text{ m} > 1.5\times\text{median}$ ($0.1500\text{ m}$).

#### 3. Table `UP` (4 flagged rows)
- **Span 15 m, 20 m:** initial tension drop steps $> 1.5\times\text{median}$ ($0.1610\text{ kN}$).
- **Span 60 m, 65 m:** terminal sag steps $> 1.5\times\text{median}$ for `sag_15_m`, `sag_27_m`, and `sag_65_m`.

#### 4. Table `UR` (4 flagged rows)
- **Span 15 m, 20 m:** initial tension steps $> 1.5\times\text{median}$.
- **Span 60 m, 65 m:** terminal sag steps $> 1.5\times\text{median}$.

#### 5. Tables `UA-7.90`, `UB-7.90`, `UC-7.90`, `UE-7.90`
- Initial short spans (15–30 m) show rapid rate of tension relaxation ($|\Delta T| > 1.5\times\text{median}$).
- Terminal long spans (60–65 m) show steepened sag growth rate ($|\Delta S| > 1.5\times\text{median}$).

#### 6. Table `UE-22.3`
- **Span 45 m, 55 m:** tension step $> 1.5\times\text{median}$ ($0.0255\text{ kN}$).

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

| Table | Flagged Rows | Primary Reasons |
| :--- | :---: | :--- |
| **Conductor** | 11 | 4 rows contain `NEEDS_VALUE`; 11 rows missing lookup table ("no sag-tension data") |
| **SpanTensionPoint** | 48 | Step $> 1.5\times$ median, equal neighbouring spans (UD-2.74), or second difference drop (UQ) |
| **Insulator** | 4 | All 4 rows have empty `Tension MFL kN` |
| **GroundClearance** | 10 | Source notes explicitly state "confirm" or require project owner review |
| **StructureClearance** | 3 | Rows with notes stating "confirm" (e.g. 33kV ABC, 11kV ABC, Earth conductor) |
| **CircuitClearance** | 15 | Cross-circuit separation matrix notes requesting confirmation |
| **Total Flagged Rows** | **91** | All preserved with explicit `confirmation_note` |

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
