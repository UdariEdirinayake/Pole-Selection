# pole-select (LineDesign)

Monorepo for LECO overhead electrical line structural pole selection, foundation & clearance verification, and master catalog management.

> **Supervisor / Reviewer Summary:** See [docs/PROJECT_SUBMISSION_SUMMARY.md](docs/PROJECT_SUBMISSION_SUMMARY.md) for the complete architecture overview, engineering methodology (M1–M8), workflow, and verification summary.

---

## Quick Start (Local Setup & Run)

### Option A: One-Click Launcher for Windows (Recommended for Non-Technical Users)
1. Install **Python 3.10+** (check *"Add Python to PATH"*) and **Node.js LTS**.
2. Download this repository (**Code → Download ZIP**) and extract the folder.
3. Double-click **`start_linedesign.bat`** in the main folder.
   - On the first run, it automatically installs dependencies, imports the LECO master Excel workbook, asks you to set a login password, and opens `http://localhost:5173` in your browser.

### Option B: Manual Setup (Developers)

### 1. Backend & Engine Setup
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
pip install -e ../engine
```

### 2. Initialize Database & Import Master Data
Without a `.env` file, the backend defaults to local SQLite (`backend/pole_select.db`).
```bash
# Run from backend/
alembic upgrade head
python -m app.importers.excel_master ../data/source/LECO_Pole_Selection_Construction_Data.xlsx

# Create an initial user (provide your own credentials via env vars)
# Windows PowerShell:
$env:ADMIN_EMAIL="reviewer@linedesign.local"; $env:ADMIN_PASSWORD="<your-password>"; $env:ADMIN_ROLE="reviewer"; python -m app.cli_init_admin
```

### 3. Start Backend & Frontend
Terminal 1 (Backend on port 8000):
```bash
cd backend
.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```

Terminal 2 (Frontend on port 5173):
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Monorepo Layout

```
pole-select/
├── AGENTS.md           # Engineering constraints & guidelines for agentic development
├── README.md           # Getting started and run instructions
├── backend/            # FastAPI backend with SQLite & Alembic migrations
│   ├── alembic/        # Alembic migration environment and versions
│   │   └── versions/   # 0001_initial, 73a833a806de_create_master_data_tables
│   ├── alembic.ini     # Alembic configuration
│   ├── app/            # FastAPI application
│   │   ├── api/        # REST endpoints (/api/master/*, /health)
│   │   ├── importers/  # excel_master.py importer
│   │   ├── models.py   # Master data models & tracking
│   │   ├── units.py    # Explicit SI unit conversions
│   │   └── main.py
│   ├── requirements.txt
│   └── tests/          # Backend & master data unit tests
├── engine/             # Pure Python package with pytest
│   ├── pole_engine/    # Core package modules (units, models)
│   ├── pyproject.toml  # Package configuration & dependencies
│   ├── README.md
│   └── tests/          # Engine unit tests
├── frontend/           # React + TypeScript + Vite frontend
│   ├── src/            # Application components, styles, and entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── data/
│   └── source/         # Raw source material (LECO_Pole_Selection_Construction_Data.xlsx)
├── docs/               # Reference documents & data-quality-report.md
└── tests/              # Top-level integration and end-to-end tests
```

---

## Phase 1 – Master Data Import

### Database Tables (Alembic Versioned)
Every master table records: `id`, `source_sheet`, `source_row`, `dataset_version_id`, `needs_confirmation` (bool), and `confirmation_note` (text).

- `dataset_version`: version tracking with `id`, `name`, `imported_at`, `source_file`, `file_hash`.
- `conductor`: electrical & mechanical specs, lookup table links, and converted SI units (`daN` $\to$ `kN`, `kg/m` $\to$ `N/m`, `mm` $\to$ `m`, `kg/mm²` $\to$ `N/m²`).
- `span_tension_point`: lookup tables keyed by `(table_id, span_m)` storing tension and temperature-dependent sag points.
- `pole_capacity`: pole capacity classes keyed by `(height_m, mount_type, class_label)` with working loads converted `daN` $\to$ `kN`, `kg` $\to$ `N`.
- `guy_wire`: working loads (`daN` $\to$ `kN`) and installation angles.
- `soil_class`: soil classes (1 to 5) with `bearing_min_kn_per_m2`, `bearing_max_kn_per_m2`, and `subgrade_kn_per_m3`.
- `equipment`: transformers, LBS, AR with physical dimensions, weight (`kg` $\to$ `N`), and wind area.
- `insulator`: cantilever strengths, voltage levels, and tension MFL.
- `crossarm_config`: pin spacing dimensions and minimum conductor separation.
- `ground_clearance`: statutory minimum clearances across environments.
- `structure_clearance`: clearances to buildings, trees, and structures.
- `circuit_clearance`: inter-circuit vertical separation matrix.
- `design_parameter`: design criteria and constants with source document citations (`wind_conductor` = 575 N/m², `wind_pole` = 865 N/m², `embedment_ratio` = 1/6, `soil_rotation_rad` = 0.01 rad).
- `sample_line_pole`: sample line schedule poles 1–13.

### Running the Importer
The importer is idempotent: each execution registers a new `dataset_version` record and imports without duplicating historical data:
```bash
cd backend
python -m app.importers.excel_master ../data/source/LECO_Pole_Selection_Construction_Data.xlsx
```

### Data Quality & Audit Report
See [docs/data-quality-report.md](file:///C:/Users/user/.gemini/antigravity/scratch/pole-select/docs/data-quality-report.md) for complete audits:
- Row counts per sheet and total imported records.
- Identified data gaps (empty `Pole Configurations` sheet, missing cross-arm configurations 7, 8, 13, and empty insulator tension MFL).
- Monotonicity checks on all span-tension lookup tables.
- List of all rows flagged with `needs_confirmation = True`.

---

## Read-Only Master Data API

Start the backend:
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Available endpoints:
- `GET /health`: backend and database connection status.
- `GET /api/master/dataset-versions`: list all imported dataset versions.
- `GET /api/master/{table}`: query any master data table with optional filters:
  - `?version_id=<id>`: filter by dataset version.
  - `?needs_confirmation=true|false`: filter rows requiring confirmation.
  - `?limit=100&offset=0`: pagination.

Example tables: `conductors`, `span-tension-points`, `pole-capacities`, `soil-classes`, `equipment`, `insulators`, `crossarm-configs`, `ground-clearances`, `structure-clearances`, `circuit-clearances`, `design-parameters`, `sample-line-poles`.

---

## Phase 2 – UI Shell with Mock Data & Authentication (Step 2A)

### Authentication & Authorization (Step 2A)
- **User Table & Migration:** `user` table storing `id`, `email`, `password_hash`, `role` (`designer`, `reviewer`, `admin`), `active`, and `created_at`.
- **JWT Cookies:** Secure `httpOnly` JWT cookies (`pole_select_token`) with 24-hour expiration.
- **Password Security:** Salted hashes generated using `bcrypt`.
- **Role Enforcement:** Reusable FastAPI dependency `require_role(["designer", "reviewer", "admin"])`.
- **CLI Admin Initialization:** Create an initial administrator without credentials stored in code:
  ```bash
  cd backend
  python -m app.cli_init_admin
  ```
- **Auth API Endpoints:**
  - `POST /api/auth/login`: verifies email & password, sets httpOnly cookie.
  - `POST /api/auth/logout`: clears httpOnly cookie.
  - `GET /api/auth/me`: retrieves active session profile.
  - `GET /api/auth/admin-only`: role-guarded endpoint for admin operations.
  - `GET /api/auth/reviewer-check`: role-guarded endpoint for reviewer/admin operations.
- **Frontend Auth Integration:**
  - `SignInPage`: accessible login form with email & password inputs and quick demo logins for testing.
  - `ProtectedRoute`: route guard verifying authenticated state, redirecting unauthenticated visitors to `/signin`.
  - Header user chip displaying email, role badge, and sign-out button.

---

## Running Tests

### Backend & Master Data Tests
```bash
cd backend
.venv\Scripts\python.exe -m pytest
```

### Frontend Vitest Tests
```bash
cd frontend
npm.cmd test
```

```bash
cd backend
pytest
```
Covers:
1. Exact row counts matching the Excel file across all 12 sheets.
2. Spot-checks of 10 known values (e.g. conductor 1 UTS 1500 daN $\to$ 15 kN, pole 11 m '850 U' = 850 daN, soil class 4 subgrade 52500 kN/m³).
3. Idempotent re-import creating a new version without duplicating records.
4. `NEEDS_VALUE` cells stored strictly as `NULL` with `needs_confirmation = True`.
5. REST API responses for master tables and version tracking.

### Engine Tests
```bash
cd engine
pytest
```
