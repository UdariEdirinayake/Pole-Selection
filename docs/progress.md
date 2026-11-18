# Engineering Progress & Calibration Record

## Phase 4A – Sag-Tension Calculation Engine (`engine/pole_engine`)
Status: ✅ Complete

### 1. Engine Modules
* `engine/pole_engine/units.py`: Strict explicit unit conversions (`m_to_mm`, `mm_to_m`, `dan_to_kn`, `kn_to_dan`, `kg_to_n`, `n_to_kn`, `kn_to_n`) using $g = 9.80665\text{ m/s}^2$.
* `engine/pole_engine/sag_tension.py`: Pure Python sag-tension calculation engine:
  * **Equivalent Span:** $\text{calculate\_equivalent\_span\_m}(spans) = \sqrt{\frac{\sum s^3}{\sum s}}$.
  * **Chart Lookup & Interpolation:** Linear interpolation across table points (e.g. Table UQ). Fails closed (`NOT ASSESSED`) if outside bounds; never extrapolates.
  * **Sag Scaling Rule:**
    $$S(L) = S(L_{eq}) \cdot \left(\frac{L}{L_{eq}}\right)^2$$
  * **Tension Ratio Check:** Tension as explicit % of UTS. Max stress check at 15°C+wind evaluated against 40% threshold (`OK`/`FAIL`).
  * **Configurable EDS Check:** Mapping function defaults to `NOT ASSESSED` as PASS/CAUTION/FAIL rules are pending project specification.

### 2. Benchmark Verification against `docs/result_reference.json`
* **Equivalent Spans:**
  * Section 1 (Poles 1–6): Calculated $32.798\text{ m}$ $\to$ matches reference **$32.8\text{ m}$**.
  * Section 2 (Poles 7–13): Calculated $30.526\text{ m}$ $\to$ matches reference **$30.5\text{ m}$**.
* **Tensions & Stress Ratios (Conductor: 70+16+N50, Table UQ, UTS = 15.0 kN):**
  * Section 1 @ 15°C + wind: **$5.252\text{ kN}$** $\to$ **$35.0\%$** of UTS (Limit: 40%, Check: `OK`).
  * Section 2 @ 15°C + wind: **$5.173\text{ kN}$** $\to$ **$34.5\%$** of UTS (Limit: 40%, Check: `OK`).
  * Both Sections @ 27°C (EDS): **$3.152\text{ kN}$** $\to$ **$21.0\%$** of UTS (Limit: 20%, Check: `NOT ASSESSED`).
* **Sag Schedule Comparisons:**
  * **27°C Sag Schedule (13 poles):** 12 exact matches ($0.000\text{ m}$ difference); Pole 10 difference is $0.001\text{ m}$ ($0.600\text{ m}$ calculated vs $0.601\text{ m}$ reference).
  * **65°C Max Sag (13 poles):** 10 exact matches ($0.000\text{ m}$ difference); Poles 6, 12, 13 difference is $0.001\text{ m}$ ($0.967\text{ m}$ vs $0.968\text{ m}$; $0.429\text{ m}$ vs $0.428\text{ m}$).
  * No reference values were altered. Differences are documented rounding variations.

### 3. API Integration
* `POST /api/engine/sag-tension`: Accepts `{"project_id": <int>}`, runs calculations across all strain sections and circuits, and returns structured schedules, tension checks, and warnings.
* Results page banner preserved as `Sample data` until structural analysis engine integration is complete.

### 4. Test Isolation
* `backend/tests/conftest.py` isolates tests into a temporary database `test_pole_select.db`. `backend/pole_select.db` is never modified by tests.
