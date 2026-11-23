import React from 'react'
import { SymbolNotation } from './MethodologyEquationBox'

export interface FormulaDefinition {
  id: string
  number: string
  title: string
  category: 'common' | 'pole'
  equationSvg: React.ReactNode
  variables: SymbolNotation[]
  standardRef: string
  description: string
}

/* =====================================================================
   SECTION 1: CALCULATIONS COMMON FOR THE ENTIRE ROUTE
===================================================================== */

export const COMMON_ROUTE_FORMULAS: FormulaDefinition[] = [
  {
    id: 'eq-seq',
    number: '1.1',
    title: 'Equivalent Span (Seq) Calculation',
    category: 'common',
    standardRef: 'docs/result.pdf, Page 4',
    description: 'Calculates the virtual uniform ruling span that yields the identical horizontal tension throughout each continuous tension strain section.',
    equationSvg: (
      <svg viewBox="0 0 250 68" style={{ width: '230px', height: '62px', display: 'block' }}>
        {/* S_eq = */}
        <text x="12" y="42" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="22" fontStyle="italic" fill="currentColor">
          S<tspan fontSize="15" dy="5">eq</tspan><tspan fontSize="22" dy="-5" fontStyle="normal"> =</tspan>
        </text>
        {/* Radical sign with overbar */}
        <path d="M 85,38 L 92,38 L 99,60 L 108,12 L 236,12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Numerator: ∑ S_i^3 */}
        <text x="125" y="30" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="20" fill="currentColor">
          <tspan fontSize="24">∑</tspan> <tspan fontStyle="italic">S</tspan><tspan fontSize="13" dy="4">i</tspan><tspan fontSize="13" dy="-10">3</tspan>
        </text>
        {/* Fraction bar */}
        <line x1="116" y1="36" x2="228" y2="36" stroke="currentColor" strokeWidth="1.8" />
        {/* Denominator: ∑ S_i */}
        <text x="132" y="55" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="20" fill="currentColor">
          <tspan fontSize="24">∑</tspan> <tspan fontStyle="italic">S</tspan><tspan fontSize="13" dy="4">i</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'S_eq', description: 'Equivalent span of the strain section', unit: 'm' },
      { symbol: 'S_i', description: 'Individual span lengths within the section', unit: 'm' },
      { symbol: '∑ S_i^3', description: 'Sum of the cubes of all spans in the section', unit: 'm³' },
      { symbol: '∑ S_i', description: 'Total route length of the section', unit: 'm' },
    ],
  },
  {
    id: 'eq-sag-tension-interp',
    number: '1.2',
    title: 'Conductor Tension via Linear Interpolation on LECO Charts',
    category: 'common',
    standardRef: 'LECO Standard Chart Lookup (docs/result.pdf, Page 5)',
    description: 'Strict linear interpolation between adjacent calibration chart rows. Catenary equations are prohibited per engineering rules.',
    equationSvg: (
      <svg viewBox="0 0 340 68" style={{ width: '310px', height: '62px', display: 'block' }}>
        <text x="10" y="39" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="19" fontStyle="italic" fill="currentColor">
          T<tspan fontStyle="normal">(</tspan>S<tspan fontSize="13" dy="3">eq</tspan><tspan fontStyle="normal" dy="-3">) = </tspan>T<tspan fontSize="13" dy="3">1</tspan><tspan fontStyle="normal" dy="-3"> + (</tspan>T<tspan fontSize="13" dy="3">2</tspan><tspan fontStyle="normal" dy="-3"> - </tspan>T<tspan fontSize="13" dy="3">1</tspan><tspan fontStyle="normal" dy="-3">) ×</tspan>
        </text>
        {/* Bracket and Fraction */}
        <text x="188" y="42" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="32" fontStyle="normal" fill="currentColor">[</text>
        {/* Numerator: S_eq - S1 */}
        <text x="202" y="27" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">
          S<tspan fontSize="12" dy="3">eq</tspan><tspan fontStyle="normal" dy="-3"> - </tspan>S<tspan fontSize="12" dy="3">1</tspan>
        </text>
        {/* Fraction bar */}
        <line x1="198" y1="35" x2="265" y2="35" stroke="currentColor" strokeWidth="1.6" />
        {/* Denominator: S2 - S1 */}
        <text x="206" y="52" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">
          S<tspan fontSize="12" dy="3">2</tspan><tspan fontStyle="normal" dy="-3"> - </tspan>S<tspan fontSize="12" dy="3">1</tspan>
        </text>
        <text x="268" y="42" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="32" fontStyle="normal" fill="currentColor">]</text>
      </svg>
    ),
    variables: [
      { symbol: 'T(S_eq)', description: 'Horizontal line tension at calculated equivalent span S_eq', unit: 'kN' },
      { symbol: 'S_1, S_2', description: 'Lower and upper span calibration bounds from LECO chart', unit: 'm' },
      { symbol: 'T_1, T_2', description: 'Calibrated tension values at S_1 and S_2 respectively', unit: 'kN' },
      { symbol: 'S_eq', description: 'Calculated equivalent ruling span of the section', unit: 'm' },
    ],
  },
  {
    id: 'eq-stress-check',
    number: '1.3',
    title: 'Conductor Working Stress Check (% UTS)',
    category: 'common',
    standardRef: 'LECO Standard Guidelines (docs/result.pdf, Page 5)',
    description: 'Ensures everyday and extreme loading tensions do not exceed mandated fatigue and failure safety thresholds.',
    equationSvg: (
      <svg viewBox="0 0 250 68" style={{ width: '220px', height: '60px', display: 'block' }}>
        <text x="12" y="40" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="20" fontStyle="normal" fill="currentColor">
          % UTS =
        </text>
        <text x="96" y="42" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="30" fontStyle="normal" fill="currentColor">(</text>
        {/* Numerator: T */}
        <text x="115" y="27" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="20" fontStyle="italic" fill="currentColor">
          T
        </text>
        {/* Fraction bar */}
        <line x1="108" y1="34" x2="152" y2="34" stroke="currentColor" strokeWidth="1.6" />
        {/* Denominator: UTS */}
        <text x="110" y="52" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="normal" fill="currentColor">
          UTS
        </text>
        <text x="154" y="42" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="30" fontStyle="normal" fill="currentColor">)</text>
        <text x="172" y="40" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="20" fontStyle="normal" fill="currentColor">
          × 100%
        </text>
      </svg>
    ),
    variables: [
      { symbol: '% UTS', description: 'Percentage of rated ultimate tensile strength utilized', unit: '%' },
      { symbol: 'T', description: 'Tension under loading condition (15°C+Wind or 27°C Everyday)', unit: 'kN' },
      { symbol: 'UTS', description: 'Ultimate Tensile Strength from manufacturer conductor schedule', unit: 'kN' },
      { symbol: 'Limit (15°C+W)', description: 'Maximum permissible working stress = 40% UTS', unit: '%' },
      { symbol: 'Limit (27°C EDS)', description: 'Maximum everyday stress without vibration dampers = 20% UTS', unit: '%' },
    ],
  },
  {
    id: 'eq-phase-separation',
    number: '1.4',
    title: 'Phase-to-Phase Conductor Clearance and Swing Separation',
    category: 'common',
    standardRef: 'LECO Standard Guidelines (docs/result.pdf, Page 9)',
    description: 'Calculates the required physical crossarm separation between phase conductors under maximum sag swing conditions.',
    equationSvg: (
      <svg viewBox="0 0 250 64" style={{ width: '235px', height: '58px', display: 'block' }}>
        <text x="10" y="40" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="20" fontStyle="italic" fill="currentColor">
          D<tspan fontStyle="normal"> = 0.75 · </tspan>
        </text>
        {/* Radical: √S_65 */}
        <path d="M 88,37 L 93,37 L 99,54 L 106,18 L 140,18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="110" y="38" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="18" fontStyle="italic" fill="currentColor">
          S<tspan fontSize="12" dy="4">65</tspan>
        </text>
        <text x="150" y="39" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="19" fontStyle="normal" fill="currentColor">
          +
        </text>
        {/* Fraction: V^2 / 20000 */}
        <text x="194" y="27" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" textAnchor="middle" fill="currentColor">
          V<tspan fontSize="11" dy="-6">2</tspan>
        </text>
        <line x1="172" y1="34" x2="216" y2="34" stroke="currentColor" strokeWidth="1.5" />
        <text x="194" y="52" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="14" fontStyle="normal" textAnchor="middle" fill="currentColor">
          20000
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'D', description: 'Minimum required spacing between phase conductors on crossarm', unit: 'm' },
      { symbol: 'S_65', description: 'Maximum conductor sag at 65°C under maximum equivalent span', unit: 'm' },
      { symbol: 'V', description: 'System operating phase-to-phase voltage (e.g. 11 kV)', unit: 'kV' },
      { symbol: '20,000', description: 'Empirical voltage factor constant from LECO standard specification', unit: '-' },
    ],
  },
]

/* =====================================================================
   SECTION 2: CALCULATIONS THAT DIFFER WITH THE POLE
===================================================================== */

export const POLE_SPECIFIC_FORMULAS: FormulaDefinition[] = [
  {
    id: 'eq-wind-span',
    number: '2.1',
    title: 'Effective Wind Span (Equivalent Transverse Span)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Page 10',
    description: 'Half of the sum of the adjacent spans supported by the pole, governing all transverse wind loadings.',
    equationSvg: (
      <svg viewBox="0 0 240 64" style={{ width: '210px', height: '58px', display: 'block' }}>
        <text x="14" y="39" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="21" fontStyle="italic" fill="currentColor">
          S<tspan fontSize="14" dy="4">w</tspan><tspan fontSize="21" dy="-4" fontStyle="normal"> =</tspan>
        </text>
        {/* Numerator: S_fore + S_aft */}
        <text x="76" y="26" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="18" fontStyle="italic" fill="currentColor">
          S<tspan fontSize="12" dy="3">fore</tspan><tspan fontStyle="normal" dy="-3"> + </tspan>S<tspan fontSize="12" dy="3">aft</tspan>
        </text>
        {/* Fraction bar */}
        <line x1="70" y1="34" x2="195" y2="34" stroke="currentColor" strokeWidth="1.8" />
        {/* Denominator: 2 */}
        <text x="128" y="52" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="20" fontStyle="normal" fill="currentColor">
          2
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'S_w', description: 'Effective wind span carrying transverse conductor wind load', unit: 'm' },
      { symbol: 'S_fore', description: 'Fore span length to the next pole along the route', unit: 'm' },
      { symbol: 'S_aft', description: 'Aft span length from the previous pole (0 for Terminal Start)', unit: 'm' },
    ],
  },
  {
    id: 'eq-bm-conductor',
    number: '2.2',
    title: 'Wind Bending Moment on Conductors (BMC)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Page 11',
    description: 'Transverse moment exerted at ground line by wind pressure acting across all conductors.',
    equationSvg: (
      <svg viewBox="0 0 340 68" style={{ width: '315px', height: '62px', display: 'block' }}>
        <text x="10" y="42" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="19" fontStyle="italic" fill="currentColor">
          BM<tspan fontSize="13" dy="4">C</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> = ∑ [ </tspan>
          n<tspan fontSize="13" dy="4">c</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> · </tspan>
          q<tspan fontSize="13" dy="4">w</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> · </tspan>
          S<tspan fontSize="13" dy="4">w</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> · cos(</tspan>
          α/2<tspan fontStyle="normal">) · </tspan>
          d<tspan fontSize="13" dy="4">c</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> · </tspan>
          H<tspan fontSize="13" dy="4">c</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> ]</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'BM_C', description: 'Bending moment at ground line from wind on conductors', unit: 'kN·m' },
      { symbol: 'n_c', description: 'Number of conductors in circuit (3 for 11 kV, 1 for bundled LV)', unit: '—' },
      { symbol: 'q_w', description: 'Design wind pressure on conductors = 575 N/m²', unit: 'kN/m²' },
      { symbol: 'S_w', description: 'Effective wind span of this pole', unit: 'm' },
      { symbol: 'α', description: 'Line deviation angle at this pole', unit: 'degrees' },
      { symbol: 'd_c', description: 'Overall diameter of the conductor', unit: 'm' },
      { symbol: 'H_c', description: 'Height of conductor attachment above ground line', unit: 'm' },
    ],
  },
  {
    id: 'eq-bm-pole',
    number: '2.3',
    title: 'Wind Bending Moment on Pole Shaft (BMP)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Page 12',
    description: 'Bending moment exerted at ground line by wind pressure acting upon the exposed surface of the pole body.',
    equationSvg: (
      <svg viewBox="0 0 290 64" style={{ width: '270px', height: '60px', display: 'block' }}>
        <text x="12" y="38" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="19" fontStyle="italic" fill="currentColor">
          BM<tspan fontSize="13" dy="4">P</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> = </tspan>
          D<tspan fontSize="13" dy="4">avg</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> · </tspan>
          H<tspan fontSize="13" dy="4">gl</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> · </tspan>
          q<tspan fontSize="13" dy="4">pole</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> · </tspan>
        </text>
        <text x="195" y="40" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="26" fontStyle="normal" fill="currentColor">(</text>
        {/* H_gl / 2 */}
        <text x="210" y="27" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">H<tspan fontSize="11" dy="3">gl</tspan></text>
        <line x1="205" y1="34" x2="235" y2="34" stroke="currentColor" strokeWidth="1.6" />
        <text x="215" y="52" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="normal" fill="currentColor">2</text>
        <text x="240" y="40" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="26" fontStyle="normal" fill="currentColor">)</text>
      </svg>
    ),
    variables: [
      { symbol: 'BM_P', description: 'Bending moment at ground line from wind on the pole body', unit: 'kN·m' },
      { symbol: 'D_avg', description: 'Average diameter of exposed pole shaft: (D_top + D_gl) / 2', unit: 'm' },
      { symbol: 'H_gl', description: 'Free height of pole above ground line (e.g. 9.167 m for 11 m pole)', unit: 'm' },
      { symbol: 'q_pole', description: 'Design wind pressure on circular pole surfaces = 865 N/m²', unit: 'kN/m²' },
    ],
  },
  {
    id: 'eq-bm-equip',
    number: '2.4',
    title: 'Wind Bending Moment on Mounted Equipment (BME)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Page 13',
    description: 'Accounts for wind force on pole-mounted equipment (such as distribution transformers, reclosers, or switchgear).',
    equationSvg: (
      <svg viewBox="0 0 250 60" style={{ width: '230px', height: '56px', display: 'block' }}>
        <text x="14" y="38" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="20" fontStyle="italic" fill="currentColor">
          BM<tspan fontSize="14" dy="4">E</tspan><tspan fontSize="20" dy="-4" fontStyle="normal"> = </tspan>
          A<tspan fontSize="14" dy="4">eq</tspan><tspan fontSize="20" dy="-4" fontStyle="normal"> · </tspan>
          q<tspan fontSize="14" dy="4">equip</tspan><tspan fontSize="20" dy="-4" fontStyle="normal"> · </tspan>
          H<tspan fontSize="14" dy="4">eq</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'BM_E', description: 'Bending moment at ground line from wind on mounted equipment', unit: 'kN·m' },
      { symbol: 'A_eq', description: 'Projected frontal wind area of mounted equipment (e.g. 1.8 m² for 160 kVA TF)', unit: 'm²' },
      { symbol: 'q_equip', description: 'Design wind pressure on equipment bodies = 865 N/m²', unit: 'kN/m²' },
      { symbol: 'H_eq', description: 'Height of equipment center of wind area above ground line', unit: 'm' },
    ],
  },
  {
    id: 'eq-bm-tension',
    number: '2.5',
    title: 'Line Tension Bending Moment (BMT / BMTT)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Pages 13–14',
    description: 'Transverse moment from line deviation angles at intermediate poles, or longitudinal moment at terminal dead-ends.',
    equationSvg: (
      <svg viewBox="0 0 320 68" style={{ width: '300px', height: '62px', display: 'block' }}>
        {/* Intermediate Angle Pole */}
        <text x="10" y="28" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" fill="currentColor">
          BM<tspan fontSize="11" dy="3">T</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> = 2 · </tspan>
          T<tspan fontSize="11" dy="3">max</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> · sin(</tspan>
          α/2<tspan fontStyle="normal">) · </tspan>
          H<tspan fontSize="11" dy="3">eff</tspan>
          <tspan fontStyle="normal" fontSize="13">  (Angle Pole)</tspan>
        </text>
        {/* Terminal Dead-End Pole */}
        <text x="10" y="56" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" fill="currentColor">
          BM<tspan fontSize="11" dy="3">TT</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> = </tspan>
          T<tspan fontSize="11" dy="3">max</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> · </tspan>
          H<tspan fontSize="11" dy="3">eff</tspan>
          <tspan fontStyle="normal" fontSize="13">  (Terminal Dead-End)</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'BM_T', description: 'Transverse moment at ground line from conductor line deviation', unit: 'kN·m' },
      { symbol: 'BM_TT', description: 'Longitudinal moment at ground line from dead-end line tension', unit: 'kN·m' },
      { symbol: 'T_max', description: 'Total conductor horizontal tension under 15°C + Wind loading', unit: 'kN' },
      { symbol: 'α', description: 'Line deviation angle at this pole', unit: 'degrees' },
      { symbol: 'H_eff', description: 'Resultant effective attachment height of conductor tension', unit: 'm' },
    ],
  },
  {
    id: 'eq-pole-top-load',
    number: '2.6',
    title: 'Equivalent Pole Top Working Load (Ptop)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Page 15',
    description: 'Converts total ground line bending moment to an equivalent point working load applied 400 mm below pole top.',
    equationSvg: (
      <svg viewBox="0 0 240 64" style={{ width: '220px', height: '60px', display: 'block' }}>
        <text x="14" y="38" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="21" fontStyle="italic" fill="currentColor">
          P<tspan fontSize="14" dy="4">top</tspan><tspan fontSize="21" dy="-4" fontStyle="normal"> = </tspan>
        </text>
        {/* Numerator: ∑ BM */}
        <text x="96" y="25" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="19" fontStyle="normal" fill="currentColor">
          ∑ BM
        </text>
        {/* Fraction bar */}
        <line x1="84" y1="33" x2="195" y2="33" stroke="currentColor" strokeWidth="1.8" />
        {/* Denominator: H_gl - 0.40 */}
        <text x="88" y="52" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">
          H<tspan fontSize="12" dy="3">gl</tspan><tspan fontStyle="normal" dy="-3"> - 0.40</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'P_top', description: 'Working load capacity required at 400 mm from pole top', unit: 'daN or kN' },
      { symbol: '∑ BM', description: 'Total ground line bending moment = BM_C + BM_P + BM_E + BM_T', unit: 'kN·m' },
      { symbol: 'H_gl', description: 'Free height of pole above ground line', unit: 'm' },
      { symbol: '0.40', description: 'Standard point of application: 400 mm below pole top', unit: 'm' },
    ],
  },
  {
    id: 'eq-guy-tension',
    number: '2.7',
    title: 'Guy Wire Stay Working Tension Load (Tguy)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Pages 16–17',
    description: 'Tension resolved along the stay wire to counteract transverse or longitudinal working forces.',
    equationSvg: (
      <svg viewBox="0 0 230 64" style={{ width: '210px', height: '60px', display: 'block' }}>
        <text x="14" y="38" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="21" fontStyle="italic" fill="currentColor">
          T<tspan fontSize="14" dy="4">guy</tspan><tspan fontSize="21" dy="-4" fontStyle="normal"> = </tspan>
        </text>
        {/* Numerator: P_trans */}
        <text x="90" y="25" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="18" fontStyle="italic" fill="currentColor">
          P<tspan fontSize="12" dy="3">trans</tspan>
        </text>
        {/* Fraction bar */}
        <line x1="84" y1="33" x2="160" y2="33" stroke="currentColor" strokeWidth="1.8" />
        {/* Denominator: sin(θ) */}
        <text x="90" y="52" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="18" fontStyle="normal" fill="currentColor">
          sin(θ)
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'T_guy', description: 'Tensile working force induced in guy wire stay', unit: 'kN or daN' },
      { symbol: 'P_trans', description: 'Horizontal force resolved at the stay attachment level', unit: 'kN' },
      { symbol: 'θ', description: 'Angle of stay wire relative to vertical pole axis (standard 30°)', unit: 'degrees' },
      { symbol: 'SF Stay', description: 'Safety factor = Ultimate stay strength / T_guy ≥ 2.5', unit: '—' },
    ],
  },
  {
    id: 'eq-buckling-load',
    number: '2.8',
    title: 'Guyed Pole Vertical Buckling Load (V*)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Pages 18–19',
    description: 'Downwards vertical axial thrust on the pole under guy wire reaction and equipment weights.',
    equationSvg: (
      <svg viewBox="0 0 340 64" style={{ width: '315px', height: '60px', display: 'block' }}>
        <text x="10" y="39" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="19" fontStyle="italic" fill="currentColor">
          V<tspan fontStyle="normal">* = </tspan>
          T<tspan fontSize="13" dy="4">guy</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> · cos(θ) + </tspan>
          W<tspan fontSize="13" dy="4">pole</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> + </tspan>
          W<tspan fontSize="13" dy="4">eq</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> + </tspan>
          W<tspan fontSize="13" dy="4">c</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'V*', description: 'Total vertical compressive design load on guyed pole shaft', unit: 'kN' },
      { symbol: 'T_guy · cos(θ)', description: 'Downwards vertical component of stay wire tension', unit: 'kN' },
      { symbol: 'W_pole', description: 'Self-weight of pole shaft above ground line', unit: 'kN' },
      { symbol: 'W_eq', description: 'Weight of pole-mounted equipment (transformer + oil)', unit: 'kN' },
      { symbol: 'W_c', description: 'Vertical weight of conductors and hardware attachments', unit: 'kN' },
      { symbol: 'Buckling Check', description: 'Pole Euler buckling capacity P_cr ≥ 2.5 × V*', unit: 'kN' },
    ],
  },
  {
    id: 'eq-sag-scaling',
    number: '2.9',
    title: 'Individual Span Maximum Sag Scaling (65°C)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Page 7',
    description: 'Scales individual span sag from ruling equivalent span sag using the parabolic square ratio.',
    equationSvg: (
      <svg viewBox="0 0 260 64" style={{ width: '240px', height: '60px', display: 'block' }}>
        <text x="12" y="39" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="20" fontStyle="italic" fill="currentColor">
          S<tspan fontSize="13" dy="4">span</tspan><tspan fontSize="20" dy="-4" fontStyle="normal"> = </tspan>
          S<tspan fontSize="13" dy="4">eq</tspan><tspan fontSize="20" dy="-4" fontStyle="normal"> × </tspan>
        </text>
        <text x="110" y="41" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="28" fontStyle="normal" fill="currentColor">(</text>
        {/* L_span / S_eq */}
        <text x="126" y="27" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">L<tspan fontSize="12" dy="3">span</tspan></text>
        <line x1="120" y1="34" x2="168" y2="34" stroke="currentColor" strokeWidth="1.6" />
        <text x="128" y="52" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">S<tspan fontSize="12" dy="3">eq</tspan></text>
        <text x="172" y="41" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="28" fontStyle="normal" fill="currentColor">)</text>
        <text x="185" y="22" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="15" fontStyle="normal" fill="currentColor">2</text>
      </svg>
    ),
    variables: [
      { symbol: 'S_span', description: 'Maximum sag at 65°C on the individual fore span', unit: 'm' },
      { symbol: 'S_eq', description: 'Calibrated sag at equivalent span from LECO master chart', unit: 'm' },
      { symbol: 'L_span', description: 'Length of this individual span', unit: 'm' },
      { symbol: 'Clearance', description: 'Ground Clearance = H_conductor - S_span ≥ 5.5 m across roads', unit: 'm' },
    ],
  },
  {
    id: 'eq-foundation-mg',
    number: '2.10',
    title: 'Geotechnical Soil Overturning Moment of Resistance (Mg)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Pages 20–22',
    description: 'Soil passive resistance moment around fulcrum point Y = P / √2 = 1.296 m below ground.',
    equationSvg: (
      <svg viewBox="0 0 240 64" style={{ width: '220px', height: '60px', display: 'block' }}>
        <text x="14" y="38" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="21" fontStyle="italic" fill="currentColor">
          M<tspan fontSize="14" dy="4">g</tspan><tspan fontSize="21" dy="-4" fontStyle="normal"> = </tspan>
        </text>
        {/* Numerator: k · D_g · P³ */}
        <text x="82" y="26" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="18" fontStyle="italic" fill="currentColor">
          k · D<tspan fontSize="12" dy="3">g</tspan><tspan dy="-3"> · P</tspan><tspan fontSize="12" dy="-8">3</tspan>
        </text>
        {/* Fraction bar */}
        <line x1="72" y1="34" x2="165" y2="34" stroke="currentColor" strokeWidth="1.8" />
        {/* Denominator: 10 */}
        <text x="108" y="53" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="19" fontStyle="normal" fill="currentColor">
          10
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'M_g', description: 'Moment of resistance of soil against overturning around fulcrum', unit: 'kN·m' },
      { symbol: 'k', description: 'Modulus of subgrade reaction of soil (e.g. 25,000 kN/m³ for Medium)', unit: 'kN/m³' },
      { symbol: 'D_g', description: 'Average diameter of pole embedded in ground foundation', unit: 'm' },
      { symbol: 'P', description: 'Depth of pole embedment in ground (1.833 m for 11 m pole)', unit: 'm' },
      { symbol: 'Stability Check', description: 'Soil Resistance M_g ≥ Overturning Moment BMF', unit: 'kN·m' },
    ],
  },
  {
    id: 'eq-foundation-bearing',
    number: '2.11',
    title: 'Soil Bearing Pressure and Vertical Foundation Capacity',
    category: 'pole',
    standardRef: 'docs/result.pdf, Pages 23–25',
    description: 'Verifies the downward compressive vertical load does not exceed soil bearing limits.',
    equationSvg: (
      <svg viewBox="0 0 230 64" style={{ width: '210px', height: '60px', display: 'block' }}>
        <text x="14" y="38" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="21" fontStyle="italic" fill="currentColor">
          q<tspan fontSize="13" dy="4">actual</tspan><tspan fontSize="21" dy="-4" fontStyle="normal"> = </tspan>
        </text>
        {/* Numerator: V* */}
        <text x="102" y="25" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="19" fontStyle="italic" fill="currentColor">
          V<tspan fontStyle="normal">*</tspan>
        </text>
        {/* Fraction bar */}
        <line x1="90" y1="33" x2="148" y2="33" stroke="currentColor" strokeWidth="1.8" />
        {/* Denominator: A_base */}
        <text x="96" y="52" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">
          A<tspan fontSize="12" dy="3">base</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'q_actual', description: 'Vertical contact pressure exerted on soil foundation', unit: 'kN/m²' },
      { symbol: 'V*', description: 'Total vertical downward load (stay vertical force + dead weights)', unit: 'kN' },
      { symbol: 'A_base', description: 'Effective foundation base contact area (Type A or Type B footprint)', unit: 'm²' },
      { symbol: 'Bearing Check', description: 'q_actual ≤ Permissible soil bearing capacity for soil class', unit: 'kN/m²' },
    ],
  },
]
