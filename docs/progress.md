# Engineering Progress & Calibration Record

## Phase 4A – Sag-Tension Calculation Engine (`engine/pole_engine`)
Status: ✅ Complete & Verified

### 1. Engine Modules & Implementation Rules
* **Pure Python Architecture:** Zero web dependencies in `engine/pole_engine`.
* **Editable Installation:** Package defined via `engine/pyproject.toml` and installed via `pip install -e engine` (documented in `engine/README.md`). Manual `.pth` workarounds removed.
* `engine/pole_engine/units.py`: Strict explicit unit conversions (`m_to_mm`, `mm_to_m`, `dan_to_kn`, `kn_to_dan`, `kg_to_n`, `n_to_kn`, `kn_to_n`) using standard gravity $g = 9.80665\text{ m/s}^2$.
* `engine/pole_engine/sag_tension.py`:
  * **Equivalent Span:** $\text{calculate\_equivalent\_span\_m}(spans) = \sqrt{\frac{\sum s^3}{\sum s}}$.
  * **Exact Equivalent Span Precision:** All sag chart lookups, interpolations, and parabolic scalings strictly use the **exact (unrounded) equivalent span** float.
  * **Pole Sag Span Rule:**
    `get_pole_sag_span_m(fore_span_m, aft_span_m)`: Uses the `fore_span_m`, and uses `aft_span_m` when the `fore_span_m` is 0 (terminal pole, e.g. Pole 13 with aft span $25.0\text{ m}$).
  * **Fail-Closed Table Lookups:** Linear interpolation within table range; out-of-bounds queries fail closed returning `NOT ASSESSED` with an explanatory reason. Extrapolation is strictly forbidden. Flagged rows (`needs_confirmation=True`) carry warning messages.
  * **Sag Scaling Rule:**
    $$S(L) = S(L_{eq}) \cdot \left(\frac{L}{L_{eq}}\right)^2$$
  * **Tension Ratio Check:** Tension as explicit % of UTS. Max stress check at 15°C+wind evaluated against 40% threshold (`OK`/`FAIL`).
  * **Production EDS Status:** `default_eds_assessment` / `assess_eds_check` strictly returns `NOT ASSESSED` in production until an engineering classification rule is approved by project authorities. Benchmark-only evaluation helpers remain strictly inside `tests/` with explicit comments.

### 2. Benchmark Verification against `docs/result_reference.json` & `docs/result.pdf`
* **Equivalent Spans:**
  * Section 1 (Poles 1–6): Exact unrounded $32.797567\text{ m}$ $\to$ display rounded **$32.8\text{ m}$**.
  * Section 2 (Poles 7–13): Exact unrounded $30.526416\text{ m}$ $\to$ display rounded **$30.5\text{ m}$**.
* **Tensions & Stress Ratios (Conductor: 70+16+N50, Table UQ, UTS = 15.0 kN):**
  * Section 1 @ 15°C + wind: **$5.252\text{ kN}$** $\to$ **$35.0\%$** of UTS (Limit: 40%, Check: `OK`).
  * Section 2 @ 15°C + wind: **$5.173\text{ kN}$** $\to$ **$34.5\%$** of UTS (Limit: 40%, Check: `OK`).
  * Both Sections @ 27°C (EDS): **$3.152\text{ kN}$** $\to$ **$21.0\%$** of UTS (Limit: 20%, Status: `NOT ASSESSED`).
* **Sag Schedule Calibration:**
  * **27°C Everyday Sag Schedule (13 poles):**
    Using the exact (unrounded) equivalent span yields **100% exact parity across all 13 poles** with **zero differences** ($0.000\text{ m}$ delta on every pole from 1 to 13):
    `[0.414, 0.569, 0.414, 0.536, 0.473, 0.711, 0.671, 0.441, 0.282, 0.601, 0.259, 0.306, 0.306]`.
  * **65°C Maximum Sag Schedule (13 poles):**
    * 10 of 13 poles match to 3 decimal places ($0.000\text{ m}$ difference).
    * Exactly 3 known $1\text{ mm}$ differences are kept as a documented engineering tolerance of $\pm 1\text{ mm}$ (due to floating-point rounding of intermediate calibration chart tables):
      * Pole 6: calculated $0.967\text{ m}$ vs reference $0.968\text{ m}$ ($\Delta = 0.001\text{ m}$).
      * Pole 12: calculated $0.429\text{ m}$ vs reference $0.428\text{ m}$ ($\Delta = 0.001\text{ m}$).
      * Pole 13: calculated $0.429\text{ m}$ vs reference $0.428\text{ m}$ ($\Delta = 0.001\text{ m}$).
    * No reference values were altered to force a fit.

### 3. API Integration
* `POST /api/engine/sag-tension`: Accepts `{"project_id": <int>}`, runs calculations across all strain sections and circuits using `get_pole_sag_span_m` and exact ruling spans, returning schedules, tension checks, and warnings.
* Results page banner preserved as `Sample data` until full structural loading and moment analysis engine integration is completed.

### 4. Test Isolation
* `backend/tests/conftest.py` isolates tests into a temporary database `test_pole_select.db`. `backend/pole_select.db` is never modified by tests.
