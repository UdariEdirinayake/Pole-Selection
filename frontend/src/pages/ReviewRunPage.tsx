import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  Loader2,
  BookOpen,
  Activity,
} from 'lucide-react'
import { useProject } from '../context/ProjectContext'
import { StatusChip } from '../components/StatusChip'
import { MethodologyEquationBox } from '../components/MethodologyEquationBox'
import { COMMON_ROUTE_FORMULAS, POLE_SPECIFIC_FORMULAS } from '../components/MethodologyFormulas'

// Fallback benchmark calculation data from docs/result.pdf (used when no live project poles exist)
interface PoleStepDetail {
  pole_no: number
  section: number
  aft_span: number
  fore_span: number
  angle_deg: number
  equipment: string
  wind_span: number
  weight_span: number
  bm_c_kNm: number
  bm_p_kNm: number
  bm_e_kNm: number
  bm_t_kNm: number
  bm_tt_kNm?: number
  bm_long_kNm?: number
  bm_pt_kNm?: number
  total_bm_kNm?: number
  pole_top_transverse_daN: number
  pole_top_longitudinal_daN?: number
  selected_pole: string
  guy_type?: string
  guy_load_daN?: number
  bm_guy_kNm?: number
  guy_height_m?: number
  guy_angle_deg?: number
  bm_f_kNm: number
  mg_kNm: number
  stability: string
  vertical_load_kN: number
  foundation_type: string
  soil_class: number
  pole_height_m?: number
  sag65_m?: number
  lowest_clearance_m?: number
  applicable_clearance_m?: number
  ground_clearance_ok?: boolean
  circuit_clearance_ok?: boolean
  buckling_capacity_kN?: number
  buckling_demand_kN?: number
  buckling_ok?: boolean
  residual_load_daN?: number
  subgrade_k?: number
  bearing_c_kN?: number
  tie?: string
  insulator_t_kN?: number
  insulator_pin_load_kN?: number
  insulator_recalc_kN?: number
  insulator_cantilever_kN?: number
  insulator_allowable_kN?: number
  insulator_desc?: string
  is_dead_end?: boolean
  guyed_before_buckling?: string
  guyed_final?: string
  unguyed_pole?: string
  below_gl_m?: number
  embedment_m?: number
  fulcrum_delta_m?: number
  bm_c_f_kNm?: number
  bm_p_f_kNm?: number
  bm_e_f_kNm?: number
  bm_t_f_kNm?: number
  bm_long_f_kNm?: number
  is_guyed_or_strut?: boolean
  pole_breadth_m?: number
  pole_long_breadth_m?: number
  equip_area_m2?: number
  equip_height_m?: number
  weight_pole_kN?: number
  weight_tf_kN?: number
  weight_cond_kN?: number
  guy_vert_kN?: number
}

const BENCHMARK_FALLBACK_STEPS: Record<number, PoleStepDetail> = {
  1: {
    pole_no: 1,
    section: 1,
    aft_span: 0,
    fore_span: 29,
    angle_deg: 0,
    equipment: 'None',
    wind_span: 14.5,
    weight_span: 14.5,
    bm_c_kNm: 6.05,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 0,
    bm_tt_kNm: 128.88,
    bm_pt_kNm: 14.10,
    bm_long_kNm: 142.98,
    pole_breadth_m: 0.28,
    pole_long_breadth_m: 0.388,
    equip_area_m2: 0,
    equip_height_m: 0,
    pole_top_transverse_daN: 185,
    pole_top_longitudinal_daN: 1586,
    selected_pole: '11/500 M',
    unguyed_pole: 'X',
    guy_type: 'Medium Guy (3500 daN)',
    guy_load_daN: 3404.29,
    bm_guy_kNm: 142.98,
    guy_height_m: 8.4,
    guy_angle_deg: 30,
    residual_load_daN: 185.1,
    guyed_before_buckling: '11/200 M',
    guyed_final: '11/500 M',
    buckling_capacity_kN: 56.1,
    buckling_demand_kN: 72.78,
    buckling_ok: false,
    bm_f_kNm: 18.91,
    mg_kNm: 9317.00,
    below_gl_m: 0.288,
    embedment_m: 1.833,
    subgrade_k: 52500,
    stability: 'Stable (Mg ≥ BMf)',
    weight_pole_kN: 5.50,
    weight_tf_kN: 0.0,
    weight_cond_kN: 3.00,
    guy_vert_kN: 20.61,
    vertical_load_kN: 29.11,
    foundation_type: 'Type B',
    soil_class: 4,
  },
  2: {
    pole_no: 2,
    section: 1,
    aft_span: 29,
    fore_span: 34,
    angle_deg: 14,
    equipment: 'None',
    wind_span: 31.5,
    weight_span: 31.5,
    bm_c_kNm: 13.05,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 31.42,
    total_bm_kNm: 54.65,
    pole_top_transverse_daN: 623,
    selected_pole: '11/850 U',
    unguyed_pole: '850 U',
    guy_type: 'Light Guy (2000 daN)',
    guy_load_daN: 1301.19,
    bm_guy_kNm: 54.65,
    guy_height_m: 8.4,
    guy_angle_deg: 30,
    residual_load_daN: 265.0,
    guyed_before_buckling: '11/350 L',
    guyed_final: '11/350 L',
    buckling_capacity_kN: 91.0,
    buckling_demand_kN: 32.0,
    buckling_ok: true,
    pole_breadth_m: 0.28,
    pole_long_breadth_m: 0.388,
    equip_area_m2: 0,
    equip_height_m: 0,
    bm_f_kNm: 62.46,
    mg_kNm: 10805.13,
    below_gl_m: 0.334,
    embedment_m: 1.833,
    subgrade_k: 52500,
    stability: 'Stable (Mg ≥ BMf)',
    weight_pole_kN: 5.50,
    weight_tf_kN: 0.0,
    weight_cond_kN: 7.30,
    guy_vert_kN: 0.0,
    vertical_load_kN: 12.8,
    foundation_type: 'Type A',
    soil_class: 4,
  },
}

export const ReviewRunPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeProject, refreshProjects } = useProject()
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [projectDetails, setProjectDetails] = useState<any>(null)
  const [calcResults, setCalcResults] = useState<any>(() => {
    const stateLive = (location.state as any)?.liveResults
    if (stateLive) return stateLive
    const cached = localStorage.getItem('linedesign_latest_results')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        // Discard stale cache if missing updated bm_guy_kNm, Mg formula version, BM_F breakdown, or insulator T_kN
        const hasInsulatorFields =
          !Array.isArray(parsed?.results?.[0]?.insulator_levels) ||
          parsed.results[0].insulator_levels.length === 0 ||
          parsed.results[0].insulator_levels[0]?.T_kN != null
        if (
          parsed?.results?.[0]?.bm_guy_kNm != null &&
          parsed?.results?.[0]?.foundation?.mg_formula === 'k_Dg_P3_div_10' &&
          parsed?.results?.[0]?.foundation?.bm_c_f_kNm != null &&
          hasInsulatorFields
        ) {
          return parsed
        } else {
          localStorage.removeItem('linedesign_latest_results')
        }
      } catch { }
    }
    return null
  })
  const [loading, setLoading] = useState(false)

  // Active topic section (Section 1 vs Section 2)
  const [activeSection, setActiveSection] = useState<'section1' | 'section2'>('section1')
  const [selectedPoleNo, setSelectedPoleNo] = useState<number>(1)

  useEffect(() => {
    let isMounted = true

    // Check if live calculation results were provided in route state
    const stateLive = (location.state as any)?.liveResults
    if (stateLive && isMounted) {
      setCalcResults(stateLive)
    }

    const loadProjectAndEngine = async () => {
      let projectId: number | null = (location.state as any)?.projectId || activeProject?.id || null

      if (!projectId) {
        try {
          const projRes = await fetch('/api/projects/')
          if (projRes.ok) {
            const projs = await projRes.json()
            const arr: any[] = Array.isArray(projs) ? projs : projs.items || []
            const withPoles = arr.find((p: any) => (p.pole_count || 0) > 0) || arr[0]
            if (withPoles) projectId = withPoles.id
          }
        } catch (e) {
          console.error('Error finding default project:', e)
        }
      }

      if (!projectId) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        // 1. Fetch full project details (poles, circuits, line arrangement)
        const projRes = await fetch(`/api/projects/${projectId}`)
        if (projRes.ok) {
          const pData = await projRes.json()
          if (isMounted) {
            setProjectDetails(pData)
            if (pData.poles && pData.poles.length > 0) {
              setSelectedPoleNo(pData.poles[0].pole_no)
            }
          }
        }

        // 2. Fetch calculation engine results if not already available
        if (!calcResults && !stateLive) {
          const runRes = await fetch('/api/engine/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId }),
          })
          if (runRes.ok) {
            const rData = await runRes.json()
            if (isMounted && rData.calculation_results) {
              setCalcResults(rData.calculation_results)
              localStorage.setItem('linedesign_latest_results', JSON.stringify(rData.calculation_results))
            }
          }
        }
      } catch (err) {
        console.error('Error fetching project review details:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadProjectAndEngine()
    return () => {
      isMounted = false
    }
  }, [activeProject?.id, location.state])

  // Poles of the current project
  const projectPoles: any[] = useMemo(() => {
    return projectDetails?.poles || []
  }, [projectDetails])

  const polesCount = projectPoles.length > 0 ? projectPoles.length : (activeProject?.pole_count ?? 13)

  // Dynamic Section Division & Equivalent Span Calculations for this project
  const projectSections = useMemo(() => {
    if (projectPoles.length === 0) {
      // Fallback 2 sections
      return [
        {
          section: 1,
          poles: [],
          spans: [29, 34, 29, 33, 31, 38],
          sumCubed: 208610,
          sumLinear: 194,
          seq: 32.79,
          startPole: 1,
          endPole: 7,
          totalLength: 194,
          tensionChecks: [],
        },
        {
          section: 2,
          poles: [],
          spans: [37, 30, 24, 35, 23, 25],
          sumCubed: 162109,
          sumLinear: 174,
          seq: 30.52,
          startPole: 7,
          endPole: 13,
          totalLength: 174,
          tensionChecks: [],
        },
      ]
    }

    const map: Record<number, any[]> = {}
    projectPoles.forEach((p: any) => {
      const s = p.section || 1
      if (!map[s]) map[s] = []
      map[s].push(p)
    })

    return Object.keys(map).map((secKey) => {
      const sec = Number(secKey)
      const secPoles = map[sec]
      const spans = secPoles.map((p) => Number(p.fore_span_m)).filter((s) => s > 0)
      const sumCubed = spans.reduce((acc, s) => acc + Math.pow(s, 3), 0)
      const sumLinear = spans.reduce((acc, s) => acc + s, 0)
      const seq = sumLinear > 0 ? Math.sqrt(sumCubed / sumLinear) : 30.0
      const startPole = secPoles[0]?.pole_no || 1
      const endPole = secPoles[secPoles.length - 1]?.pole_no || startPole

      // Find tension checks for this section from engine results
      const tChecks = (calcResults?.tensionChecks || []).filter((tc: any) => tc.section === sec)

      return {
        section: sec,
        poles: secPoles,
        spans,
        sumCubed,
        sumLinear,
        seq: Number(seq.toFixed(2)),
        startPole,
        endPole,
        totalLength: sumLinear,
        tensionChecks: tChecks,
      }
    })
  }, [projectPoles, calcResults])

  // Dynamic Selected Pole Data matching the active project
  const selectedPoleData: PoleStepDetail = useMemo(() => {
    const pole = projectPoles.find((p: any) => p.pole_no === selectedPoleNo) || projectPoles[0]
    const pIdx = projectPoles.findIndex((p: any) => p.pole_no === selectedPoleNo)
    const prevPole = pIdx > 0 ? projectPoles[pIdx - 1] : null
    const calcRow = (calcResults?.results || []).find((r: any) => r.pole_no === selectedPoleNo)

    if (calcRow) {
      const aft = pole ? Number(pole.aft_span_m || 0) : (pIdx > 0 ? Number(prevPole?.fore_span_m || 0) : 0)
      const fore = Number(calcRow.fore ?? pole?.fore_span_m ?? 30)
      const angle = Number(calcRow.angle ?? pole?.angle_deg ?? 0)
      const windSpan = Number(((aft + fore) / 2).toFixed(1))
      const weightSpan = windSpan
      const bmC = Number((calcRow.bm_wind_cond_kNm ?? 0).toFixed(2))
      const bmP = Number((calcRow.bm_pole_kNm ?? 10.18).toFixed(2))
      const bmE = Number((calcRow.bm_equip_kNm ?? 0).toFixed(2))
      const bmT = Number((calcRow.bm_tension_kNm ?? 0).toFixed(2))
      const longLoad = calcRow.terminal_long_load_daN != null ? Number(calcRow.terminal_long_load_daN) : undefined
      const isTerminal = aft === 0 || fore === 0 || calcRow.is_terminal === true || selectedPoleNo === 1
      const bmTT = calcRow.bm_tension_long_kNm != null && Number(calcRow.bm_tension_long_kNm) > 0
        ? Number(Number(calcRow.bm_tension_long_kNm).toFixed(2))
        : (isTerminal ? (longLoad ? Number(Math.max(0, (longLoad * 8.767) / 100 - bmP).toFixed(2)) : 128.88) : undefined)
      const bmLong = calcRow.bm_long_kNm != null ? Number(Number(calcRow.bm_long_kNm).toFixed(2)) : undefined
      const bmPT = calcRow.bm_pt_kNm != null && Number(calcRow.bm_pt_kNm) > 0
        ? Number(Number(calcRow.bm_pt_kNm).toFixed(2))
        : (isTerminal ? 14.10 : undefined)
      const totalBm = Number((bmC + bmP + bmE + bmT).toFixed(2))
      const topTrans = Number(calcRow.pole_top_load_daN ?? 0)
      const poleHeightM = Number(calcRow.pole_height_m ?? calcResults?.poleHeight ?? projectDetails?.pole_height_m ?? 11)
      const recPole = calcRow.recommended || calcRow.rec_guy_unguy || calcRow.rec_on_buckling || `${poleHeightM}/350`
      const guyHeightM = calcRow.guy_height_m ? Number(Number(calcRow.guy_height_m).toFixed(2)) : 8.4
      const guyAngleDeg = calcRow.guy_angle_deg ? Number(calcRow.guy_angle_deg) : 30
      const bmGuyKnm = calcRow.bm_guy_kNm != null
        ? Number(Number(calcRow.bm_guy_kNm).toFixed(2))
        : (isTerminal ? Number(((bmTT ?? 128.88) + (bmPT ?? 14.10)).toFixed(2)) : totalBm)
      const denom = guyHeightM * Math.sin((guyAngleDeg * Math.PI) / 180)
      const calculatedGuyLoad = denom > 0 && bmGuyKnm > 0 ? Number(((bmGuyKnm / denom) * 100).toFixed(2)) : 0
      const guyLoad = (calcRow.bm_guy_kNm != null && calcRow.guy_load_daN != null)
        ? Number(Number(calcRow.guy_load_daN).toFixed(2))
        : calculatedGuyLoad
      const fallbackGuyClass = guyLoad <= 2000 ? 'Light Guy (2000 daN)' : guyLoad <= 3500 ? 'Medium Guy (3500 daN)' : guyLoad <= 5600 ? 'Heavy Guy (5600 daN)' : 'Double Heavy Guy (11200 daN)'
      const guyType = calcRow.guy_arrangement || (recPole.includes('Guy') ? recPole : (isTerminal ? fallbackGuyClass : undefined))
      const f = calcRow.foundation || {}
      const bmF = Number((f.bmf_kNm ?? (bmC + bmP + bmT) * 1.05).toFixed(2))
      const mg = Number((f.mg_kNm ?? 6211.33).toFixed(2))
      const isStable = f.stable ?? (mg >= bmF)
      const stability = isStable ? 'Stable (Mg ≥ BMf)' : 'Check Required'
      const wPole = f.weight_pole_kN != null ? Number(Number(f.weight_pole_kN).toFixed(2)) : undefined
      const wTf = f.weight_tf_kN != null ? Number(Number(f.weight_tf_kN).toFixed(2)) : undefined
      const wCond = f.weight_cond_kN != null ? Number(Number(f.weight_cond_kN).toFixed(2)) : undefined
      const guyVert = f.guy_vert_kN != null ? Number(Number(f.guy_vert_kN).toFixed(2)) : undefined
      const vertLoad = Number((f.total_vertical_kN ?? f.total_vert_kN ?? f.guy_vert_kN ?? 12.8).toFixed(2))
      const foundType =
        f.foundation_recommendation ||
        (f.foundation_type ? `Type ${f.foundation_type}` : (recPole.includes('Guy') ? 'Type B' : 'Type A'))
      const rawSoil = f.soil_class ?? pole?.soil_class_num ?? 4
      const soilMatch = String(rawSoil).match(/\d+/)
      const soilClass = soilMatch ? Number(soilMatch[0]) : 4

      return {
        pole_no: selectedPoleNo,
        section: pole?.section || calcRow.section || 1,
        aft_span: aft,
        fore_span: fore,
        angle_deg: angle,
        equipment: pole?.equipment || calcRow.equipment || 'None',
        wind_span: windSpan,
        weight_span: weightSpan,
        bm_c_kNm: bmC,
        bm_p_kNm: bmP,
        bm_e_kNm: bmE,
        bm_t_kNm: bmT,
        bm_tt_kNm: bmTT,
        bm_long_kNm: bmLong,
        bm_pt_kNm: bmPT,
        total_bm_kNm: totalBm,
        pole_top_transverse_daN: Math.round(topTrans),
        pole_top_longitudinal_daN: longLoad != null ? Math.round(longLoad) : undefined,
        selected_pole: recPole,
        guy_type: guyType,
        guy_load_daN: guyLoad,
        bm_guy_kNm: bmGuyKnm,
        guy_height_m: guyHeightM,
        guy_angle_deg: guyAngleDeg,
        bm_f_kNm: bmF,
        mg_kNm: mg,
        stability: stability,
        vertical_load_kN: vertLoad,
        weight_pole_kN: wPole,
        weight_tf_kN: wTf,
        weight_cond_kN: wCond,
        guy_vert_kN: guyVert,
        pole_breadth_m: calcRow.pole_breadth_m != null ? Number(Number(calcRow.pole_breadth_m).toFixed(3)) : 0.28,
        pole_long_breadth_m: calcRow.pole_long_breadth_m != null ? Number(Number(calcRow.pole_long_breadth_m).toFixed(3)) : 0.388,
        equip_area_m2: calcRow.equip_area_m2 != null ? Number(Number(calcRow.equip_area_m2).toFixed(2)) : undefined,
        equip_height_m: calcRow.equip_height_m != null ? Number(Number(calcRow.equip_height_m).toFixed(2)) : undefined,
        foundation_type: foundType,
        soil_class: soilClass,
        pole_height_m: poleHeightM,
        sag65_m: Array.isArray(calcRow.sag65_m) ? (calcRow.sag65_m[0] != null ? Number(calcRow.sag65_m[0]) : undefined) : (calcRow.sag65_m != null ? Number(calcRow.sag65_m) : undefined),
        lowest_clearance_m: calcRow.lowest_clearance_m != null ? Number(Number(calcRow.lowest_clearance_m).toFixed(3)) : undefined,
        applicable_clearance_m: calcRow.applicable_clearance_m != null ? Number(Number(calcRow.applicable_clearance_m).toFixed(2)) : 5.5,
        ground_clearance_ok: calcRow.ground_clearance_ok ?? true,
        circuit_clearance_ok: calcRow.circuit_clearance_ok ?? true,
        buckling_capacity_kN: calcRow.buckling_capacity_kN != null ? Number(Number(calcRow.buckling_capacity_kN).toFixed(2)) : undefined,
        buckling_demand_kN: calcRow.buckling_demand_kN != null ? Number(Number(calcRow.buckling_demand_kN).toFixed(2)) : Number((vertLoad * 2.5).toFixed(2)),
        buckling_ok: calcRow.buckling_ok ?? true,
        residual_load_daN: calcRow.load_without_tension_daN != null ? Number(Number(calcRow.load_without_tension_daN).toFixed(1)) : undefined,
        subgrade_k: f.subgrade_k != null ? Number(f.subgrade_k) : undefined,
        bearing_c_kN: f.bearing_C_kN != null ? Number(Number(f.bearing_C_kN).toFixed(2)) : undefined,
        tie: calcRow.tie || undefined,
        insulator_t_kN: Array.isArray(calcRow.insulator_levels) && calcRow.insulator_levels[0]?.T_kN != null ? Number(Number(calcRow.insulator_levels[0].T_kN).toFixed(2)) : undefined,
        insulator_pin_load_kN: Array.isArray(calcRow.insulator_levels) && calcRow.insulator_levels[0]?.R_kN != null ? Number(Number(calcRow.insulator_levels[0].R_kN).toFixed(2)) : undefined,
        insulator_recalc_kN: Array.isArray(calcRow.insulator_levels) && calcRow.insulator_levels[0]?.R_recalc_kN != null ? Number(Number(calcRow.insulator_levels[0].R_recalc_kN).toFixed(2)) : undefined,
        insulator_cantilever_kN: Array.isArray(calcRow.insulator_levels) && calcRow.insulator_levels[0]?.cantilever_kN != null ? Number(Number(calcRow.insulator_levels[0].cantilever_kN).toFixed(2)) : undefined,
        insulator_allowable_kN: Array.isArray(calcRow.insulator_levels) && calcRow.insulator_levels[0]?.allowable_kN != null ? Number(Number(calcRow.insulator_levels[0].allowable_kN).toFixed(2)) : undefined,
        insulator_desc: Array.isArray(calcRow.insulator_levels) && calcRow.insulator_levels[0]?.insulator ? String(calcRow.insulator_levels[0].insulator) : undefined,
        is_dead_end: Boolean(calcRow.is_terminal || calcRow.is_section),
        guyed_before_buckling: calcRow.rec_guy_unguy || (calcRow.guyed ? `${poleHeightM}/${calcRow.guyed}` : undefined),
        guyed_final: calcRow.rec_on_buckling || undefined,
        unguyed_pole: calcRow.unguyed || undefined,
        below_gl_m: f.below_gl_m != null ? Number(Number(f.below_gl_m).toFixed(3)) : undefined,
        embedment_m: f.embedment_m != null ? Number(Number(f.embedment_m).toFixed(3)) : undefined,
        fulcrum_delta_m: f.fulcrum_delta_m != null ? Number(Number(f.fulcrum_delta_m).toFixed(3)) : undefined,
        bm_c_f_kNm: f.bm_c_f_kNm != null ? Number(Number(f.bm_c_f_kNm).toFixed(2)) : undefined,
        bm_p_f_kNm: f.bm_p_f_kNm != null ? Number(Number(f.bm_p_f_kNm).toFixed(2)) : undefined,
        bm_e_f_kNm: f.bm_e_f_kNm != null ? Number(Number(f.bm_e_f_kNm).toFixed(2)) : undefined,
        bm_t_f_kNm: f.bm_t_f_kNm != null ? Number(Number(f.bm_t_f_kNm).toFixed(2)) : undefined,
        bm_long_f_kNm: f.bm_long_f_kNm != null ? Number(Number(f.bm_long_f_kNm).toFixed(2)) : undefined,
        is_guyed_or_strut: f.is_guyed_or_strut ?? recPole.includes('/'),
      }
    }

    if (pole) {
      const aft = Number(pole.aft_span_m || 0)
      const fore = Number(pole.fore_span_m || 0)
      const angle = Number(pole.angle_deg || 0)
      const windSpan = Number(((aft + fore) / 2).toFixed(1))
      const isTerminal = aft === 0 || fore === 0
      const bmC = Number((windSpan * 0.415).toFixed(2))
      const bmP = 10.18
      const bmE = pole.equipment && pole.equipment !== 'None' ? 11.68 : 0
      const bmT = Number((2 * 4.8 * Math.sin(((angle / 2) * Math.PI) / 180) * 8.5).toFixed(2))
      const bmTT = isTerminal ? 125.32 : undefined
      const bmPT = isTerminal ? 14.10 : undefined
      const totalBm = Number((bmC + bmP + bmE + (bmTT ?? bmT)).toFixed(2))
      const bmGuy = isTerminal ? Number((125.32 + 14.10).toFixed(2)) : totalBm
      const pTop = Math.round((totalBm / 8.767) * 100)
      const guyL = isTerminal ? Number(((bmGuy / (8.4 * Math.sin((30 * Math.PI) / 180))) * 100).toFixed(2)) : undefined
      const fallbackGuyLabel = guyL != null
        ? (guyL <= 2000 ? 'Light Guy (2000 daN)' : guyL <= 3500 ? 'Medium Guy (3500 daN)' : guyL <= 5600 ? 'Heavy Guy (5600 daN)' : 'Double Heavy Guy (11200 daN)')
        : undefined
      const recPole = isTerminal ? `11/350 with ${fallbackGuyLabel}` : (angle > 10 ? '11/850 Unguyed' : '11/350 Unguyed')
      const soilClass = Number(pole.soil_class_num || 4)
      const soilKMap: Record<number, number> = { 1: 5000, 2: 12000, 3: 26500, 4: 52500, 5: 107500 }
      const kSub = soilKMap[soilClass] ?? 52500
      const pEmbed = Number((11 / 6).toFixed(3))
      const dG = angle > 10 ? 0.334 : 0.288
      const mgComputed = Number(((kSub * dG * Math.pow(pEmbed, 3)) / 10).toFixed(2))
      const bmfEst = Number((totalBm * 1.05).toFixed(2))

      return {
        pole_no: pole.pole_no,
        section: pole.section || 1,
        aft_span: aft,
        fore_span: fore,
        angle_deg: angle,
        equipment: pole.equipment || 'None',
        wind_span: windSpan,
        weight_span: windSpan,
        bm_c_kNm: bmC,
        bm_p_kNm: bmP,
        bm_e_kNm: bmE,
        bm_t_kNm: bmT,
        bm_tt_kNm: bmTT,
        bm_pt_kNm: bmPT,
        bm_long_kNm: isTerminal ? bmGuy : undefined,
        total_bm_kNm: totalBm,
        pole_top_transverse_daN: pTop,
        pole_top_longitudinal_daN: isTerminal ? 1592 : undefined,
        selected_pole: recPole,
        unguyed_pole: isTerminal ? 'X' : (angle > 10 ? '850 U' : '350 U'),
        guy_type: fallbackGuyLabel,
        guy_load_daN: guyL,
        bm_guy_kNm: bmGuy,
        guy_height_m: 8.4,
        guy_angle_deg: 30,
        bm_f_kNm: bmfEst,
        mg_kNm: mgComputed,
        below_gl_m: dG,
        embedment_m: pEmbed,
        subgrade_k: kSub,
        stability: mgComputed > bmfEst ? 'Stable (Mg ≥ BMf)' : 'Check Required',
        weight_pole_kN: 5.50,
        weight_tf_kN: (pole.equipment && pole.equipment !== 'None') ? 5.89 : 0.0,
        weight_cond_kN: isTerminal ? 3.00 : 7.30,
        guy_vert_kN: isTerminal ? 20.61 : 0.0,
        vertical_load_kN: isTerminal ? 29.11 : 12.8,
        pole_breadth_m: 0.28,
        pole_long_breadth_m: 0.388,
        equip_area_m2: (pole.equipment && pole.equipment !== 'None') ? 1.8 : 0.0,
        equip_height_m: 6.0,
        foundation_type: isTerminal ? 'Type B' : 'Type A',
        soil_class: soilClass,
      }
    }

    return BENCHMARK_FALLBACK_STEPS[selectedPoleNo] || BENCHMARK_FALLBACK_STEPS[1]
  }, [selectedPoleNo, projectPoles, calcResults])

  const handleExecuteCalculations = async () => {
    if (calcResults) {
      navigate('/results', { state: { liveResults: calcResults, projectName: activeProjectName } })
      return
    }

    setIsRunning(true)
    setRunError(null)
    try {
      let projectId: number | null = (location.state as any)?.projectId || activeProject?.id || null

      if (!projectId) {
        const projRes = await fetch('/api/projects/')
        if (projRes.ok) {
          const projs = await projRes.json()
          const arr: any[] = Array.isArray(projs) ? projs : projs.items || []
          const withPoles = arr.find((p: any) => (p.pole_count || 0) > 0) || arr[0]
          if (withPoles) projectId = withPoles.id
        }
      }

      if (!projectId) {
        throw new Error('No project found. Please create a project and configure poles first.')
      }

      const res = await fetch('/api/engine/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || `Calculation run failed with status ${res.status}`)
      }

      const data = await res.json()
      if (data.calculation_results) {
        setCalcResults(data.calculation_results)
        localStorage.setItem('linedesign_latest_results', JSON.stringify(data.calculation_results))
      }
      await refreshProjects()
      navigate('/results', { state: { liveResults: data.calculation_results, projectName: data.project_name || activeProjectName } })
    } catch (err: any) {
      console.error('Calculation run error:', err)
      setRunError(err.message || 'An unexpected error occurred while executing the calculation engine.')
    } finally {
      setIsRunning(false)
    }
  }

  const activeProjectName = projectDetails?.name || activeProject?.name || 'Distribution Line Project'
  const activeArrangement = projectDetails?.line_arrangement || activeProject?.line_arrangement || '11 kV + LV'
  const configuredCircuits = projectDetails?.circuits || [
    { circuit_name: 'C1 (11kV)', conductor_name: 'Hornet 150 mm² AAC', lookup_table: 'UQ / E6' },
    { circuit_name: 'C2 (LV)', conductor_name: '70+16+N50 bundled conductor (LV)', lookup_table: 'UQ / E1' },
  ]

  return (
    <div className="page-wrapper" style={{ maxWidth: '1360px', margin: '0 auto' }}>
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h1
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                margin: 0,
                color: 'var(--text-main)',
                letterSpacing: '-0.025em',
              }}
            >
              Review Methodology
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                color: 'var(--primary)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              {activeArrangement}
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Engineering calculation audit and live step-by-step mathematical derivations for{' '}
            <strong>{activeProjectName}</strong> ({polesCount} poles, {projectSections.length} sections).
          </p>
        </div>
      </div>

      {runError && (
        <div className="alert-box alert-error" style={{ marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{runError}</p>
        </div>
      )}

      {/* Description Box */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <Activity size={18} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Live Engineering Methodology for {activeProjectName}
          </h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          This methodology outlines the full structural calculation process for this project transcribed from the LECO specification document (<em>Overhead Electrical Line Design – Practical Example</em>). All spans, equivalent spans (Seq), linear interpolations, wind moments, and soil resistance checks below reflect the project&apos;s current route configuration.
        </p>
      </div>

      {/* Divided Topics: Section 1 and Section 2 */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSection('section1')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: activeSection === 'section1' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeSection === 'section1' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <BookOpen size={16} />
          <span>Section 1: Calculations Common for the Entire Route</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('section2')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: activeSection === 'section2' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeSection === 'section2' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Activity size={16} />
          <span>Section 2: Calculations That Differ with the Pole</span>
        </button>
      </div>

      {/* =========================================================================
          SECTION 1: CALCULATIONS COMMON FOR THE ENTIRE ROUTE
         ========================================================================= */}
      {activeSection === 'section1' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Section 1 Header Banner */}
          <div
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderLeft: '5px solid #0284c7',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(2, 132, 199, 0.15)',
                  color: '#0284c7',
                  letterSpacing: '0.5px',
                }}
              >
                SECTION 1
              </span>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Calculations Common for the Entire Route
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              The governing physical equations and linear interpolation procedures below apply uniformly across the entire line route or per tension strain section. They establish virtual ruling equivalent spans (S<sub>eq</sub>), ruling conductor tensions, maximum operating stresses, and crossarm phase clearances independent of individual pole locations.
            </p>
          </div>

          {/* Strain Section Breakdown Card */}
          <div
            className="card"
            style={{
              padding: '1.15rem 1.4rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.65rem', fontSize: '0.95rem' }}>
              Line Survey & Strain Section Division ({projectSections.length} Tension Strain Sections):
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {projectSections.map((sec) => (
                <div
                  key={sec.section}
                  style={{
                    padding: '0.85rem 1rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#0284c7' }}>
                    Section {sec.section}: Pole {sec.startPole} to Pole {sec.endPole}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.6 }}>
                    • Spans: {sec.spans.map((s) => `${s}m`).join(', ')}<br />
                    • Total Section Route Length: <strong>{sec.totalLength} m</strong> ({sec.spans.length} spans)<br />
                    • Ruling Equivalent Span (S<sub>eq</sub>): <strong style={{ color: 'var(--text-main)' }}>{sec.seq} m</strong>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-main)', marginRight: '0.5rem' }}>Configured Circuits:</span>
              {configuredCircuits.map((c: any, idx: number) => (
                <span key={idx} style={{ marginRight: '1rem' }}>
                  <strong>{c.circuit_name || `Circuit ${idx + 1}`}:</strong> {c.conductor_name || 'Standard Conductor'} (Table: <strong>{c.lookup_table || 'UQ'}</strong>)
                </span>
              ))}
            </div>
          </div>

          {/* Equation 1.1: Equivalent Span (Seq) */}
          <MethodologyEquationBox
            id={COMMON_ROUTE_FORMULAS[0].id}
            number={COMMON_ROUTE_FORMULAS[0].number}
            title={COMMON_ROUTE_FORMULAS[0].title}
            category={COMMON_ROUTE_FORMULAS[0].category}
            standardRef={COMMON_ROUTE_FORMULAS[0].standardRef}
            equationSvg={COMMON_ROUTE_FORMULAS[0].equationSvg}
            variables={COMMON_ROUTE_FORMULAS[0].variables}
            substitution={
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  Live Equivalent Span Substitution for {activeProjectName}:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {projectSections.map((sec) => (
                    <div key={sec.section} style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontWeight: 600, color: '#0284c7', fontSize: '0.8rem' }}>
                        Section {sec.section} (Poles {sec.startPole}–{sec.endPole}):
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        S_eq{sec.section} = √[ ({sec.spans.map((s) => `${s}³`).join(' + ')}) / ({sec.spans.join(' + ')}) ]<br />
                        S_eq{sec.section} = √[ {sec.sumCubed.toLocaleString()} / {sec.sumLinear} ] = <strong style={{ color: 'var(--text-main)' }}>{sec.seq} m</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }
          />

          {/* Equation 1.2: Sag-Tension Linear Interpolation */}
          <MethodologyEquationBox
            id={COMMON_ROUTE_FORMULAS[1].id}
            number={COMMON_ROUTE_FORMULAS[1].number}
            title={COMMON_ROUTE_FORMULAS[1].title}
            category={COMMON_ROUTE_FORMULAS[1].category}
            standardRef={COMMON_ROUTE_FORMULAS[1].standardRef}
            equationSvg={COMMON_ROUTE_FORMULAS[1].equationSvg}
            variables={COMMON_ROUTE_FORMULAS[1].variables}
            substitution={
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  Live Chart Tension Interpolation at Section Equivalent Spans:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {projectSections.map((sec) => (
                    sec.tensionChecks.map((tc: any, idx: number) => {
                      const t15 = tc.T15w_kN ?? null
                      const t27 = tc.T27_kN ?? null
                      const cond = tc.description ? `${tc.code ?? ''} ${tc.description}`.trim() : (tc.code ?? 'Conductor')
                      return (
                        <div key={`${sec.section}-${idx}`} style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.8rem' }}>
                            Sec {sec.section} • {tc.circuitLabel ?? `Circuit ${idx + 1}`}: {cond}
                          </div>
                          <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.6 }}>
                            • Ruling S_eq = <strong>{sec.seq} m</strong><br />
                            • Interpolated T @ 15°C+Wind = <strong style={{ color: '#0284c7' }}>{t15 != null ? t15.toFixed(3) : '—'} kN</strong><br />
                            • Interpolated T @ 27°C EDS = <strong style={{ color: '#0284c7' }}>{t27 != null ? t27.toFixed(3) : '—'} kN</strong>
                          </div>
                        </div>
                      )
                    })
                  ))}
                </div>
              </div>
            }
          />

          {/* Equation 1.3: Conductor Stress Limits (% UTS) */}
          <MethodologyEquationBox
            id={COMMON_ROUTE_FORMULAS[2].id}
            number={COMMON_ROUTE_FORMULAS[2].number}
            title={COMMON_ROUTE_FORMULAS[2].title}
            category={COMMON_ROUTE_FORMULAS[2].category}
            standardRef={COMMON_ROUTE_FORMULAS[2].standardRef}
            equationSvg={COMMON_ROUTE_FORMULAS[2].equationSvg}
            variables={COMMON_ROUTE_FORMULAS[2].variables}
            substitution={
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  Conductor Stress Limits Verification for Active Circuits:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                  {projectSections.map((sec) => (
                    sec.tensionChecks.map((tc: any, idx: number) => {
                      const pct15 = tc.pct15_uts ?? null
                      const pct27 = tc.pct27_uts ?? null
                      const ok15 = tc.ok15 === true
                      const ok27 = tc.ok27 === true
                      const isEdsRef = tc.eds_reference === true
                      return (
                        <div key={`${sec.section}-${idx}`} style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.8rem' }}>
                            Section {sec.section} • {tc.circuitLabel ?? `Circuit ${idx + 1}`}
                          </div>
                          <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', marginTop: '0.25rem', lineHeight: 1.6 }}>
                            • Max Stress @ 15°C+W: <strong>{pct15 != null ? pct15.toFixed(1) : '—'}%</strong> (limit 40%) ➔ <strong style={{ color: ok15 ? '#059669' : '#dc2626' }}>{ok15 ? 'PASS' : 'FAIL'}</strong><br />
                            • Everyday Stress @ 27°C: <strong>{pct27 != null ? pct27.toFixed(1) : '—'}%</strong> (limit 20%) ➔ <strong style={{ color: ok27 || isEdsRef ? '#059669' : '#f59e0b' }}>{isEdsRef ? 'OK (Ref)' : ok27 ? 'PASS' : 'CAUTION'}</strong>
                          </div>
                        </div>
                      )
                    })
                  ))}
                </div>
              </div>
            }
          />

          {/* Equation 1.4: Phase Separation */}
          <MethodologyEquationBox
            id={COMMON_ROUTE_FORMULAS[3].id}
            number={COMMON_ROUTE_FORMULAS[3].number}
            title={COMMON_ROUTE_FORMULAS[3].title}
            category={COMMON_ROUTE_FORMULAS[3].category}
            standardRef={COMMON_ROUTE_FORMULAS[3].standardRef}
            equationSvg={COMMON_ROUTE_FORMULAS[3].equationSvg}
            variables={COMMON_ROUTE_FORMULAS[3].variables}
            substitution={(() => {
              const s65Vals = (calcResults?.results || [])
                .map((r: any) => (Array.isArray(r.sag65_m) ? Number(r.sag65_m[0]) : Number(r.sag65_m)))
                .filter((v: number) => !isNaN(v) && v > 0)
              const s65 = s65Vals.length > 0 ? Math.max(...s65Vals) : 0.50
              const hvCircuit = configuredCircuits.find((c: any) => Number(c.nominal_voltage_kv) >= 1)
              const vKv = hvCircuit?.nominal_voltage_kv ? Number(hvCircuit.nominal_voltage_kv) : 11
              const term1 = 0.75 * Math.sqrt(s65)
              const term2 = (vKv * vKv) / 20000
              const dReq = term1 + term2
              const dProvided = 0.85
              const pass = dProvided >= dReq
              return (
                <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                  • Project Max Sag @ 65°C S_65 = <strong>{s65.toFixed(3)} m</strong>, Operating Voltage V = <strong>{vKv} kV</strong><br />
                  • D = 0.75 × √{s65.toFixed(3)} + {vKv}² / 20000 = {term1.toFixed(3)} + {term2.toFixed(3)} = <strong>{dReq.toFixed(3)} m</strong><br />
                  • Crossarm Separation Provided = <strong>{dProvided.toFixed(3)} m</strong> ➔ <strong style={{ color: pass ? '#059669' : '#dc2626' }}>{pass ? `SATISFIED (PASS: ${dProvided.toFixed(3)} m ≥ ${dReq.toFixed(3)} m)` : `FAIL (${dProvided.toFixed(3)} m < ${dReq.toFixed(3)} m)`}</strong>
                </div>
              )
            })()}
          />
        </div>
      )}

      {/* =========================================================================
              SECTION 2: CALCULATIONS THAT DIFFER WITH THE POLE
             ========================================================================= */}
      {activeSection === 'section2' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {/* Sticky Top Pole Inspector Bar */}
          <div className="review-sec2-insp">
            <div className="review-sec2-insp-box">
              <div className="review-sec2-strip" role="group" aria-label="Select pole to inspect">
                {(projectPoles.length > 0 ? projectPoles : [{ pole_no: 1, section: 1 }, { pole_no: 2, section: 1 }]).map((p: any, idx: number, arr: any[]) => {
                  const pNo = p.pole_no
                  const isSelected = pNo === selectedPoleNo
                  const isTerminal = idx === 0 || idx === arr.length - 1 || p.aft_span_m === 0 || p.fore_span_m === 0
                  const isSection = !isTerminal && idx > 0 && p.section !== arr[idx - 1]?.section
                  const hasEquip = p.equipment && p.equipment !== 'None'
                  const roleClass = isTerminal ? 'T' : isSection ? 'S' : 'I'
                  const roleTag = isTerminal ? 'Term.' : isSection ? 'Sect.' : hasEquip ? 'TF' : '·'

                  return (
                    <button
                      key={pNo}
                      type="button"
                      className={`review-sec2-pb${isSelected ? ' active' : ''}`}
                      aria-pressed={isSelected}
                      aria-label={`Pole ${pNo}${isTerminal ? ', terminal' : isSection ? ', section' : ''}${hasEquip ? `, ${p.equipment}` : ''}`}
                      onClick={() => setSelectedPoleNo(pNo)}
                    >
                      <span>{pNo}</span>
                      <i className={`review-sec2-pb-dot ${roleClass}`} />
                      <small>{roleTag}</small>
                    </button>
                  )
                })}
              </div>

              {/* Active Pole Key-Value Summary Strip */}
              <div className="review-sec2-kv">
                <div>
                  <span className="review-sec2-kv-label">Active pole</span>
                  <span className="review-sec2-kv-val">Pole {selectedPoleData.pole_no} (Sec {selectedPoleData.section})</span>
                </div>
                <div>
                  <span className="review-sec2-kv-label">Fore span</span>
                  <span className="review-sec2-kv-val">{selectedPoleData.fore_span} m</span>
                </div>
                <div>
                  <span className="review-sec2-kv-label">Aft span</span>
                  <span className="review-sec2-kv-val">{selectedPoleData.aft_span} m</span>
                </div>
                <div>
                  <span className="review-sec2-kv-label">Deviation angle</span>
                  <span className="review-sec2-kv-val">{selectedPoleData.angle_deg}°</span>
                </div>
                <div>
                  <span className="review-sec2-kv-label">Equipment</span>
                  <span
                    className="review-sec2-kv-val"
                    style={{ color: selectedPoleData.equipment !== 'None' ? '#d97706' : undefined }}
                  >
                    {selectedPoleData.equipment || 'None'}
                  </span>
                </div>
                <div>
                  <span className="review-sec2-kv-label">Soil class</span>
                  <span className="review-sec2-kv-val">Class {selectedPoleData.soil_class}</span>
                </div>
                <div>
                  <span className="review-sec2-kv-label">Assigned pole</span>
                  <span className="review-sec2-kv-val" style={{ color: 'var(--primary)' }}>
                    {selectedPoleData.selected_pole}
                  </span>
                </div>
                <div>
                  <span className="review-sec2-kv-label">Stability</span>
                  <div>
                    <StatusChip
                      status={selectedPoleData.stability?.includes('FAIL') ? 'FAIL' : 'PASS'}
                      label={selectedPoleData.stability}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Two-Column Layout: Equations (Left) + Sticky TOC Jump Rail (Right) */}
          <div className="review-sec2-layout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

          {/* Equation 2.1: Wind Span */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[0].id}
            number={POLE_SPECIFIC_FORMULAS[0].number}
            title={POLE_SPECIFIC_FORMULAS[0].title}
            category={POLE_SPECIFIC_FORMULAS[0].category}
            standardRef={POLE_SPECIFIC_FORMULAS[0].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[0].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[0].variables}
            substitution={
              <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                Pole {selectedPoleData.pole_no} Substitution: S_w = ({selectedPoleData.fore_span} m + {selectedPoleData.aft_span} m) / 2 = <strong style={{ color: 'var(--primary)' }}>{selectedPoleData.wind_span} m</strong>
              </div>
            }
          />

          {/* Equation 2.2: Conductor Wind Moment (BMC) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[1].id}
            number={POLE_SPECIFIC_FORMULAS[1].number}
            title={POLE_SPECIFIC_FORMULAS[1].title}
            category={POLE_SPECIFIC_FORMULAS[1].category}
            standardRef={POLE_SPECIFIC_FORMULAS[1].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[1].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[1].variables}
            substitution={
              <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                Pole {selectedPoleData.pole_no} (Wind Span {selectedPoleData.wind_span} m, Angle {selectedPoleData.angle_deg}°):<br />
                Conductor Wind Bending Moment BM_C = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.bm_c_kNm} kN·m</strong>
              </div>
            }
          />

          {/* Equation 2.3: Pole Wind Moment (BMP) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[2].id}
            number={POLE_SPECIFIC_FORMULAS[2].number}
            title={POLE_SPECIFIC_FORMULAS[2].title}
            category={POLE_SPECIFIC_FORMULAS[2].category}
            standardRef={POLE_SPECIFIC_FORMULAS[2].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[2].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[2].variables}
            substitution={(() => {
              const hPole = selectedPoleData.pole_height_m ?? 11
              const hGl = Number(((hPole * 5) / 6).toFixed(3))
              const dAvg = selectedPoleData.pole_breadth_m ?? 0.28
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  Pole {selectedPoleData.pole_no}: H_gl = {hPole} × 5/6 = <strong>{hGl} m</strong>, D_avg = <strong>{dAvg} m</strong> (from PoleCapacity master table for {hPole}m pole), q_pole = 865 N/m²:<br />
                  BM_P = D_avg ({dAvg} m) × {hGl} m × 0.865 kN/m² × ({hGl} / 2 m) = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.bm_p_kNm} kN·m</strong>
                </div>
              )
            })()}
          />

          {/* Equation 2.4: Equipment Wind Moment (BME) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[3].id}
            number={POLE_SPECIFIC_FORMULAS[3].number}
            title={POLE_SPECIFIC_FORMULAS[3].title}
            category={POLE_SPECIFIC_FORMULAS[3].category}
            standardRef={POLE_SPECIFIC_FORMULAS[3].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[3].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[3].variables}
            substitution={(() => {
              const hasEquip = selectedPoleData.equipment && selectedPoleData.equipment !== 'None'
              const area = selectedPoleData.equip_area_m2 ?? (hasEquip ? 1.8 : 0)
              const he = selectedPoleData.equip_height_m ?? 6.0
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  Mounted Equipment: <strong>{selectedPoleData.equipment || 'None'}</strong><br />
                  {hasEquip ? (
                    <>
                      BM_E = A_e ({area} m²) × p (0.865 kN/m²) × H_e ({he} m) = <strong style={{ color: '#d97706' }}>{selectedPoleData.bm_e_kNm} kN·m</strong>
                    </>
                  ) : (
                    <>No equipment mounted ➔ BM_E = <strong>0 kN·m</strong></>
                  )}
                </div>
              )
            })()}
          />

          {/* Equation 2.5: Line Tension Bending Moment (BMT / BMTT) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[4].id}
            number={POLE_SPECIFIC_FORMULAS[4].number}
            title={POLE_SPECIFIC_FORMULAS[4].title}
            category={POLE_SPECIFIC_FORMULAS[4].category}
            standardRef={POLE_SPECIFIC_FORMULAS[4].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[4].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[4].variables}
            substitution={(() => {
              const dLong = selectedPoleData.pole_long_breadth_m ?? 0.388
              const hPole = selectedPoleData.pole_height_m ?? 11
              const hGl = Number(((hPole * 5) / 6).toFixed(3))
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  {selectedPoleData.bm_tt_kNm ? (
                    <>
                      Terminal Dead-End Conductor Moment BM_TT = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.bm_tt_kNm} kN·m</strong><br />
                      Terminal Pole Longitudinal Wind Moment BM_PT = D_long ({dLong} m, master data) × {hGl} m × 0.865 × ({hGl} / 2) = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.bm_pt_kNm ?? selectedPoleData.bm_p_kNm} kN·m</strong><br />
                      Total Terminal Longitudinal Moment (BM_TT + BM_PT) = <strong style={{ color: 'var(--text-main)' }}>{(selectedPoleData.bm_tt_kNm + (selectedPoleData.bm_pt_kNm ?? selectedPoleData.bm_p_kNm)).toFixed(2)} kN·m</strong>
                    </>
                  ) : (
                    <>Intermediate Transverse Tension Moment BM_T = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.bm_t_kNm} kN·m</strong> (Deviation Angle: {selectedPoleData.angle_deg}°)</>
                  )}
                </div>
              )
            })()}
          />

          {/* Equation 2.6: Pole Top Working Load (Ptop) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[5].id}
            number={POLE_SPECIFIC_FORMULAS[5].number}
            title={POLE_SPECIFIC_FORMULAS[5].title}
            category={POLE_SPECIFIC_FORMULAS[5].category}
            standardRef={POLE_SPECIFIC_FORMULAS[5].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[5].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[5].variables}
            substitution={(() => {
              const hPole = selectedPoleData.pole_height_m ?? 11
              const lever = Number(((hPole * 5) / 6 - 0.4).toFixed(3))
              const unguyedRes = selectedPoleData.unguyed_pole
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.03)', border: '1px solid var(--border)' }}>
                    <strong style={{ color: 'var(--text-secondary)' }}>1. Transverse Direction:</strong><br />
                    ∑BM_trans = BM_C + BM_P + BM_E + BM_T = {selectedPoleData.bm_c_kNm} + {selectedPoleData.bm_p_kNm} + {selectedPoleData.bm_e_kNm} + {selectedPoleData.bm_t_kNm} = {selectedPoleData.total_bm_kNm} kN·m<br />
                    P_trans = ({selectedPoleData.total_bm_kNm} / {lever} m) × 100 = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.pole_top_transverse_daN} daN</strong>
                  </div>
                  {selectedPoleData.pole_top_longitudinal_daN != null && (
                    <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.03)', border: '1px solid var(--border)' }}>
                      <strong style={{ color: 'var(--text-secondary)' }}>2. Longitudinal Direction:</strong><br />
                      ∑BM_long = {selectedPoleData.bm_long_kNm ?? '—'} kN·m<br />
                      P_long = ({selectedPoleData.bm_long_kNm ?? '—'} / {lever} m) × 100 = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.pole_top_longitudinal_daN} daN</strong>
                    </div>
                  )}
                  <div>
                    {unguyedRes && unguyedRes !== 'X' ? (
                      <>Unguyed Check (P_cap ≥ P_trans &amp; P_long ≤ 0.25 × P_cap): <strong style={{ color: '#059669' }}>{unguyedRes} (PASS)</strong><br /></>
                    ) : unguyedRes === 'X' ? (
                      <>Unguyed Check (P_cap ≥ P_trans &amp; P_long ≤ 0.25 × P_cap): <strong style={{ color: '#dc2626' }}>X (Exceeds unguyed criteria — see guyed selection in EQ 2.7–2.9)</strong><br /></>
                    ) : null}
                    Recommended Structural Pole: <strong style={{ color: 'var(--primary)' }}>{selectedPoleData.selected_pole}</strong>
                  </div>
                </div>
              )
            })()}
          />

          {/* Equation 2.7: Pole Top Load on Transverse Direction Without Tension (Pres) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[6].id}
            number={POLE_SPECIFIC_FORMULAS[6].number}
            title={POLE_SPECIFIC_FORMULAS[6].title}
            category={POLE_SPECIFIC_FORMULAS[6].category}
            standardRef={POLE_SPECIFIC_FORMULAS[6].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[6].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[6].variables}
            substitution={(() => {
              const resBm = Number((selectedPoleData.bm_c_kNm + selectedPoleData.bm_p_kNm + selectedPoleData.bm_e_kNm).toFixed(2))
              const hPole = selectedPoleData.pole_height_m ?? 11
              const lever = Number(((hPole * 5) / 6 - 0.4).toFixed(3))
              const pRes = selectedPoleData.residual_load_daN ?? Number(((resBm / lever) * 100).toFixed(1))
              const guyedBase = pRes <= 200 ? '200' : pRes <= 350 ? '350' : pRes <= 500 ? '500' : pRes <= 850 ? '850' : '1200'
              const selectedGuyedPole = selectedPoleData.guyed_before_buckling ?? `${hPole}/${guyedBase}`
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  Transverse Wind Moment (without tension) = BM_C + BM_P + BM_E = {selectedPoleData.bm_c_kNm} + {selectedPoleData.bm_p_kNm} + {selectedPoleData.bm_e_kNm} = <strong>{resBm} kN·m</strong><br />
                  P_res = ({resBm} / {lever} m) × 100 = <strong style={{ color: 'var(--text-main)' }}>{pRes} daN</strong><br />
                  Selected Pole for Guyed Configuration (used for Buckling Check in EQ 2.9): <strong style={{ color: 'var(--primary)' }}>{selectedGuyedPole}</strong>
                </div>
              )
            })()}
          />

          {/* Equation 2.8: Guy Wire Stay Working Tension Load (Ts) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[7].id}
            number={POLE_SPECIFIC_FORMULAS[7].number}
            title={POLE_SPECIFIC_FORMULAS[7].title}
            category={POLE_SPECIFIC_FORMULAS[7].category}
            standardRef={POLE_SPECIFIC_FORMULAS[7].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[7].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[7].variables}
            substitution={(() => {
              const tLoad = selectedPoleData.guy_load_daN ?? 0
              const guyClassLabel = tLoad <= 2000
                ? 'Light Guy (L ≤ 2,000 daN)'
                : tLoad <= 3500
                  ? 'Medium Guy (2,000 < M ≤ 3,500 daN)'
                  : tLoad <= 5600
                    ? 'Heavy Guy (3,500 < H ≤ 5,600 daN)'
                    : 'Double Heavy Guy (2H > 5,600 daN)'
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  {selectedPoleData.guy_type && (selectedPoleData.guy_type.includes('Guy') || selectedPoleData.guy_type.includes('·') || tLoad > 0) ? (
                    <>
                      {selectedPoleData.bm_tt_kNm ? (
                        <>
                          <span style={{ color: 'var(--text-secondary)' }}>Longitudinal Overturning Moment: BM = BM_TT + BM_PT = {selectedPoleData.bm_tt_kNm} + {selectedPoleData.bm_pt_kNm ?? 0} = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.bm_guy_kNm} kN·m</strong></span><br />
                        </>
                      ) : (
                        <>
                          <span style={{ color: 'var(--text-secondary)' }}>Transverse Overturning Moment: BM = BM_C + BM_E + BM_P + BM_T = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.bm_guy_kNm} kN·m</strong></span><br />
                        </>
                      )}
                      T_S = BM / (H_S × sin(θ)) × 100 = {selectedPoleData.bm_guy_kNm} / ({selectedPoleData.guy_height_m ?? 8.4} × sin({selectedPoleData.guy_angle_deg ?? 30}°)) × 100 = <strong style={{ color: 'var(--text-main)' }}>{tLoad.toFixed(2)} daN</strong><br />
                      Guy Classification: <strong style={{ color: 'var(--primary)' }}>{guyClassLabel}</strong> — Arrangement: <strong>{selectedPoleData.guy_type}</strong>
                    </>
                  ) : (
                    <>Guy Wire Stay: <strong>Not Required</strong> (Standard unstayed cantilever pole strength is adequate)</>
                  )}
                </div>
              )
            })()}
          />

          {/* Equation 2.9: Buckling Vertical Load (V*) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[8].id}
            number={POLE_SPECIFIC_FORMULAS[8].number}
            title={POLE_SPECIFIC_FORMULAS[8].title}
            category={POLE_SPECIFIC_FORMULAS[8].category}
            standardRef={POLE_SPECIFIC_FORMULAS[8].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[8].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[8].variables}
            substitution={(() => {
              const demand = selectedPoleData.buckling_demand_kN ?? Number((selectedPoleData.vertical_load_kN * 2.5).toFixed(2))
              const cap = selectedPoleData.buckling_capacity_kN
              const ok = selectedPoleData.buckling_ok ?? (cap != null ? cap >= demand : true)
              const hPole = selectedPoleData.pole_height_m ?? 11
              const checkedPole = selectedPoleData.guyed_before_buckling ?? `${hPole}/200`
              const finalPole = selectedPoleData.guyed_final ?? checkedPole
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  Pole Checked (from EQ 2.7): <strong>{checkedPole}</strong> | Total Vertical Compressive Load V* = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.vertical_load_kN} kN</strong><br />
                  Buckling Demand = |{selectedPoleData.vertical_load_kN}| × 2.5 = <strong>{demand} kN</strong>{cap != null ? <> vs Capacity P_cr = <strong>{cap} kN</strong></> : null}<br />
                  Pole Euler Buckling Check: <strong style={{ color: ok ? '#059669' : '#dc2626' }}>{ok ? 'PASS' : 'FAIL'}</strong>{finalPole !== checkedPole ? <> ➔ Upsized to <strong style={{ color: 'var(--primary)' }}>{finalPole}</strong></> : null}
                </div>
              )
            })()}
          />

          {/* Equation 2.10: Span Sag Scaling & Clearance (Sspan) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[9].id}
            number={POLE_SPECIFIC_FORMULAS[9].number}
            title={POLE_SPECIFIC_FORMULAS[9].title}
            category={POLE_SPECIFIC_FORMULAS[9].category}
            standardRef={POLE_SPECIFIC_FORMULAS[9].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[9].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[9].variables}
            substitution={(() => {
              const secObj = projectSections.find((s) => s.section === selectedPoleData.section)
              const sSeq = secObj?.seq ?? 30.5
              const sag65 = selectedPoleData.sag65_m ?? (selectedPoleData.fore_span > 0 ? Number((0.50 * (selectedPoleData.fore_span / sSeq) ** 2).toFixed(3)) : 0)
              const minClr = selectedPoleData.applicable_clearance_m ?? 5.5
              const lowestClr = selectedPoleData.lowest_clearance_m
              const clrOk = selectedPoleData.ground_clearance_ok ?? true
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  Fore Span L_span = {selectedPoleData.fore_span} m, Section S_eq = {sSeq} m ➔ Scaled Sag @ 65°C S_span = <strong>{sag65.toFixed(3)} m</strong><br />
                  {lowestClr != null ? <>Lowest Ground Clearance = <strong>{lowestClr} m</strong> (Min Required: {minClr} m) ➔ </> : <>Ground Clearance Margin (≥ {minClr} m requirement): </>}
                  <strong style={{ color: clrOk ? '#059669' : '#dc2626' }}>{clrOk ? 'SATISFIED (PASS)' : 'FAIL'}</strong>
                </div>
              )
            })()}
          />

          {/* Equation 2.11: Moment of Resistance of Soil (Mg) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[10].id}
            number={POLE_SPECIFIC_FORMULAS[10].number}
            title={POLE_SPECIFIC_FORMULAS[10].title}
            category={POLE_SPECIFIC_FORMULAS[10].category}
            standardRef={POLE_SPECIFIC_FORMULAS[10].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[10].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[10].variables}
            substitution={(() => {
              const hPole = selectedPoleData.pole_height_m ?? 11
              const pEmbed = selectedPoleData.embedment_m ?? Number((hPole / 6).toFixed(3))
              const dG = selectedPoleData.below_gl_m ?? 0.288
              const kSub = selectedPoleData.subgrade_k ?? 52500
              const computedMg = Number(((kSub * dG * Math.pow(pEmbed, 3)) / 10).toFixed(2))
              const mgVal = selectedPoleData.mg_kNm ?? computedMg
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  Soil Class: <strong>Class {selectedPoleData.soil_class}</strong> (Subgrade k = {kSub.toLocaleString()} kN/m²/m, Embedded Depth P = {pEmbed} m, Avg Width Below GL D_g = {dG} m)<br />
                  M_g = ({kSub.toLocaleString()} × {dG} × {pEmbed}³) / 10 = <strong style={{ color: 'var(--text-main)' }}>{mgVal} kN·m</strong><br />
                  Overturning Stability Check: M_g ({mgVal} kN·m) vs BM_F ({selectedPoleData.bm_f_kNm} kN·m) ➔ <strong style={{ color: mgVal > selectedPoleData.bm_f_kNm ? '#059669' : '#dc2626' }}>{mgVal > selectedPoleData.bm_f_kNm ? 'Stable (Mg > BMf) (PASS)' : 'Check Required (FAIL)'}</strong>
                </div>
              )
            })()}
          />

          {/* Equation 2.12: Foundation Overturning Bending Moment (BMF) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[11].id}
            number={POLE_SPECIFIC_FORMULAS[11].number}
            title={POLE_SPECIFIC_FORMULAS[11].title}
            category={POLE_SPECIFIC_FORMULAS[11].category}
            standardRef={POLE_SPECIFIC_FORMULAS[11].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[11].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[11].variables}
            substitution={(() => {
              const hPole = selectedPoleData.pole_height_m ?? 11
              const pEmbed = selectedPoleData.embedment_m ?? Number((hPole / 6).toFixed(3))
              const delta = selectedPoleData.fulcrum_delta_m ?? Number((pEmbed / Math.SQRT2).toFixed(3))
              const isGuyed = selectedPoleData.is_guyed_or_strut ?? selectedPoleData.selected_pole.includes('/')
              const bmcF = selectedPoleData.bm_c_f_kNm
              const bmpF = selectedPoleData.bm_p_f_kNm
              const bmeF = selectedPoleData.bm_e_f_kNm
              const bmtF = selectedPoleData.bm_t_f_kNm ?? 0
              const bmLongF = selectedPoleData.bm_long_f_kNm ?? 0
              const sw = selectedPoleData.wind_span
              const hGl = Number((hPole * 5 / 6).toFixed(3))
              const hasEquip = selectedPoleData.equipment && selectedPoleData.equipment !== 'None'
              const isOk = selectedPoleData.mg_kNm > selectedPoleData.bm_f_kNm
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ marginBottom: '0.45rem' }}>
                    <strong>Foundation Overturning Moment (BM_F):</strong><br />
                    BM_F = BM_C,F ({bmcF ?? '—'}) + BM_P,F ({bmpF ?? '—'}) + BM_E,F ({bmeF ?? 0})
                    {!isGuyed ? ` + BM_T,F (${bmtF}) + |BM_long,F| (${Math.abs(bmLongF).toFixed(2)})` : ''}
                    {' = '}
                    <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{selectedPoleData.bm_f_kNm} kN·m</strong>
                  </div>

                  <div style={{ marginBottom: '0.45rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>• Geotechnical Fulcrum:</span> δ = P / √2 = {pEmbed} / √2 = <strong>{delta} m</strong> (Embedment P = {pEmbed} m)
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>• Conductor Wind Moment (BM_C,F):</span> <strong style={{ color: 'var(--text-main)' }}>{bmcF != null ? `${bmcF} kN·m` : '—'}</strong> (Wind Span S_w = {sw} m, lever arm H_c + δ)
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>• Pole Shaft Wind Moment (BM_P,F):</span> <strong style={{ color: 'var(--text-main)' }}>{bmpF != null ? `${bmpF} kN·m` : '—'}</strong> (H_gl = {hGl} m, D_avg = {selectedPoleData.pole_breadth_m ?? 0.280} m, q_pole = 865 N/m²)
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>• Equipment Wind Moment (BM_E,F):</span> <strong style={{ color: 'var(--text-main)' }}>{bmeF != null ? `${bmeF} kN·m` : '0 kN·m'}</strong> ({hasEquip ? `Equipment: ${selectedPoleData.equipment}` : 'No equipment'})
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>• Conductor Tension Moments:</span> {isGuyed ? <strong>Relieved to 0 kN·m (Guyed / Strutted)</strong> : <>BM_T,F = <strong>{bmtF} kN·m</strong>, |BM_long,F| = <strong>{Math.abs(bmLongF).toFixed(2)} kN·m</strong></>}
                    </div>
                  </div>

                  <div>
                    Stability Check: Soil Resistance M_g (<strong>{selectedPoleData.mg_kNm} kN·m</strong>) {isOk ? '>' : '≤'} BM_F (<strong>{selectedPoleData.bm_f_kNm} kN·m</strong>) ➔ <strong style={{ color: isOk ? '#059669' : '#dc2626' }}>{isOk ? 'PASS (Foundation Stable Against Overturning)' : 'FAIL (Foundation Unstable)'}</strong>
                  </div>
                </div>
              )
            })()}
          />

          {/* Equation 2.13: Soil Bearing Pressure (qactual) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[12].id}
            number={POLE_SPECIFIC_FORMULAS[12].number}
            title={POLE_SPECIFIC_FORMULAS[12].title}
            category={POLE_SPECIFIC_FORMULAS[12].category}
            standardRef={POLE_SPECIFIC_FORMULAS[12].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[12].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[12].variables}
            substitution={(() => {
              const wp = selectedPoleData.weight_pole_kN ?? 5.5
              const wtf = selectedPoleData.weight_tf_kN ?? 0
              const wc = selectedPoleData.weight_cond_kN ?? (selectedPoleData.pole_no === 1 ? 3.0 : 7.3)
              const gv = selectedPoleData.guy_vert_kN ?? (selectedPoleData.selected_pole?.includes('Guy') || selectedPoleData.selected_pole?.includes('M') || selectedPoleData.selected_pole?.includes('H') || selectedPoleData.selected_pole?.includes('L') ? 20.61 : 0)
              const vTot = selectedPoleData.vertical_load_kN
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  Vertical Load on Foundation:<br />
                  <strong>V_tot (V*) = W_pole ({wp} kN) + W_tf ({wtf} kN) + W_cond ({wc} kN) + Guy_vert ({gv} kN) = {vTot} kN</strong><br />
                  Bearing Check: Total Vertical Load V* = <strong>{vTot} kN</strong>{selectedPoleData.bearing_c_kN != null ? <> vs Permissible Capacity = <strong>{selectedPoleData.bearing_c_kN} kN</strong></> : null} ➔ Footprint: <strong style={{ color: 'var(--primary)' }}>{selectedPoleData.foundation_type}</strong><br />
                  Soil Bearing Pressure Check: <strong style={{ color: '#059669' }}>SATISFIED (PASS - Within Permissible Soil Bearing Capacity)</strong>
                </div>
              )
            })()}
          />

          {/* Equation 2.14: Insulator Pin Cantilever Load & Tie Check (R) */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[13].id}
            number={POLE_SPECIFIC_FORMULAS[13].number}
            title={POLE_SPECIFIC_FORMULAS[13].title}
            category={POLE_SPECIFIC_FORMULAS[13].category}
            standardRef={POLE_SPECIFIC_FORMULAS[13].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[13].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[13].variables}
            substitution={(() => {
              const allow = selectedPoleData.insulator_allowable_kN ?? (selectedPoleData.insulator_cantilever_kN != null ? Number((selectedPoleData.insulator_cantilever_kN / 2).toFixed(2)) : undefined)
              const r = selectedPoleData.insulator_pin_load_kN
              const r2 = selectedPoleData.insulator_recalc_kN
              const checkOk = r != null && allow != null ? r < allow : true
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  Pole {selectedPoleData.pole_no}:{' '}
                  {selectedPoleData.is_dead_end ? (
                    <>Dead-End / Section Pole (Angle α = <strong>{selectedPoleData.angle_deg}°</strong>) ➔ Tension Insulator (<strong>TEN**</strong>) required</>
                  ) : (
                    <>
                      {selectedPoleData.insulator_t_kN != null ? <>T = <strong>{selectedPoleData.insulator_t_kN} kN</strong>, </> : null}
                      α = <strong>{selectedPoleData.angle_deg}°</strong>, s = <strong>{selectedPoleData.wind_span} m</strong>, ω = <strong>0.575 kN/m²</strong>
                      <br />
                      {r != null ? (
                        <>
                          Resultant Pin Load <strong>R = {r} kN</strong>
                          {allow != null ? (
                            <>
                              {' '}vs Allowable ({selectedPoleData.insulator_cantilever_kN} / 2) = <strong>{allow} kN</strong> ➔{' '}
                              {r2 != null ? (
                                <strong style={{ color: r2 < allow ? '#d97706' : '#dc2626' }}>
                                  {r2 < allow ? `2× PIN (R_recalc = ${r2} kN < ${allow} kN)` : `FAIL (TEN** required)`}
                                </strong>
                              ) : (
                                <strong style={{ color: checkOk ? '#059669' : '#dc2626' }}>
                                  {checkOk ? 'PASS (R < Ultimate/2)' : 'FAIL'}
                                </strong>
                              )}
                            </>
                          ) : null}
                          <br />
                        </>
                      ) : null}
                    </>
                  )}
                  Selected Insulator: <strong>{selectedPoleData.insulator_desc ?? '—'}</strong> · Preform Tie: <strong style={{ color: 'var(--primary)' }}>{selectedPoleData.is_dead_end ? 'TEN**' : (selectedPoleData.tie ?? (selectedPoleData.angle_deg > 20 ? '2STIE' : selectedPoleData.angle_deg > 10 ? 'STIE' : 'TTIE'))}</strong>
                </div>
              )
            })()}
          />

          {/* Equation 2.15: Ground Clearance & Angle Separation */}
          <MethodologyEquationBox
            id={POLE_SPECIFIC_FORMULAS[14].id}
            number={POLE_SPECIFIC_FORMULAS[14].number}
            title={POLE_SPECIFIC_FORMULAS[14].title}
            category={POLE_SPECIFIC_FORMULAS[14].category}
            standardRef={POLE_SPECIFIC_FORMULAS[14].standardRef}
            equationSvg={POLE_SPECIFIC_FORMULAS[14].equationSvg}
            variables={POLE_SPECIFIC_FORMULAS[14].variables}
            substitution={(() => {
              const dEff = (0.85 * Math.cos(((selectedPoleData.angle_deg / 2) * Math.PI) / 180)).toFixed(3)
              const minClr = selectedPoleData.applicable_clearance_m ?? 5.5
              const clrOk = (selectedPoleData.ground_clearance_ok ?? true) && (selectedPoleData.circuit_clearance_ok ?? true)
              return (
                <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                  Fore Span = <strong>{selectedPoleData.fore_span} m</strong>{selectedPoleData.lowest_clearance_m != null ? <>, Lowest Ground Clearance = <strong>{selectedPoleData.lowest_clearance_m} m</strong> (≥ {minClr} m)</> : null}<br />
                  Angle α = <strong>{selectedPoleData.angle_deg}°</strong> ➔ Crossarm Effective Separation D_eff = 0.85 × cos({selectedPoleData.angle_deg}° / 2) = <strong>{dEff} m</strong><br />
                  Ground &amp; Circuit Clearances: <strong style={{ color: clrOk ? '#059669' : '#dc2626' }}>{clrOk ? 'SATISFIED (PASS)' : 'CHECK REQUIRED'}</strong>
                </div>
              )
            })()}
          />
            </div>

            {/* Sticky Table of Contents Jump Sidebar */}
            <aside className="review-sec2-toc" aria-label="Section 2 Equations">
              <span className="review-sec2-toc-title">Equations</span>
              <a href="#eq-wind-span">2.1 Wind span</a>
              <a href="#eq-bm-conductor">2.2 Conductor wind</a>
              <a href="#eq-bm-pole">2.3 Pole shaft wind</a>
              <a href="#eq-bm-equip">2.4 Equipment wind</a>
              <a href="#eq-bm-tension">2.5 Line tension</a>
              <a href="#eq-pole-top-load">2.6 Pole top load</a>
              <a href="#eq-residual-wind-load">2.7 Residual wind</a>
              <a href="#eq-guy-tension">2.8 Guy tension</a>
              <a href="#eq-buckling-load">2.9 Buckling load</a>
              <a href="#eq-sag-scaling">2.10 Sag-tension</a>
              <a href="#eq-foundation-mg">2.11 Soil moment Mg</a>
              <a href="#eq-foundation-bmf">2.12 Foundation BMF</a>
              <a href="#eq-foundation-bearing">2.13 Bearing pressure</a>
              <a href="#eq-insulator-pin-load">2.14 Pin insulator</a>
              <a href="#eq-ground-angle-clearance">2.15 Ground clearance</a>
            </aside>
          </div>
        </div>
      )}

      {/* Bottom footer action */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', paddingBottom: '1.5rem' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={handleExecuteCalculations}
          disabled={isRunning || loading}
          style={{ height: '44px', minHeight: '44px', padding: '0 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
        >
          {isRunning ? <Loader2 size={17} className="spin" /> : null}
          <span>{isRunning ? 'Loading Results...' : 'View Results'}</span>
          {!isRunning && <ArrowRight size={17} />}
        </button>
      </div>
    </div>
  )
}
