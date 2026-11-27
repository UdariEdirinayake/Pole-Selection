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
      <svg viewBox="0 0 250 68" style={{ width: '310px', height: '84px', display: 'block' }}>
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
      <svg viewBox="0 0 340 68" style={{ width: '420px', height: '84px', display: 'block' }}>
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
      <svg viewBox="0 0 250 68" style={{ width: '310px', height: '84px', display: 'block' }}>
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
      <svg viewBox="0 0 250 64" style={{ width: '320px', height: '82px', display: 'block' }}>
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
      <svg viewBox="0 0 240 64" style={{ width: '300px', height: '80px', display: 'block' }}>
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
      <svg viewBox="0 0 340 68" style={{ width: '430px', height: '86px', display: 'block' }}>
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
      <svg viewBox="0 0 290 64" style={{ width: '380px', height: '84px', display: 'block' }}>
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
      <svg viewBox="0 0 250 60" style={{ width: '330px', height: '78px', display: 'block' }}>
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
    title: 'Line Tension Bending Moment (BMT / BMTT / BMPT)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Pages 13–14',
    description: 'Transverse moment from line deviation angles at intermediate poles, or longitudinal conductor tension and pole wind moments at terminal dead-ends.',
    equationSvg: (
      <svg viewBox="0 0 430 104" style={{ width: '530px', height: '128px', display: 'block' }}>
        {/* Intermediate / Section Angle Pole */}
        <text x="10" y="24" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" fill="currentColor">
          BM<tspan fontSize="11" dy="3">T</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> = ∑ </tspan>
          N<tspan fontSize="11" dy="3">i</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> · (</tspan>
          T<tspan fontSize="11" dy="3">1,i</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> + </tspan>
          T<tspan fontSize="11" dy="3">2,i</tspan><tspan fontSize="16" dy="-3" fontStyle="normal">) · sin(</tspan>
          α/2<tspan fontStyle="normal">) · </tspan>
          H<tspan fontSize="11" dy="3">i</tspan>
        </text>
        <text x="422" y="24" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11.5" fontStyle="normal" textAnchor="end" fill="currentColor" opacity="0.7">
          (Angle Pole)
        </text>
        {/* Terminal Dead-End Pole */}
        <text x="10" y="56" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" fill="currentColor">
          BM<tspan fontSize="11" dy="3">TT</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> = ∑ </tspan>
          N<tspan fontSize="11" dy="3">i</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> · </tspan>
          T<tspan fontSize="11" dy="3">i</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> · </tspan>
          H<tspan fontSize="11" dy="3">i</tspan>
        </text>
        <text x="422" y="56" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11.5" fontStyle="normal" textAnchor="end" fill="currentColor" opacity="0.7">
          (Terminal Dead-End)
        </text>
        {/* Terminal Pole Longitudinal Wind */}
        <text x="10" y="88" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" fill="currentColor">
          BM<tspan fontSize="11" dy="3">PT</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> = </tspan>
          D<tspan fontSize="11" dy="3">long</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> · </tspan>
          H<tspan fontSize="11" dy="3">gl</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> · </tspan>
          q<tspan fontSize="11" dy="3">pole</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> · (</tspan>
          H<tspan fontSize="11" dy="3">gl</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> / 2)</tspan>
        </text>
        <text x="422" y="88" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11.5" fontStyle="normal" textAnchor="end" fill="currentColor" opacity="0.7">
          (Terminal Pole Wind)
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'BM_T', description: 'Transverse moment at ground line from conductor line deviation', unit: 'kN·m' },
      { symbol: 'BM_TT', description: 'Longitudinal moment at ground line from dead-end line tension', unit: 'kN·m' },
      { symbol: 'BM_PT', description: 'Longitudinal wind moment on pole shaft using longitudinal pole breadth D_long (0.3879 m for 11 m pole)', unit: 'kN·m' },
      { symbol: 'N_i', description: 'Number of conductors in circuit stage i (e.g. 3 for 11 kV, 1 for LV bundle)', unit: '-' },
      { symbol: 'T_1,i , T_2,i', description: 'Aft and fore conductor horizontal tensions under 15°C + Wind', unit: 'kN' },
      { symbol: 'α', description: 'Line deviation angle at this pole', unit: 'degrees' },
      { symbol: 'H_i', description: 'Attachment height above ground line for circuit stage i', unit: 'm' },
    ],
  },
  {
    id: 'eq-pole-top-load',
    number: '2.6',
    title: 'Equivalent Pole Top Working Load (Ptop)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Page 15',
    description: 'Converts total transverse and longitudinal ground line bending moments to equivalent point working loads applied 400 mm below pole top.',
    equationSvg: (
      <svg viewBox="0 0 430 118" style={{ width: '530px', height: '145px', display: 'block' }}>
        {/* Transverse Pole Top Load */}
        <text x="10" y="32" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">
          P<tspan fontSize="11" dy="3">trans</tspan><tspan fontSize="17" dy="-3" fontStyle="normal"> = </tspan>
        </text>
        <text x="165" y="20" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="15" fontStyle="italic" textAnchor="middle" fill="currentColor">
          BM<tspan fontSize="10" dy="3">C</tspan><tspan fontSize="15" dy="-3" fontStyle="normal"> + </tspan>
          BM<tspan fontSize="10" dy="3">P</tspan><tspan fontSize="15" dy="-3" fontStyle="normal"> + </tspan>
          BM<tspan fontSize="10" dy="3">E</tspan><tspan fontSize="15" dy="-3" fontStyle="normal"> + </tspan>
          BM<tspan fontSize="10" dy="3">T</tspan>
        </text>
        <line x1="76" y1="27" x2="254" y2="27" stroke="currentColor" strokeWidth="1.5" />
        <text x="165" y="45" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="15" fontStyle="italic" textAnchor="middle" fill="currentColor">
          H<tspan fontSize="10" dy="3">gl</tspan><tspan fontSize="15" dy="-3" fontStyle="normal"> − 0.40</tspan>
        </text>
        <text x="260" y="32" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="normal" fill="currentColor">
          × 100
        </text>
        <text x="422" y="32" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11.5" fontStyle="normal" textAnchor="end" fill="currentColor" opacity="0.7">
          (Transverse)
        </text>

        {/* Longitudinal Pole Top Load */}
        <text x="10" y="90" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">
          P<tspan fontSize="11" dy="3">long</tspan><tspan fontSize="17" dy="-3" fontStyle="normal"> = </tspan>
        </text>
        <text x="165" y="78" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="15" fontStyle="normal" textAnchor="middle" fill="currentColor">
          ∑ <tspan fontStyle="italic">BM</tspan><tspan fontSize="10" dy="3" fontStyle="italic">long</tspan>
        </text>
        <line x1="76" y1="85" x2="254" y2="85" stroke="currentColor" strokeWidth="1.5" />
        <text x="165" y="103" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="15" fontStyle="italic" textAnchor="middle" fill="currentColor">
          H<tspan fontSize="10" dy="3">gl</tspan><tspan fontSize="15" dy="-3" fontStyle="normal"> − 0.40</tspan>
        </text>
        <text x="260" y="90" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="normal" fill="currentColor">
          × 100
        </text>
        <text x="422" y="90" fontFamily="system-ui, -apple-system, sans-serif" fontSize="11.5" fontStyle="normal" textAnchor="end" fill="currentColor" opacity="0.7">
          (Longitudinal)
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'P_trans', description: 'Transverse pole-top working load capacity required at 400 mm below pole top', unit: 'daN' },
      { symbol: 'P_long', description: 'Longitudinal pole-top working load at 400 mm below pole top (unguyed limit: P_long ≤ 0.25 × P_cap)', unit: 'daN' },
      { symbol: '∑BM_trans', description: 'Total transverse ground line moment = BM_C + BM_P + BM_E + BM_T', unit: 'kN·m' },
      { symbol: '∑BM_long', description: 'Total longitudinal ground line moment: BM_TT + BM_PT + BM_E,long (terminal) or |∑ N_i · (T_1,i − T_2,i) · cos(α/2) · H_i| (section)', unit: 'kN·m' },
      { symbol: 'H_gl', description: 'Free height of pole above ground line (e.g. 9.167 m for 11 m pole)', unit: 'm' },
      { symbol: '0.40', description: 'Standard point of application: 400 mm below pole top', unit: 'm' },
      { symbol: 'Recommended Pole', description: 'Lightest single unguyed pole class with P_cap ≥ P_trans and P_long ≤ 0.25 × P_cap; otherwise proceeds to guyed (EQ 2.7–2.9) or strutted selection', unit: '—' },
    ],
  },
  {
    id: 'eq-residual-wind-load',
    number: '2.7',
    title: 'Pole Top Load on Transverse Direction Without Tension (Pres)',
    category: 'pole',
    standardRef: 'engine/pole_engine/line.py, line 492',
    description: 'Calculates the residual transverse wind-only pole-top load (excluding conductor tension) to select the initial guyed pole class used for subsequent buckling checks.',
    equationSvg: (
      <svg viewBox="0 0 340 68" style={{ width: '420px', height: '84px', display: 'block' }}>
        <text x="10" y="38" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="19" fontStyle="italic" fill="currentColor">
          P<tspan fontSize="12" dy="4">res</tspan><tspan fontSize="19" dy="-4" fontStyle="normal"> = </tspan>
        </text>
        <text x="148" y="25" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" textAnchor="middle" fill="currentColor">
          BM<tspan fontSize="11" dy="3">C</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> + </tspan>
          BM<tspan fontSize="11" dy="3">P</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> + </tspan>
          BM<tspan fontSize="11" dy="3">E</tspan>
        </text>
        <line x1="72" y1="32" x2="224" y2="32" stroke="currentColor" strokeWidth="1.6" />
        <text x="148" y="51" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" textAnchor="middle" fill="currentColor">
          H<tspan fontSize="11" dy="3">gl</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> − 0.40</tspan>
        </text>
        <text x="232" y="38" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="18" fontStyle="normal" fill="currentColor">
          × 100
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'P_res', description: 'Pole-top load on transverse direction without tension, used to select the guyed pole class', unit: 'daN' },
      { symbol: 'BM_C, BM_P, BM_E', description: 'Conductor, pole body, and equipment wind bending moments', unit: 'kN·m' },
      { symbol: 'H_gl − 0.40', description: 'Pole-top load lever arm above ground line (8.767 m for 11 m pole)', unit: 'm' },
      { symbol: 'Pole Selection', description: 'Lightest single pole class with capacity ≥ P_res; passed forward to Euler buckling check', unit: '—' },
    ],
  },
  {
    id: 'eq-guy-tension',
    number: '2.8',
    title: 'Guy Wire Stay Working Tension Load (Ts / Tguy)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Pages 16–17',
    description: 'Tensile working force induced in guy wire stay balancing transverse or longitudinal overturning moments, and stay class selection.',
    equationSvg: (
      <svg viewBox="0 0 570 76" style={{ width: '100%', minWidth: '600px', height: '84px', display: 'block' }}>
        {/* Left hand side: T_S = */}
        <text x="6" y="42" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="21" fontStyle="italic" fill="currentColor">
          T<tspan fontSize="14" dy="4">S</tspan><tspan fontSize="21" dy="-4" fontStyle="normal"> = </tspan>
        </text>
        {/* Numerator */}
        <text x="305" y="27" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="13.2" fontStyle="italic" textAnchor="middle" fill="currentColor">
          (<tspan fontStyle="italic">BM</tspan><tspan fontSize="9.5" dy="2.5">C</tspan><tspan fontSize="13.2" dy="-2.5" fontStyle="normal"> + </tspan>
          <tspan fontStyle="italic">BM</tspan><tspan fontSize="9.5" dy="2.5">E</tspan><tspan fontSize="13.2" dy="-2.5" fontStyle="normal"> + </tspan>
          <tspan fontStyle="italic">BM</tspan><tspan fontSize="9.5" dy="2.5">P</tspan><tspan fontSize="13.2" dy="-2.5" fontStyle="normal"> + </tspan>
          <tspan fontStyle="italic">BM</tspan><tspan fontSize="9.5" dy="2.5">T</tspan><tspan fontSize="13.2" dy="-2.5" fontStyle="normal">) for Transverse Loads or (</tspan>
          <tspan fontStyle="italic">BM</tspan><tspan fontSize="9.5" dy="2.5">TT</tspan><tspan fontSize="13.2" dy="-2.5" fontStyle="normal"> + </tspan>
          <tspan fontStyle="italic">BM</tspan><tspan fontSize="9.5" dy="2.5">PT</tspan><tspan fontSize="13.2" dy="-2.5" fontStyle="normal">) for Longitudinal Loads</tspan>
        </text>
        {/* Fraction bar */}
        <line x1="48" y1="36" x2="562" y2="36" stroke="currentColor" strokeWidth="1.6" />
        {/* Denominator */}
        <text x="305" y="58" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" textAnchor="middle" fill="currentColor">
          H<tspan fontSize="11" dy="3">S</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> × sin(θ)</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'T_S', description: 'Guy wire stay working tension load (kN; × 100 gives daN)', unit: 'kN or daN' },
      { symbol: 'BM_C + BM_E + BM_P + BM_T', description: 'Total ground-line bending moment for Transverse Loads (intermediate and section poles)', unit: 'kN·m' },
      { symbol: 'BM_TT + BM_PT', description: 'Total ground-line bending moment for Longitudinal Loads (terminal dead-end poles)', unit: 'kN·m' },
      { symbol: 'H_S', description: 'Guy attachment height above ground (e.g. 8.4 m for an 11 m pole)', unit: 'm' },
      { symbol: 'θ', description: 'Angle between the guy wire and the vertical pole axis (standard 30°)', unit: 'degrees' },
      { symbol: 'Guy Classification', description: 'Light (L): T_S ≤ 2,000 daN | Medium (M): 2,000 < T_S ≤ 3,500 daN | Heavy (H): 3,500 < T_S ≤ 5,600 daN | Double Heavy (2H): ≤ 11,200 daN', unit: 'daN' },
    ],
  },
  {
    id: 'eq-buckling-load',
    number: '2.9',
    title: 'Guyed Pole Vertical Buckling Load (V*)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Pages 18–19',
    description: 'Downwards vertical axial thrust on the pole under guy wire reaction and equipment weights.',
    equationSvg: (
      <svg viewBox="0 0 430 72" style={{ width: '510px', height: '86px', display: 'block' }}>
        <text x="8" y="28" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">
          V<tspan fontStyle="normal">* = </tspan>
          V<tspan fontSize="11" dy="3">cond</tspan><tspan fontSize="17" dy="-3" fontStyle="normal"> + </tspan>
          <tspan fontStyle="italic">T</tspan><tspan fontSize="11" dy="3">S</tspan><tspan fontSize="17" dy="-3" fontStyle="normal"> · cos(θ) / 100 + </tspan>
          V<tspan fontSize="11" dy="3">eq</tspan>
        </text>
        <text x="8" y="56" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="15" fontStyle="normal" fill="currentColor">
          Buckling Demand = |<tspan fontStyle="italic">V</tspan>*| × 2.5 ≤ <tspan fontStyle="italic">P</tspan><tspan fontSize="11" dy="3">cr</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'V*', description: 'Total vertical compressive design load on guyed pole shaft', unit: 'kN' },
      { symbol: 'V_cond', description: 'Sum of catenary vertical conductor end reactions (fore + aft spans)', unit: 'kN' },
      { symbol: 'T_S · cos(θ) / 100', description: 'Downwards vertical component of guy wire tension (T_S in daN)', unit: 'kN' },
      { symbol: 'V_eq', description: 'Weight of pole-mounted equipment: (m_eq × 9.81) / 1000', unit: 'kN' },
      { symbol: 'P_cr', description: 'Critical Euler buckling capacity from PoleCapacity master table (≥ 2.5 × |V*|)', unit: 'kN' },
    ],
  },
  {
    id: 'eq-sag-scaling',
    number: '2.10',
    title: 'Individual Span Maximum Sag Scaling (65°C)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Page 7',
    description: 'Scales individual span sag from ruling equivalent span sag using the parabolic square ratio.',
    equationSvg: (
      <svg viewBox="0 0 260 64" style={{ width: '320px', height: '80px', display: 'block' }}>
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
    number: '2.11',
    title: 'Moment of Resistance of Soil (Mg)',
    category: 'pole',
    standardRef: 'LECO Standard Specification',
    description: 'Capability of the soil to resist the overturning moment of the pole.',
    equationSvg: (
      <svg viewBox="0 0 260 66" style={{ width: '320px', height: '82px', display: 'block' }}>
        <text x="12" y="39" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="20" fontStyle="italic" fill="currentColor">
          M<tspan fontSize="13" dy="4">g</tspan><tspan fontSize="20" dy="-4" fontStyle="normal"> = </tspan>
        </text>
        {/* Numerator: k × D_g × P^3 */}
        <text x="148" y="25" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="18" fontStyle="italic" textAnchor="middle" fill="currentColor">
          k<tspan fontStyle="normal"> × </tspan>D<tspan fontSize="12" dy="3">g</tspan><tspan fontSize="18" dy="-3" fontStyle="normal"> × </tspan>P<tspan fontSize="12" dy="-6" fontStyle="normal">3</tspan>
        </text>
        {/* Fraction bar */}
        <line x1="78" y1="33" x2="218" y2="33" stroke="currentColor" strokeWidth="1.7" />
        {/* Denominator: 10 */}
        <text x="148" y="54" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="18" fontStyle="normal" textAnchor="middle" fill="currentColor">
          10
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'M_g', description: 'Moment of resistance of soil against pole overturning', unit: 'kN·m' },
      { symbol: 'P', description: 'Pole embedded depth (P = H / 6 = 1.833 m for 11 m pole)', unit: 'm' },
      { symbol: 'k', description: 'Modulus of subgrade reaction (rupturing capacity of soil)', unit: 'kN/m²/m' },
      { symbol: 'D_g', description: 'Average pole width below the ground level (from PoleCapacity master table)', unit: 'm' },
      { symbol: 'BM_F', description: 'Foundation overturning moment at fulcrum depth δ (check: M_g > BM_F)', unit: 'kN·m' },
    ],
  },
  {
    id: 'eq-foundation-bmf',
    number: '2.12',
    title: 'Foundation Overturning Bending Moment (BMF)',
    category: 'pole',
    standardRef: 'engine/pole_engine/foundation.py, lines 74–123',
    description: 'Total overturning moment acting at the geotechnical fulcrum depth δ = P / √2 below ground line, incorporating all constituent wind moments (conductors, pole shaft, equipment) and line tension moments at the fulcrum lever arm in a unified formulation.',
    equationSvg: (
      <div style={{ width: '100%', minWidth: '720px', display: 'flex', flexDirection: 'column', gap: '0.9rem', padding: '0.2rem 0' }}>
        {/* Master Formula Box */}
        <div
          style={{
            padding: '1rem 1.4rem',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: '6px',
            borderLeft: '4px solid var(--primary)',
          }}
        >
          <div
            style={{
              fontFamily: "'Times New Roman', 'Cambria Math', serif",
              fontSize: '1.45rem',
              fontStyle: 'italic',
              fontWeight: 700,
              color: 'var(--text-main)',
              letterSpacing: '0.4px',
              display: 'flex',
              alignItems: 'baseline',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <span>BM<sub style={{ fontSize: '0.95rem' }}>F</sub> = BM<sub style={{ fontSize: '0.95rem' }}>C,F</sub> + BM<sub style={{ fontSize: '0.95rem' }}>P,F</sub> + BM<sub style={{ fontSize: '0.95rem' }}>E,F</sub></span>
            <span style={{ fontSize: '1.2rem', fontStyle: 'normal', color: 'var(--text-secondary)' }}>
              [ + BM<sub style={{ fontSize: '0.85rem' }}>T,F</sub> + |BM<sub style={{ fontSize: '0.85rem' }}>long,F</sub>| <span style={{ fontSize: '0.9rem' }}>(if unguyed)</span> ]
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.45rem', lineHeight: 1.5 }}>
            Geotechnical Fulcrum Depth: <strong><em>δ</em> = <em>P</em> / √2</strong> (where embedment <em>P</em> = <em>H</em> / 6) &nbsp;•&nbsp; Overturning Stability Check: <strong><em>M</em><sub>g</sub> &gt; <em>BM</em><sub>F</sub></strong>
          </div>
        </div>

        {/* 5 Constituent Equations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Term 1: Conductor Wind Moment */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.15rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', gap: '1rem' }}>
            <div style={{ fontFamily: "'Times New Roman', 'Cambria Math', serif", fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--text-main)', letterSpacing: '0.2px' }}>
              <span style={{ fontStyle: 'normal', fontWeight: 700, color: 'var(--primary)', marginRight: '0.6rem' }}>1.</span>
              BM<sub style={{ fontSize: '0.85rem' }}>C,F</sub> = ∑ [ n<sub style={{ fontSize: '0.85rem' }}>c</sub> · (q<sub style={{ fontSize: '0.85rem' }}>w</sub> / 1000) · S<sub style={{ fontSize: '0.85rem' }}>w</sub> · cos(α/2) · d<sub style={{ fontSize: '0.85rem' }}>c</sub> · (H<sub style={{ fontSize: '0.85rem' }}>c</sub> + δ) ]
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem 0.65rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
              Conductor Wind Moment
            </span>
          </div>

          {/* Term 2: Pole Shaft Wind Moment */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.15rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', gap: '1rem' }}>
            <div style={{ fontFamily: "'Times New Roman', 'Cambria Math', serif", fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--text-main)', letterSpacing: '0.2px' }}>
              <span style={{ fontStyle: 'normal', fontWeight: 700, color: 'var(--primary)', marginRight: '0.6rem' }}>2.</span>
              BM<sub style={{ fontSize: '0.85rem' }}>P,F</sub> = D<sub style={{ fontSize: '0.85rem' }}>avg</sub> · H<sub style={{ fontSize: '0.85rem' }}>gl</sub> · (q<sub style={{ fontSize: '0.85rem' }}>pole</sub> / 1000) · (H<sub style={{ fontSize: '0.85rem' }}>gl</sub> / 2 + δ)
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem 0.65rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
              Pole Shaft Wind Moment
            </span>
          </div>

          {/* Term 3: Equipment Wind Moment */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.15rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', gap: '1rem' }}>
            <div style={{ fontFamily: "'Times New Roman', 'Cambria Math', serif", fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--text-main)', letterSpacing: '0.2px' }}>
              <span style={{ fontStyle: 'normal', fontWeight: 700, color: 'var(--primary)', marginRight: '0.6rem' }}>3.</span>
              BM<sub style={{ fontSize: '0.85rem' }}>E,F</sub> = A<sub style={{ fontSize: '0.85rem' }}>e</sub> · (q<sub style={{ fontSize: '0.85rem' }}>pole</sub> / 1000) · (H<sub style={{ fontSize: '0.85rem' }}>e</sub> + δ)
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem 0.65rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
              Equipment Wind Moment
            </span>
          </div>

          {/* Term 4: Line Angle Tension Moment */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.15rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', gap: '1rem' }}>
            <div style={{ fontFamily: "'Times New Roman', 'Cambria Math', serif", fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--text-main)', letterSpacing: '0.2px' }}>
              <span style={{ fontStyle: 'normal', fontWeight: 700, color: 'var(--primary)', marginRight: '0.6rem' }}>4.</span>
              BM<sub style={{ fontSize: '0.85rem' }}>T,F</sub> = ∑ n<sub style={{ fontSize: '0.85rem' }}>i</sub> · (T<sub style={{ fontSize: '0.85rem' }}>1,i</sub> + T<sub style={{ fontSize: '0.85rem' }}>2,i</sub>) · sin(α/2) · (H<sub style={{ fontSize: '0.85rem' }}>i</sub> + δ)
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem 0.65rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
              Line Angle Tension Moment (0 if guyed)
            </span>
          </div>

          {/* Term 5: Longitudinal Tension Moment */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.15rem', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '6px', gap: '1rem' }}>
            <div style={{ fontFamily: "'Times New Roman', 'Cambria Math', serif", fontSize: '1.25rem', fontStyle: 'italic', color: 'var(--text-main)', letterSpacing: '0.2px' }}>
              <span style={{ fontStyle: 'normal', fontWeight: 700, color: 'var(--primary)', marginRight: '0.6rem' }}>5.</span>
              BM<sub style={{ fontSize: '0.85rem' }}>long,F</sub> = ∑ n<sub style={{ fontSize: '0.85rem' }}>i</sub> · (T<sub style={{ fontSize: '0.85rem' }}>1,i</sub> − T<sub style={{ fontSize: '0.85rem' }}>2,i</sub>) · cos(α/2) · (H<sub style={{ fontSize: '0.85rem' }}>i</sub> + δ)
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontStyle: 'normal' }}> &nbsp;[Terminal: ∑ n<sub style={{ fontSize: '0.75rem' }}>i</sub> · T<sub style={{ fontSize: '0.75rem' }}>2,i</sub> · (H<sub style={{ fontSize: '0.75rem' }}>i</sub> + δ)]</span>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'var(--bg-subtle)', padding: '0.25rem 0.65rem', borderRadius: '4px', whiteSpace: 'nowrap' }}>
              Longitudinal Tension Moment (0 if guyed)
            </span>
          </div>
        </div>
      </div>
    ),
    variables: [
      { symbol: 'BM_F', description: 'Total foundation overturning bending moment about fulcrum δ = P / √2', unit: 'kN·m' },
      { symbol: 'BM_C,F', description: 'Conductor wind overturning moment about fulcrum: ∑ n_c · (q_w/1000) · S_w · cos(α/2) · d_c · (H_c + δ)', unit: 'kN·m' },
      { symbol: 'BM_P,F', description: 'Pole shaft wind overturning moment about fulcrum: D_avg · H_gl · (q_pole/1000) · (H_gl/2 + δ)', unit: 'kN·m' },
      { symbol: 'BM_E,F', description: 'Equipment wind overturning moment about fulcrum: A_e · (q_pole/1000) · (H_e + δ)', unit: 'kN·m' },
      { symbol: 'BM_T,F', description: 'Transverse line deviation conductor tension moment about fulcrum (0 if guyed or strutted)', unit: 'kN·m' },
      { symbol: 'BM_long,F', description: 'Longitudinal conductor tension moment about fulcrum (0 if guyed or strutted)', unit: 'kN·m' },
      { symbol: 'δ', description: 'Geotechnical fulcrum depth below ground line: δ = P / √2 (P = H / 6 embedment depth)', unit: 'm' },
      { symbol: 'q_w, q_pole', description: 'Conductor wind pressure (575 N/m²) and pole body wind pressure (865 N/m²)', unit: 'N/m²' },
      { symbol: 'D_avg', description: 'Average pole breadth above ground line (from PoleCapacity master table)', unit: 'm' },
      { symbol: 'A_e, H_e', description: 'Equipment wind area and mounting height above ground line', unit: 'm², m' },
      { symbol: 'Check: M_g > BM_F', description: 'Soil overturning stability requires soil resistance moment M_g to exceed BM_F', unit: 'kN·m' },
    ],
  },
  {
    id: 'eq-foundation-bearing',
    number: '2.13',
    title: 'Vertical Load on Foundation and Soil Bearing Pressure (V_tot & q_actual)',
    category: 'pole',
    standardRef: 'docs/result.pdf, Pages 23–25',
    description: 'Computes total downward vertical foundation load summing pole self-weight, equipment, conductor dead weights, and stay vertical reactions, and verifies bearing contact pressure.',
    equationSvg: (
      <svg viewBox="0 0 540 84" style={{ width: '100%', minWidth: '580px', height: '94px', display: 'block' }}>
        {/* V_tot = W_pole + W_tf + W_cond + Guy_vert */}
        <text x="10" y="26" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" fill="currentColor">
          V<tspan fontSize="11" dy="3">tot</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> (V*) = </tspan>
          W<tspan fontSize="11" dy="3">pole</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> + </tspan>
          W<tspan fontSize="11" dy="3">tf</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> + </tspan>
          W<tspan fontSize="11" dy="3">cond</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> + </tspan>
          Guy<tspan fontSize="11" dy="3">vert</tspan>
        </text>
        {/* q_actual = V* / A_base <= q_permissible */}
        <text x="10" y="62" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" fill="currentColor">
          q<tspan fontSize="11" dy="3">actual</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> = </tspan>
          V<tspan fontStyle="normal">*</tspan><tspan fontStyle="normal"> / </tspan>A<tspan fontSize="11" dy="3">base</tspan>
          <tspan fontStyle="normal"> ≤ q</tspan><tspan fontSize="11" dy="3">permissible</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'V_tot (V*)', description: 'Total vertical downward compressive load on foundation: W_pole + W_tf + W_cond + Guy_vert', unit: 'kN' },
      { symbol: 'W_pole', description: 'Weight of the pole shaft: (m_pole × 9.81) / 1000', unit: 'kN' },
      { symbol: 'W_tf', description: 'Weight of pole-mounted transformer / equipment: (m_eq × 9.81) / 1000', unit: 'kN' },
      { symbol: 'W_cond', description: 'Weight of conductors in weight span: ∑ (w_i × n_i × S_weight × 9.81) / 1000', unit: 'kN' },
      { symbol: 'Guy_vert', description: 'Vertical downward component of guy stay reaction: (T_S × cos(θ)) / 100', unit: 'kN' },
      { symbol: 'A_base', description: 'Effective foundation base contact area (Type A, B, or C footprint)', unit: 'm²' },
      { symbol: 'q_actual', description: 'Vertical contact pressure exerted on soil foundation (must not exceed permissible bearing capacity)', unit: 'kN/m²' },
    ],
  },
  {
    id: 'eq-insulator-pin-load',
    number: '2.14',
    title: 'Insulator Pin Cantilever Load & Tie Check (R)',
    category: 'pole',
    standardRef: 'engine/pole_engine/insulators.py · LECO Spec',
    description: 'Resultant force acting on an insulator pin from conductor tension in transverse direction and wind force on conductor, checked against Ultimate Pin Strength / 2 (SF = 2).',
    equationSvg: (
      <svg viewBox="0 0 500 84" style={{ width: '560px', height: '94px', display: 'block' }}>
        <text x="8" y="34" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="17" fontStyle="italic" fill="currentColor">
          R<tspan fontStyle="normal"> = 2 · </tspan>
          T<tspan fontStyle="normal"> · sin(α/2) + ω · </tspan>
          d<tspan fontStyle="normal"> · </tspan>
          s<tspan fontStyle="normal"> · cos(α/2)</tspan>
        </text>
        <text x="8" y="68" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" fill="currentColor">
          R<tspan fontStyle="normal"> &lt; Ultimate Pin Strength / 2  (SF = 2)</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'R', description: 'Force acting on an insulator pin', unit: 'kN' },
      { symbol: 'T', description: 'Maximum anticipated tension of the conductor (15°C + Wind)', unit: 'kN' },
      { symbol: 'α', description: 'Angle of deviation at the pole', unit: 'degrees' },
      { symbol: 'ω', description: 'Designed wind pressure on conductor (575 N/m²)', unit: 'kN/m²' },
      { symbol: 'd', description: 'Conductor diameter', unit: 'm' },
      { symbol: 's', description: 'Wind span', unit: 'm' },
      { symbol: 'Allowable', description: 'Ultimate Pin Strength / 2 (Safety Factor = 2)', unit: 'kN' },
    ],
  },
  {
    id: 'eq-ground-angle-clearance',
    number: '2.15',
    title: 'Ground Clearance & Effective Crossarm Angle Separation',
    category: 'pole',
    standardRef: 'engine/pole_engine/clearances.py',
    description: 'Verifies lowest conductor height above ground at 65°C maximum sag and effective phase separation at line angles.',
    equationSvg: (
      <svg viewBox="0 0 430 76" style={{ width: '510px', height: '90px', display: 'block' }}>
        <text x="8" y="26" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" fill="currentColor">
          C<tspan fontSize="11" dy="3">ground</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> = </tspan>
          H<tspan fontSize="11" dy="3">lowest</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> − </tspan>
          S<tspan fontSize="11" dy="3">65,span</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> ≥ </tspan>
          C<tspan fontSize="11" dy="3">min</tspan>
        </text>
        <text x="8" y="56" fontFamily="'Times New Roman', 'Cambria Math', serif" fontSize="16" fontStyle="italic" fill="currentColor">
          D<tspan fontSize="11" dy="3">eff</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> = min(</tspan>
          D<tspan fontSize="11" dy="3">start</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> cos(θ</tspan><tspan fontSize="11" dy="3">1</tspan><tspan fontSize="16" dy="-3" fontStyle="normal">/2), </tspan>
          D<tspan fontSize="11" dy="3">end</tspan><tspan fontSize="16" dy="-3" fontStyle="normal"> cos(θ</tspan><tspan fontSize="11" dy="3">2</tspan><tspan fontSize="16" dy="-3" fontStyle="normal">/2))</tspan>
        </text>
      </svg>
    ),
    variables: [
      { symbol: 'C_ground', description: 'Lowest conductor clearance above ground under 65°C maximum sag', unit: 'm' },
      { symbol: 'H_lowest', description: 'Lowest conductor attachment height above ground line', unit: 'm' },
      { symbol: 'S_65,span', description: 'Scaled 65°C sag on the individual span', unit: 'm' },
      { symbol: 'D_eff', description: 'Minimum effective crossarm phase separation across start/end poles of span', unit: 'm' },
    ],
  },
]
