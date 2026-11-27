# LineDesign (`pole-select`) — Project Submission Summary

**Repository:** `https://github.com/UdariEdirinayake/Pole-Selection.git`  
**Domain:** Overhead Electrical Distribution Line Design & Pole Selection (LECO Engineering Standards)

---

## 1. Project Overview

**LineDesign** is a full-stack engineering web application built to automate and verify LECO-standard overhead line structural design (11 kV / 33 kV / LV). It replaces manual spreadsheet lookups and hand calculations with a deterministic, fail-closed Python engineering engine backed by versioned master data and an interactive React review interface.

---

## 2. System Architecture

The monorepo is structured into three decoupled layers:

```
pole-select/
├── engine/pole_engine/     # Pure Python engineering calculation engine (zero web dependencies)
│   ├── line.py             # End-to-end line calculation orchestrator (M1–M8)
│   ├── sag_tension.py      # LECO sag-tension chart lookup & linear interpolation
│   ├── loads.py            # Wind, tension, equipment & pole bending moments
│   ├── selection.py        # Pole class selection (Unguyed, Guyed, Strutted) & buckling check
│   ├── foundation.py       # Foundation stability (Mg, BM_F, embedment, soil bearing)
│   ├── insulators.py       # Insulator pin cantilever (SF=2) & preform tie selection
│   ├── clearances.py       # Ground clearance & crossarm phase separation checks
│   └── units.py            # Explicit SI unit conversions (g = 9.80665 m/s²)
├── backend/                # FastAPI REST API + SQLAlchemy + Alembic migrations
│   ├── app/api/            # Auth, Master Data, Projects, Engine Run, Results endpoints
│   ├── app/importers/      # Idempotent Excel master data importer (dataset_version tracking)
│   └── app/models.py       # Relational schema (SQLite default / PostgreSQL compatible)
├── frontend/               # React + TypeScript + Vite UI
│   └── src/pages/          # Projects, Survey Import, Review & Run, Results, Construction Data, Help/Docs
└── data/source/            # Master Excel source (LECO_Pole_Selection_Construction_Data.xlsx)
```

---

## 3. End-to-End Engineering Workflow (M1–M8)

1. **M1 — Line Geometry & Spans:** Imports pole-by-pole survey schedule (section, pole number, aft/fore spans, deviation angle $\alpha$, soil class, equipment) and computes wind span $s_w = (s_{\text{aft}} + s_{\text{fore}})/2$ and section ruling span.
2. **M2 — Sag-Tension Chart Lookup:** Interpolates conductor tension and sag at $15^\circ\text{C} + \text{Wind}$ and $27^\circ\text{C}$ (EDS) and $65^\circ\text{C}$ (max sag) directly from LECO master sag-tension tables (fail-closed if outside chart bounds; no extrapolation).
3. **M3 — Conductor Stress Checks:** Verifies $T_{15^\circ\text{C}+\text{Wind}} \le 40\%\,\text{UTS}$ and $T_{27^\circ\text{C}} \le 20\%\,\text{UTS}$.
4. **M4 — Bending Moments & Pole Selection:** Computes transverse wind & tension moments on conductors ($BM_C$), pole ($BM_P$), and equipment ($BM_E$), selects **Unguyed**, **Guyed** (with guy wire sizing & buckling check), or **Strutted** pole class from `PoleCapacity`.
5. **M5 — Foundation & Soil Bearing:** Evaluates overturning resistance ($M_g = k \cdot D_g \cdot P^3 / 10$), factored foundation moment ($BM_F$), embedment depth, and vertical bearing pressure against soil class limits.
6. **M6 — Insulator Pin Cantilever & Preform Tie Selection:**
   - Computes pin load $R = 2 \cdot T \cdot \sin(\alpha/2) + \omega \cdot d \cdot s \cdot \cos(\alpha/2)$ ($\omega = 575\text{ N/m}^2$).
   - Verifies $R < \text{Ultimate Pin Strength} / 2$ ($\text{SF} = 2$), escalating to `2×` pin if needed or `TEN**` if exceeded.
   - Selects preform tie by angle: `TTIE` ($\le 10^\circ$), `STIE` ($\le 20^\circ$), `2STIE` ($\le 40^\circ$), `TEN**` ($> 40^\circ$ or dead-end).
7. **M7 — Ground & Circuit Clearances:** Checks minimum ground clearance at $65^\circ\text{C}$ sag and effective crossarm phase separation at angle poles.
8. **M8 — Results, Inspection & Export:** Interactive pole-by-pole equation walkthrough (**Review & Run**), summary tables with CSV export (**Results**), and full methodology documentation (**Help & Docs**).

---

## 4. Key Engineering & Security Safeguards

- **No Hard-Coded Engineering Constants:** All wind pressures, safety factors, pole capacities, and sag-tension tables are loaded from versioned master database tables.
- **Explicit Units & Fail-Closed Evaluation:** All quantities carry explicit SI unit suffixes; missing, out-of-range, or `needs_confirmation` inputs fail closed rather than guessing.
- **Authentication & Access Control:** JWT stored in `httpOnly`, `SameSite=Lax` cookies with bcrypt-hashed passwords and role-based route protection (`designer`, `reviewer`, `admin`).

---

## 5. Verification Status

- **Engine Unit Tests:** `79 passed` (`backend\.venv\Scripts\pytest.exe engine/tests -q`) covering sag-tension interpolation, loads, pole selection, foundation stability, insulator SF=2 cantilever & tie rules, and clearances.
- **Frontend Production Build:** `tsc -b && vite build` passes cleanly with 0 TypeScript errors.
