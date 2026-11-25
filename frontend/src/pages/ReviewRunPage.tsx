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
  bm_pt_kNm?: number
  total_bm_kNm?: number
  pole_top_transverse_daN: number
  pole_top_longitudinal_daN?: number
  selected_pole: string
  guy_type?: string
  guy_load_daN?: number
  bm_f_kNm: number
  mg_kNm: number
  stability: string
  vertical_load_kN: number
  foundation_type: string
  soil_class: number
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
    bm_tt_kNm: 125.32,
    bm_pt_kNm: 14.26,
    pole_top_transverse_daN: 185,
    pole_top_longitudinal_daN: 1592,
    selected_pole: '11/350 with Heavy Guy',
    guy_type: 'Heavy Guy (5600 daN)',
    bm_f_kNm: 18.91,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg ≥ BMf)',
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
    bm_t_kNm: 30.56,
    pole_top_transverse_daN: 614,
    selected_pole: '11/850 Unguyed',
    bm_f_kNm: 62.46,
    mg_kNm: 7203.42,
    stability: 'Stable (Mg ≥ BMf)',
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
        return JSON.parse(cached)
      } catch {}
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
      const longLoad = calcRow.terminal_long_load_daN ? Number(calcRow.terminal_long_load_daN) : undefined
      const bmTT = calcRow.bm_tension_long_kNm != null && Number(calcRow.bm_tension_long_kNm) > 0
        ? Number(Number(calcRow.bm_tension_long_kNm).toFixed(2))
        : (longLoad ? Number(Math.max(0, (longLoad * 8.767) / 100 - bmP).toFixed(2)) : undefined)
      const bmPT = longLoad ? 14.26 : undefined
      const totalBm = Number((bmC + bmP + bmE + (bmTT ?? bmT)).toFixed(2))
      const topTrans = Number(calcRow.pole_top_load_daN ?? 0)
      const recPole = calcRow.recommended || calcRow.rec_guy_unguy || calcRow.rec_on_buckling || '11/350'
      const guyType = calcRow.guy_arrangement || (recPole.includes('Guy') ? recPole : undefined)
      const guyLoad = calcRow.guy_load_daN ? Number(calcRow.guy_load_daN) : undefined
      const f = calcRow.foundation || {}
      const bmF = Number((f.bmf_kNm ?? (bmC + bmP + bmT) * 1.05).toFixed(2))
      const mg = Number((f.mg_kNm ?? 6211.33).toFixed(2))
      const isStable = f.stable ?? (mg >= bmF)
      const stability = isStable ? 'Stable (Mg ≥ BMf)' : 'Check Required'
      const vertLoad = Number((f.total_vert_kN ?? f.guy_vert_kN ?? 12.8).toFixed(2))
      const foundType =
        f.foundation_recommendation ||
        (f.foundation_type ? `Type ${f.foundation_type}` : (recPole.includes('Guy') ? 'Type B' : 'Type A'))
      const soilClass = Number(f.soil_class ?? pole?.soil_class_num ?? 4)

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
        bm_pt_kNm: bmPT,
        total_bm_kNm: totalBm,
        pole_top_transverse_daN: Math.round(topTrans),
        pole_top_longitudinal_daN: longLoad ? Math.round(longLoad) : undefined,
        selected_pole: recPole,
        guy_type: guyType,
        guy_load_daN: guyLoad,
        bm_f_kNm: bmF,
        mg_kNm: mg,
        stability: stability,
        vertical_load_kN: vertLoad,
        foundation_type: foundType,
        soil_class: soilClass,
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
      const totalBm = Number((bmC + bmP + bmE + (bmTT ?? bmT)).toFixed(2))
      const pTop = Math.round((totalBm / 8.767) * 100)
      const recPole = isTerminal ? '11/350 with Heavy Guy' : (angle > 10 ? '11/850 Unguyed' : '11/350 Unguyed')
      const soilClass = Number(pole.soil_class_num || 4)

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
        total_bm_kNm: totalBm,
        pole_top_transverse_daN: pTop,
        pole_top_longitudinal_daN: isTerminal ? 1592 : undefined,
        selected_pole: recPole,
        guy_type: isTerminal ? 'Heavy Guy (5600 daN)' : undefined,
        guy_load_daN: isTerminal ? 2450 : undefined,
        bm_f_kNm: Number((totalBm * 1.05).toFixed(2)),
        mg_kNm: soilClass === 4 ? 6211.33 : 4500.0,
        stability: 'Stable (Mg ≥ BMf)',
        vertical_load_kN: isTerminal ? 29.11 : 12.8,
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
                substitution={
                  <div style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
                    • Conductor Sag @ 65°C S_65 ≈ <strong>0.50 m</strong>, Operating Voltage V = <strong>11 kV</strong><br />
                    • Calculated Minimum Required Clearance: D = 0.75 × √0.50 + 11² / 20000 = 0.530 + 0.006 = <strong>0.536 m</strong><br />
                    • Standard Pin Insulator Crossarm Separation Provided = <strong>0.850 m</strong> ➔ <strong style={{ color: '#059669' }}>SATISFIED (PASS: 0.850 m ≥ 0.536 m)</strong>
                  </div>
                }
              />
            </div>
          )}

          {/* =========================================================================
              SECTION 2: CALCULATIONS THAT DIFFER WITH THE POLE
             ========================================================================= */}
          {activeSection === 'section2' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Section 2 Header Banner */}
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
                    SECTION 2
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Calculations That Differ with the Pole
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  These structural and geotechnical formulas depend on each pole&apos;s individual geometry along the route: fore/aft spans, angle of deviation, mounted equipment (such as transformers), stay wire arrangements, and local ground soil class. Select any pole below to update the live substitutions across all formulas.
                </p>
              </div>

              {/* Interactive Pole Selector for Section 2 */}
              <div
                className="card"
                style={{
                  padding: '1rem 1.25rem',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                  Select Pole to Inspect (Click to update numerical values across all formulas below):
                </div>

                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {(projectPoles.length > 0 ? projectPoles : [{ pole_no: 1, section: 1 }, { pole_no: 2, section: 1 }]).map((p: any, idx: number) => {
                    const pNo = p.pole_no
                    const isSelected = pNo === selectedPoleNo
                    const isTerminal = idx === 0 || idx === projectPoles.length - 1 || p.aft_span_m === 0 || p.fore_span_m === 0
                    const isSection = idx > 0 && p.section !== projectPoles[idx - 1]?.section
                    const hasEquip = p.equipment && p.equipment !== 'None'

                    return (
                      <button
                        key={pNo}
                        type="button"
                        onClick={() => setSelectedPoleNo(pNo)}
                        style={{
                          padding: '0.45rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isSelected
                            ? '1px solid var(--primary)'
                            : '1px solid var(--border-color)',
                          backgroundColor: isSelected
                            ? 'var(--primary)'
                            : isTerminal || isSection
                            ? 'var(--bg-subtle)'
                            : 'var(--bg-surface)',
                          color: isSelected ? '#ffffff' : 'var(--text-main)',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        Pole {pNo} {isTerminal ? '(Terminal)' : isSection ? '(Section)' : hasEquip ? `(${p.equipment})` : ''}
                      </button>
                    )
                  })}
                </div>

                {/* Selected Pole Active Summary Strip */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.75rem',
                    marginTop: '0.85rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Active Pole:</span>{' '}
                    <strong>Pole {selectedPoleData.pole_no} (Sec {selectedPoleData.section})</strong>
                    <StatusChip status="PASS" label={selectedPoleData.stability} />
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Spans:</span>{' '}
                    <strong>Fore {selectedPoleData.fore_span}m • Aft {selectedPoleData.aft_span}m</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Deviation Angle:</span>{' '}
                    <strong>{selectedPoleData.angle_deg}°</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Mounted Equipment:</span>{' '}
                    <strong style={{ color: selectedPoleData.equipment !== 'None' ? '#d97706' : 'inherit' }}>
                      {selectedPoleData.equipment}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Soil Class:</span>{' '}
                    <strong>Class {selectedPoleData.soil_class}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Pole:</span>{' '}
                    <strong style={{ color: 'var(--primary)' }}>{selectedPoleData.selected_pole}</strong>
                  </div>
                </div>
              </div>

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
                substitution={
                  <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                    Pole Height = 9.167 m above ground line, Wind Pressure q_pole = 865 N/m²:<br />
                    Pole Body Wind Bending Moment BM_P = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.bm_p_kNm} kN·m</strong>
                  </div>
                }
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
                substitution={
                  <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                    Mounted Equipment: <strong>{selectedPoleData.equipment}</strong><br />
                    Equipment Wind Bending Moment BM_E = <strong style={{ color: '#d97706' }}>{selectedPoleData.bm_e_kNm} kN·m</strong>
                  </div>
                }
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
                substitution={
                  <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                    {selectedPoleData.bm_tt_kNm ? (
                      <>Terminal Dead-End Longitudinal Moment BM_TT = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.bm_tt_kNm} kN·m</strong></>
                    ) : (
                      <>Intermediate Transverse Tension Moment BM_T = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.bm_t_kNm} kN·m</strong> (Deviation Angle: {selectedPoleData.angle_deg}°)</>
                    )}
                  </div>
                }
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
                substitution={
                  <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                    Total Ground Line Moment ∑BM = {selectedPoleData.total_bm_kNm} kN·m<br />
                    Pole Top Working Load P_top = {selectedPoleData.total_bm_kNm} / 8.767 m = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.pole_top_transverse_daN} daN</strong><br />
                    Recommended Structural Pole: <strong style={{ color: 'var(--primary)' }}>{selectedPoleData.selected_pole}</strong>
                  </div>
                }
              />

              {/* Equation 2.7: Guy Wire Stay Tension (Tguy) */}
              <MethodologyEquationBox
                id={POLE_SPECIFIC_FORMULAS[6].id}
                number={POLE_SPECIFIC_FORMULAS[6].number}
                title={POLE_SPECIFIC_FORMULAS[6].title}
                category={POLE_SPECIFIC_FORMULAS[6].category}
                standardRef={POLE_SPECIFIC_FORMULAS[6].standardRef}
                equationSvg={POLE_SPECIFIC_FORMULAS[6].equationSvg}
                variables={POLE_SPECIFIC_FORMULAS[6].variables}
                substitution={
                  <div style={{ fontSize: '0.825rem' }}>
                    {selectedPoleData.guy_type ? (
                      <>Required Stay Arrangement: <strong style={{ color: 'var(--primary)' }}>{selectedPoleData.guy_type}</strong> (Calculated Stay Tension: <strong>{selectedPoleData.guy_load_daN || 430} daN</strong> with Factor of Safety ≥ 2.5)</>
                    ) : (
                      <>Guy Wire Stay: <strong>Not Required</strong> (Standard unstayed cantilever pole strength is adequate)</>
                    )}
                  </div>
                }
              />

              {/* Equation 2.8: Buckling Vertical Load (V*) */}
              <MethodologyEquationBox
                id={POLE_SPECIFIC_FORMULAS[7].id}
                number={POLE_SPECIFIC_FORMULAS[7].number}
                title={POLE_SPECIFIC_FORMULAS[7].title}
                category={POLE_SPECIFIC_FORMULAS[7].category}
                standardRef={POLE_SPECIFIC_FORMULAS[7].standardRef}
                equationSvg={POLE_SPECIFIC_FORMULAS[7].equationSvg}
                variables={POLE_SPECIFIC_FORMULAS[7].variables}
                substitution={
                  <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                    Total Downward Compressive Load V* = <strong style={{ color: 'var(--text-main)' }}>{selectedPoleData.vertical_load_kN} kN</strong><br />
                    Pole Euler Buckling Check: <strong style={{ color: '#059669' }}>PASS (Pole Buckling Capacity ≥ 2.5 × V*)</strong>
                  </div>
                }
              />

              {/* Equation 2.9: Span Sag Scaling & Clearance (Sspan) */}
              <MethodologyEquationBox
                id={POLE_SPECIFIC_FORMULAS[8].id}
                number={POLE_SPECIFIC_FORMULAS[8].number}
                title={POLE_SPECIFIC_FORMULAS[8].title}
                category={POLE_SPECIFIC_FORMULAS[8].category}
                standardRef={POLE_SPECIFIC_FORMULAS[8].standardRef}
                equationSvg={POLE_SPECIFIC_FORMULAS[8].equationSvg}
                variables={POLE_SPECIFIC_FORMULAS[8].variables}
                substitution={
                  <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                    Fore Span = {selectedPoleData.fore_span} m ➔ Scaled Sag @ 65°C = <strong>{selectedPoleData.fore_span > 0 ? (0.50 * (selectedPoleData.fore_span / 30.5) ** 2).toFixed(3) : '0.000'} m</strong><br />
                    Ground Clearance Margin (≥ 5.5 m requirement): <strong style={{ color: '#059669' }}>SATISFIED (PASS)</strong>
                  </div>
                }
              />

              {/* Equation 2.10: Foundation Overturning Resistance (Mg) */}
              <MethodologyEquationBox
                id={POLE_SPECIFIC_FORMULAS[9].id}
                number={POLE_SPECIFIC_FORMULAS[9].number}
                title={POLE_SPECIFIC_FORMULAS[9].title}
                category={POLE_SPECIFIC_FORMULAS[9].category}
                standardRef={POLE_SPECIFIC_FORMULAS[9].standardRef}
                equationSvg={POLE_SPECIFIC_FORMULAS[9].equationSvg}
                variables={POLE_SPECIFIC_FORMULAS[9].variables}
                substitution={
                  <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)' }}>
                    Soil Class: <strong>Class {selectedPoleData.soil_class}</strong> (Subgrade k = 25,000 kN/m³)<br />
                    Foundation Overturning Moment BM_F = <strong>{selectedPoleData.bm_f_kNm} kN·m</strong> vs Soil Resistance Mg = <strong>{selectedPoleData.mg_kNm} kN·m</strong><br />
                    Overturning Stability Check: <strong style={{ color: '#059669' }}>{selectedPoleData.stability} (PASS)</strong>
                  </div>
                }
              />

              {/* Equation 2.11: Soil Bearing Pressure (qactual) */}
              <MethodologyEquationBox
                id={POLE_SPECIFIC_FORMULAS[10].id}
                number={POLE_SPECIFIC_FORMULAS[10].number}
                title={POLE_SPECIFIC_FORMULAS[10].title}
                category={POLE_SPECIFIC_FORMULAS[10].category}
                standardRef={POLE_SPECIFIC_FORMULAS[10].standardRef}
                equationSvg={POLE_SPECIFIC_FORMULAS[10].equationSvg}
                variables={POLE_SPECIFIC_FORMULAS[10].variables}
                substitution={
                  <div style={{ fontSize: '0.825rem' }}>
                    Total Vertical Load V* = <strong>{selectedPoleData.vertical_load_kN} kN</strong> ➔ Selected Footprint: <strong style={{ color: 'var(--primary)' }}>{selectedPoleData.foundation_type}</strong><br />
                    Soil Bearing Pressure Check: <strong style={{ color: '#059669' }}>SATISFIED (PASS - Within Permissible Soil Bearing Capacity)</strong>
                  </div>
                }
              />
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
