# Calculation specification (from the original tool)

Source: `docs/reference/original_tool/index.html`, the `Calc` module
(function names below; it starts at about line 10415). `docs/result.pdf` is
the output of that tool for the sample line.

**Rules for the agent**
1. The original tool is the reference. Where this file and the tool differ,
   the tool wins. Report the difference, do not guess.
2. Pure Python in `engine/pole_engine`. No formula is invented. Every constant
   has a source (this file, master data, or an explicit project input).
3. Missing input -> `NOT ASSESSED` with reason `input needed`. Never default.
4. Tests compare to `docs/result_reference.json`. Never change a reference value.
5. Units: kN, kN.m, daN (= kN x 100), m, N/m2, kg. Convert explicitly.

## Step 1. Equivalent span (`equivalentSpan`)
`Leq = sqrt( sum(s^3) / sum(s) )` over the spans of one strain section, using
spans > 0 only. Use the exact value, never a rounded one.

## Step 2. Tension from the chart (`lookupTensionKN`, `lookupTension27KN`)
Linear interpolation of the conductor's lookup table at `Leq`: T at 15 C + wind
and T at 27 C. The result is multiplied by the line tension factor `fac`
(`factorFor`, default 1; read how it is set before using it).
Difference kept on purpose: the tool returns the end value outside the table
range. The new engine returns NOT ASSESSED outside the range (fail-closed).

## Step 3. Sag at the actual span (`scaleSag`)
`S_actual = S_eq x (L_actual / Leq)^2`, with the chart sag at `Leq` for
27 C and 65 C. Pole span: fore span, or aft span when the fore span is 0.
The 65 C values differ from the PDF by 1 mm at poles 6, 12, 13. The clearance
code uses a catenary calculation (`catenaryUnequal`, line ~10626). Check
whether that is the cause before accepting the tolerance.

## Step 4. Tension check vs UTS (inside `computeLine`, ~line 12330)
- `limit15 = UTS x max_stress_pct (40 %)`, `limit27 = UTS x eds_pct (20 %)`.
- `ok15 = T15 <= limit15`; `ok27 = T27 <= limit27`.
- **EDS status rule:** if `ok27` -> OK. If not ok27 and the circuit is
  LV and the conductor description matches /bundle|abc|aerial/ (function
  `isLvAbcConductor`) -> **CAUTION** (reference only). Otherwise -> **FAIL**.
- Circuit passes when `ok15 AND (ok27 OR LV-ABC)`.
- In the sample line the 11 kV circuit is FAIL because it is HV. The LV circuit
  is CAUTION because it is a bundled LV conductor. The tension values are the same.

## Step 5. Ground-line moments (all kN.m, `q` in kN/m2 = N/m2 / 1000)
Heights above ground: `h = poleHeight x 5/6 - offset`, where the offset comes
from the pole configuration (`heights_m`, see "Missing data").
- Wind on conductors (`bmWindCond`):
  `BMc = n x windSpan x cos(alpha/2) x d x q_cond x h` (summed over levels;
  d = conductor diameter in m, q_cond = 575 N/m2).
- Tension at an angle (`bmTensionAngle`): `BMt = (T1 + T2) x sin(alpha/2) x n x h`
  (T1 aft, T2 fore).
- Terminal tension (`bmTensionFull`): `BMtt = n x T x h`.
- Wind on pole (`bmWindPole`): `H = poleHeight x 5/6`;
  `BMp = breadth x H x q_pole x H/2` (q_pole = 865 N/m2; breadth from the pole
  capacity table `avg_breadth_m`; the tool default is 0.28 m for 11 m poles).
  Check: pole 1 gives 10.18 kN.m (PDF 10.18).
- Equipment (`bmEquipParts`):
  `BME = A x q_pole x (h_tf + B/2) + W_kg x 9.810001 x (1.325 - depth/2) x 0.001`
  (`h_tf` from the equipment row `TFH_11m_Pole`; for a terminal pole's
  longitudinal moment the weight term is subtracted).
- `Mtransverse = BMc + BMe + BMp + BMt`, `Mlongitudinal = BMtt + BMpt + BMlong`.

## Step 6. Pole-top load and pole selection (`toPoleTop`, `pickUnguyed`)
- Pole-top load (daN) = `BM / (poleHeight x 5/6 - 0.4) x 100`, for transverse and
  longitudinal.
- Unguyed pole: the first pole in the nominal list whose capacity >= the load,
  for BOTH directions. 11 m list: 200, 350, 500, 850, 1200, 2x850 (1700),
  2x1200 (2400). 9 m and 13 m lists are in `NOMINAL`.
- Strutted pole (`pickStruttedPair`): P <= 745.41 -> 200/200 S;
  <= 1349.74 -> 200/350 S; <= 1601.5 -> 200/500 S; <= 2441.83 -> 200/850 S;
  above that, not possible.

## Step 7. Guy (`guyWireLoadDaN`, `guyLongForceDaN`, `pickGuyed`)
- `G = BM / (hg x sin(alpha_g) x cos(theta)) x 100` daN. `hg` = guy height
  (config `guy_h_m`, tool default 8.4 m), `alpha_g` = 30 deg (design parameter),
  `theta` = guy angle to the transverse (default 0).
- `F_long = G x sin(alpha_g) x sin(theta)`.
- Pole-top load after the guy removes the tension terms:
  `(BMc + BMe + BMp) / (H - 0.4)`; `pickGuyed` picks the first class that carries
  the residual load, with the stay class (L / M / H) from the guy capacity.

## Step 8. Buckling (`bucklingCapacityKN`, `verticalLoadKN`)
- Capacity: `critical_buckling_kN` from the pole capacity table (Excel). Fallback
  table for 11 m: 200 -> 56.1, 350 -> 91.0, 500 -> 106.6, 850 -> 157.7,
  1200 -> 228.8 kN.
- Demand V*: conductor weight over the weight span (`w x n x weightSpan x 9.8/1000`)
  + guy vertical (`G x cos(alpha_g) / 100`) + equipment weight (`kg x 9.8/1000`).
  The pole's own weight is not in the buckling check.
- Where the 2.5 safety factor is applied: read the check logic around the
  buckling column and write the exact rule here before coding.

## Step 9. Insulator and tie (`insulatorLoad`, `selectInsulatorByAngle`)
- `R (daN) = 2 x T(kN) x 100 x sin(alpha/2) + 57.5 x d(mm) x windSpan / 1000`.
- Intermediate pole: angle <= top-tie max (10) -> insulator + top tie;
  <= side-tie max (20) -> side tie; above -> 2 insulators + 2 side ties.
  Terminal and section poles: tension insulator (TEN), no tie.
- Tension insulator working limit = 0.4 x mechanical failing load.

## Step 10. Foundation (`computeFoundation`)
- Embedment `P = poleHeight / 6`; fulcrum depth `f = P / sqrt(2)`.
- Moments rebuilt about the fulcrum with every lever arm + f:
  `BMf = BMc(f) + BMp(f) + BME(f)`, plus `BMt + |BMlong|` (unguyed,
  intermediate) or full `BMlong` (unguyed terminal). Guyed or strutted:
  no tension terms.
- Soil resistance: `M_R = (k x B x theta / 3) x (f^3 + (P - f)^3)`, theta = 0.01 rad,
  k = soil subgrade (kN/m3), B = below-ground breadth of the pole.
  Stable when `M_R > BMf`. If not: `B_min = BMf / ((k x theta / 3) x sumCube)`.
- Vertical load: pole weight + equipment + conductors + guy vertical (kN).
- Bearing: footprint L x W from the capacity table; foundation types
  **A (+0 mm), B (+200 mm), C (+400 mm)** added to both sides;
  capacity = area x soil minimum bearing (the lower end of a range).
  Recommended type = the first of A, B, C with capacity >= vertical load.
  If none: enlarge the footprint above `Vtot / bearing` m2.

## Step 11. Clearances (to be written before coding)
Read these and add the exact steps to this file: ground-clearance requirement
(`applicableGroundClearance`, line ~11873), circuit-to-circuit
(`circuitVerticalReq`), the per-span catenary profile
(`catenaryUnequal`), and the phase-separation code (search `0.75`). Already
verified from the PDF: `D = 0.75 x sqrt(s) + V^2/20000`.

## Missing data (blocks Steps 5-11 without it)
The pole configuration rows are not in the Excel ("Pole Configurations" is
empty). The tool needs, per configuration: `pole_height_m`, `heights_m`
(attachment heights per level), `n_per_level`, `guy_h_m`, earth levels.
Tool fallbacks if absent: HV level = `H x 5/6 - 0.2`, LV level = `H x 5/6 - 1.4`.
The 1.047 m offset in the PDF comes from this configuration data
(LV level at 8.120 m for an 11 m pole), plus the insulator height for HV levels.
Do not hard-code it. Ask for the configuration table.

## Differences from the PDF to resolve
- 65 C sag: 1 mm at poles 6, 12, 13.
- Unknown rows in the PDF's cut-off columns: use slide_8 only for column layout,
  not as a data source.
