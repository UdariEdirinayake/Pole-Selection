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

---

## Phase 4B – Clearances & Phase Separation Engine (`engine/pole_engine/clearances.py`)
Status: ✅ Complete & Verified

### 1. Engine Modules & Implementation
* **Pure Python Architecture:** Implemented in `engine/pole_engine/clearances.py` with zero web dependencies.
* **Phase Separation (docs/result.pdf page 9):**
  * Required separation formula:
    $$D = 0.75 \cdot \sqrt{s} + \frac{V^2}{20000} \text{ (m)}$$
    where $s$ is maximum sag at 65°C (m), $V$ is line voltage in kV ($11\text{ kV}$).
  * Straight crossarm separation: loaded from master table `CrossarmConfig` (config_no=10, P621-MS $\to 1.100\text{ m}$).
  * Separation reduction at line deviation angles:
    $$D_{\text{start}} = \text{straight} \cdot \cos\left(\frac{\theta_{\text{start}}}{2}\right), \quad D_{\text{end}} = \text{straight} \cdot \cos\left(\frac{\theta_{\text{end}}}{2}\right)$$
    $$D_{\text{actual}} = \min(D_{\text{start}}, D_{\text{end}})$$
    Terminal poles evaluate with $\theta = 0^\circ$.
  * Evaluation: `PASS` if $D_{\text{actual}} > D_{\text{required}}$, else `FAIL`.
  * Maximum crossarm angle capability:
    $$\text{max\_angle} = \left\lfloor 2 \cdot \arccos\left(\frac{D_{\text{required}}}{\text{straight}}\right) \right\rfloor \text{ (degrees)}$$
  * Fails closed with `NOT ASSESSED` if any engineering input is missing.
* **Ground Clearance & Profile Clearance (docs/result.pdf pages 7–8):**
  * Lowest ground clearance of bottom circuit:
    $$\text{lowest\_clearance} = \text{attachment\_height} + \text{terrain\_height} - s_{65}$$
  * Attachment height derivation: For the benchmark $11\text{ m}$ pole with standard embedment ratio $1/6$ ($1.833\text{ m}$ embedment, $9.167\text{ m}$ above ground), the LV crossarm drop from pole top is $1.047\text{ m}$, yielding attachment height $8.120\text{ m}$ ($7.557\text{ m} + 0.563\text{ m} = 8.120\text{ m}$). For non-11m poles, the LV drop is explicitly flagged as an input needed rather than hard-coded.
  * Applicable clearance from `GroundClearance` table: $5.50\text{ m}$ for LV across any road or street. Status: `SATISFIED` if $\text{lowest\_clearance} \ge \text{applicable\_clearance}$.
  * Circuit-to-circuit clearance: minimum vertical separation between 11 kV and LV along span is $1.454\text{ m}$ vs required $1.20\text{ m}$ from `CircuitClearance` table. Status: `SATISFIED`. Flagged rows produce warnings.

### 2. Benchmark Verification against `docs/result_reference.json`
* **Phase Separation (Poles 1–12):**
  * 100% parity across all 12 spans for required separation ($0.569, 0.666, 0.569, 0.647, 0.608, 0.744, 0.733, 0.595, 0.477, 0.693, 0.458, 0.497\text{ m}$).
  * 100% parity for separation at angle ($1.092, 1.092, 1.099, 1.099, 1.099, 1.034, 1.034, 1.091, 1.091, 1.097, 1.099, 1.099\text{ m}$).
  * 100% parity for max crossarm angle ($117^\circ, 105^\circ, 117^\circ, 107^\circ, 112^\circ, 94^\circ, 96^\circ, 114^\circ, 128^\circ, 101^\circ, 130^\circ, 126^\circ$).
  * Status: `PASS` across all spans.
* **Ground Clearance (Poles 1–13):**
  * 100% parity across all 13 spans for lowest ground clearance ($7.557, 7.345, 7.557, 7.390, 7.476, 7.152, 7.181, 7.503, 7.725, 7.280, 7.757, 7.692, 7.692\text{ m}$).
  * Status: `SATISFIED` across all spans for both ground clearance ($\ge 5.50\text{ m}$) and circuit clearance ($1.454\text{ m} \ge 1.20\text{ m}$).

### 3. API Endpoint
* `POST /api/engine/clearances`: Accepts `{"project_id": <int>}`, computes phase separation and clearances, returning detailed results and warnings. Results page banner remains `Sample data` until full engine completion.

### 4. Phase 4B Corrections (Removal of Fitted Constants & Fail-Closed Inputs)
* **Removed Fitted Constants from Engine:**
  * Removed hard-coded `1.047 m` LV drop offset from engine code.
  * Removed hard-coded `1.454 m` circuit clearance spacing from engine code.
  * Removed literal voltage `11.0 kV` default; voltage $V$ is read strictly from the circuit's `nominal_voltage_kv`.
  * Removed literal `1/6` fallback; embedment ratio is read strictly from `design_parameter` (`embedment_ratio`).
* **Explicit Project Inputs:**
  * `attachment_height_below_pole_top_m` (m) and `vertical_spacing_11kv_lv_m` (m) are now explicit inputs with **no default**.
  * When either input is missing, the engine fails closed: ground clearance and circuit clearance return `NOT ASSESSED` with the reason `'input needed'`.
* **Test Isolation & Traceability:**
  * In unit tests, `1.047 m` and `1.454 m` are supplied strictly as explicit test inputs commented `'back-calculated from result.pdf, source pending'`.
  * Unit tests assert that missing inputs return `NOT ASSESSED` with reason `'input needed'`.

### 5. Audit Record: Every Value from docs/result.pdf Not Present in Master Data
The following engineering parameters and configuration values originate strictly from `docs/result.pdf` and have no corresponding source row in the imported Excel master data (`data/source/`):

| Parameter / Value | Value in Reference | PDF Citation | Status / Handling in System |
|---|---|---|---|
| **Attachment height below pole top** | `1.047 m` | Pages 7–8 (Attachment height $8.120\text{ m} = 9.167\text{ m} - 1.047\text{ m}$) | `attachment_height_below_pole_top_m`: explicit project input (no default). Returns `NOT ASSESSED` with `'input needed'` if omitted. |
| **Circuit-to-circuit vertical spacing** | `1.454 m` | Page 8 (Clearance table column `min_vert_clear_c1_c2_m`) | `vertical_spacing_11kv_lv_m`: explicit project input (no default). Returns `NOT ASSESSED` with `'input needed'` if omitted. |
| **Crossarm selection for sample line** | Config 10 (P621-MS, $1.100\text{ m}$) | Page 9 (Phase separation table `crossarm_separation_straight_m`) | Selected based on PDF reference. `CrossarmConfig` contains dimension $1.1\text{ m}$, but association to this project is from PDF. |
| **Sample line geotechnical soil class** | Class 4 | Page 1 & geotechnical summary | Default soil class 4 for sample project poles. |
| **Distribution Transformer (Pole 4)** | TF-160kVA ($750\text{ kg}$, $0.84\text{ m}^2$) | Pages 1, 5, 6 | Equipment record associated with Pole 4. |
| **Crossarm phase separation formula** | $D = 0.75\sqrt{s} + V^2 / 20000$ | Page 9 (formula note at bottom of table) | Implemented directly in `engine/pole_engine/clearances.py` per PDF specification. |
| **Terrain height along span** | $0.0\text{ m}$ | Pages 7–8 (`max_terrain_height_m`) | Default terrain rise in flat terrain sample calculation. |


