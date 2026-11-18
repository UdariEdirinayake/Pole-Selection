# Rules and Engineering Constraints for AGENTS

## 1. No Hard-Coded Engineering Values
- Never hard-code physical constants, material yield strengths, soil bearing capacities, safety factors, wind load parameters, or pole catalog dimensions directly into computation algorithms.
- All engineering data, physical coefficients, and equipment specifications must be externalized and loaded strictly from validated configuration files or database sources (`data/source` or the versioned database master tables).
- Master parameters are tracked in `design_parameter` with explicit citations (e.g., `wind_conductor` is 575 N/m² as confirmed by the project owner; do not use 400 N/m²).

## 2. Explicit Unit Conversion
- Every function, calculation step, data model, and API schema must use explicit unit definitions (e.g., `diameter_mm`, `diameter_m`, `everyday_tension_dan`, `everyday_tension_kn`, `weight_kg`, `weight_n`).
- Every converted column in the database stores the unit name beside the converted field (e.g., `weight_n_unit = "N"`, `ultimate_tensile_strength_kn_unit = "kN"`).
- No implicit assumptions about units are allowed.
- Unit conversions must be handled by designated, strictly-tested unit conversion helper functions in `backend/app/units.py` and `engine/pole_engine/units.py`. Standard gravity is $g = 9.80665\text{ m/s}^2$ for kg $\to$ N conversions.

## 3. PASS Only When All Inputs Are Valid
- A calculation run or pole selection evaluation must return `PASS` if and only if:
  1. Every required input is present and within defined physical and engineering validity bounds.
  2. All intermediate and final safety factor checks strictly meet or exceed required thresholds.
- If any input is missing, out-of-range, NaN, null, or marked with `needs_confirmation`, the system must immediately fail closed, returning `FAIL` or raising a domain validation error with explicit explanatory details. Partial or fallback assumptions that produce an unverified `PASS` are strictly forbidden.

## 4. Formula Unit Testing Against Benchmark
- Every calculation formula and engineering equation implemented must be covered by unit tests validated against the authoritative reference benchmarks in `docs/result.pdf`.
- Test cases must verify outputs across standard operating ranges, boundary conditions, and edge cases to ensure numeric parity with the reference document.

## 5. No Invented Formulas
- Every equation, calculation logic, and structural analysis rule must trace directly to established engineering standards or the designated benchmark specification (`docs/result.pdf`).
- Do not invent, approximate, or extrapolate engineering formulas without documented standard citations.
- Implementation of calculations must strictly follow approved specifications.

## 6. Master Data Integrity & Idempotency Rules
- Never fill, guess, or correct a value during import.
- Cells with `'NEEDS_VALUE'` or empty cells must be stored as `NULL` with `needs_confirmation = True`.
- Rows whose source notes contain `'confirm'` or similar review requests must be flagged with `needs_confirmation = True`.
- Conductors without an associated lookup table must be flagged with `needs_confirmation = True` and note `'no sag-tension data'`.
- Insulators with empty tension MFL must be flagged with `needs_confirmation = True`.
- Re-running the master data importer must create a new `dataset_version` record, never duplicating or overwriting historical rows.

## 7. Authentication, Access Control & UI State Rules
- **No Credentials in Repository:** Initial administrative accounts must be provisioned via environment variables and CLI scripts (`cli_init_admin.py`). Passwords must never be hard-coded into repository files or test suites.
- **Fail-Closed Access Control:** Protected backend routes and frontend views must fail closed when unauthenticated or when role requirements are not met (returning HTTP 401/403 and redirecting to `/signin`).
- **Secure Token Storage:** Authentication tokens must be transported in `httpOnly`, `SameSite=Lax` cookies.
- **Status Indicators:** All UI status chips (PASS, OK, SATISFIED, CAUTION, FAIL, NOT ASSESSED, PENDING) must always render explicit text alongside color, never relying on color alone.

## 8. Calculation Engine & Test Database Isolation Rules
- **Pure Python Engine:** Calculation engines in `engine/pole_engine` must be pure Python with zero web framework dependencies.
- **Sag-Tension Method:** Calculations follow LECO standard chart lookup with linear interpolation. Catenary and parabolic state-change equations are prohibited.
- **Fail-Closed Table Lookups:** Any ruling span outside the bounds of a conductor's calibration table must return `NOT ASSESSED` with an explanatory reason. Extrapolation beyond calibrated bounds is strictly forbidden.
- **Test Database Isolation:** Test suites must execute against isolated temporary databases (`test_pole_select.db`) and must never connect to or mutate the operational database `backend/pole_select.db`.


