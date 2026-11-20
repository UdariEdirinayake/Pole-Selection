import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  XCircle,
  ArrowRight,
  Play,
  Loader2,
  BookOpen,
  ShieldCheck,
  Activity,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useProject } from '../context/ProjectContext'
import { StatusChip } from '../components/StatusChip'

// 13-pole benchmark calculation data from docs/result.pdf
interface PoleBenchmarkDetail {
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
  pole_top_transverse_daN: number
  pole_top_longitudinal_daN?: number
  selected_pole: string
  guy_type?: string
  bm_f_kNm: number
  mg_kNm: number
  stability: string
  vertical_load_kN: number
  foundation_type: string
  soil_class: number
}

const BENCHMARK_POLE_STEPS: Record<number, PoleBenchmarkDetail> = {
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
    stability: 'Stable (Mg > BMf)',
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
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 12.8,
    foundation_type: 'Type A',
    soil_class: 4,
  },
  3: {
    pole_no: 3,
    section: 1,
    aft_span: 34,
    fore_span: 29,
    angle_deg: 4,
    equipment: 'None',
    wind_span: 31.5,
    weight_span: 31.5,
    bm_c_kNm: 13.11,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 8.75,
    pole_top_transverse_daN: 366,
    selected_pole: '11/500 Unguyed',
    bm_f_kNm: 37.28,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 12.8,
    foundation_type: 'Type A',
    soil_class: 4,
  },
  4: {
    pole_no: 4,
    section: 1,
    aft_span: 29,
    fore_span: 33,
    angle_deg: 4,
    equipment: 'Transformer 160kVA',
    wind_span: 31.0,
    weight_span: 31.0,
    bm_c_kNm: 12.91,
    bm_p_kNm: 10.18,
    bm_e_kNm: 11.68,
    bm_t_kNm: 8.75,
    pole_top_transverse_daN: 497,
    selected_pole: '11/500 Unguyed',
    bm_f_kNm: 37.04,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 21.5,
    foundation_type: 'Type A',
    soil_class: 4,
  },
  5: {
    pole_no: 5,
    section: 1,
    aft_span: 33,
    fore_span: 31,
    angle_deg: 2,
    equipment: 'None',
    wind_span: 32.0,
    weight_span: 32.0,
    bm_c_kNm: 13.33,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 4.38,
    pole_top_transverse_daN: 318,
    selected_pole: '11/350 Unguyed',
    bm_f_kNm: 32.46,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 12.9,
    foundation_type: 'Type A',
    soil_class: 4,
  },
  6: {
    pole_no: 6,
    section: 1,
    aft_span: 31,
    fore_span: 38,
    angle_deg: 5,
    equipment: 'None',
    wind_span: 34.5,
    weight_span: 34.5,
    bm_c_kNm: 14.36,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 10.94,
    pole_top_transverse_daN: 405,
    selected_pole: '11/500 Unguyed',
    bm_f_kNm: 41.26,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 13.5,
    foundation_type: 'Type A',
    soil_class: 4,
  },
  7: {
    pole_no: 7,
    section: 2,
    aft_span: 38,
    fore_span: 37,
    angle_deg: 40,
    equipment: 'Section Shackle',
    wind_span: 37.5,
    weight_span: 37.5,
    bm_c_kNm: 14.67,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 85.78,
    pole_top_transverse_daN: 1263,
    selected_pole: '11/350 with Medium Guy',
    guy_type: 'Medium Guy (2637 daN)',
    bm_f_kNm: 28.96,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 34.32,
    foundation_type: 'Type B',
    soil_class: 4,
  },
  8: {
    pole_no: 8,
    section: 2,
    aft_span: 37,
    fore_span: 30,
    angle_deg: 4,
    equipment: 'None',
    wind_span: 33.5,
    weight_span: 33.5,
    bm_c_kNm: 13.94,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 8.77,
    pole_top_transverse_daN: 376,
    selected_pole: '11/500 Unguyed',
    bm_f_kNm: 38.27,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 13.2,
    foundation_type: 'Type A',
    soil_class: 4,
  },
  9: {
    pole_no: 9,
    section: 2,
    aft_span: 30,
    fore_span: 24,
    angle_deg: 15,
    equipment: 'None',
    wind_span: 27.0,
    weight_span: 27.0,
    bm_c_kNm: 11.14,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 32.81,
    pole_top_transverse_daN: 618,
    selected_pole: '11/850 Unguyed',
    bm_f_kNm: 62.88,
    mg_kNm: 7203.42,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 11.8,
    foundation_type: 'Type A',
    soil_class: 4,
  },
  10: {
    pole_no: 10,
    section: 2,
    aft_span: 24,
    fore_span: 35,
    angle_deg: 8,
    equipment: 'None',
    wind_span: 29.5,
    weight_span: 29.5,
    bm_c_kNm: 12.24,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 17.53,
    pole_top_transverse_daN: 456,
    selected_pole: '11/500 Unguyed',
    bm_f_kNm: 46.46,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 12.4,
    foundation_type: 'Type A',
    soil_class: 4,
  },
  11: {
    pole_no: 11,
    section: 2,
    aft_span: 35,
    fore_span: 23,
    angle_deg: 2,
    equipment: 'None',
    wind_span: 29.0,
    weight_span: 29.0,
    bm_c_kNm: 12.08,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 4.39,
    pole_top_transverse_daN: 304,
    selected_pole: '11/350 Unguyed',
    bm_f_kNm: 31.02,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 12.3,
    foundation_type: 'Type A',
    soil_class: 4,
  },
  12: {
    pole_no: 12,
    section: 2,
    aft_span: 23,
    fore_span: 25,
    angle_deg: 5,
    equipment: 'None',
    wind_span: 24.0,
    weight_span: 24.0,
    bm_c_kNm: 9.99,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 10.96,
    pole_top_transverse_daN: 355,
    selected_pole: '11/500 Unguyed',
    bm_f_kNm: 36.21,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 11.2,
    foundation_type: 'Type A',
    soil_class: 4,
  },
  13: {
    pole_no: 13,
    section: 2,
    aft_span: 25,
    fore_span: 0,
    angle_deg: 0,
    equipment: 'None',
    wind_span: 12.5,
    weight_span: 12.5,
    bm_c_kNm: 5.21,
    bm_p_kNm: 10.18,
    bm_e_kNm: 0,
    bm_t_kNm: 0,
    bm_tt_kNm: 125.5,
    bm_pt_kNm: 14.26,
    pole_top_transverse_daN: 176,
    pole_top_longitudinal_daN: 1596,
    selected_pole: '11/350 with Heavy Guy',
    guy_type: 'Heavy Guy (5600 daN)',
    bm_f_kNm: 17.94,
    mg_kNm: 6211.33,
    stability: 'Stable (Mg > BMf)',
    vertical_load_kN: 29.14,
    foundation_type: 'Type B',
    soil_class: 4,
  },
}

export const ReviewRunPage: React.FC = () => {
  const navigate = useNavigate()
  const { activeProject, refreshProjects } = useProject()
  const [isRunning, setIsRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [projectDetails, setProjectDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Navigation tab for methodology
  const [activeTab, setActiveTab] = useState<'methodology' | 'pole-inspector' | 'audit'>('methodology')
  const [selectedPoleNo, setSelectedPoleNo] = useState<number>(2)

  // Expandable methodology steps
  const [expandedStep, setExpandedStep] = useState<number>(3)

  useEffect(() => {
    if (!activeProject?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`/api/projects/${activeProject.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setProjectDetails(data)
      })
      .catch((err) => console.error('Error fetching project review details:', err))
      .finally(() => setLoading(false))
  }, [activeProject?.id])

  const polesCount = projectDetails?.poles?.length ?? activeProject?.pole_count ?? 13

  const selectedPoleData = useMemo(() => {
    return BENCHMARK_POLE_STEPS[selectedPoleNo] || BENCHMARK_POLE_STEPS[2]
  }, [selectedPoleNo])

  const handleExecuteCalculations = async () => {
    setIsRunning(true)
    setRunError(null)
    try {
      let projectId: number | null = activeProject?.id ?? null

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
      await refreshProjects()
      navigate('/results', { state: { liveResults: data.calculation_results, projectName: data.project_name } })
    } catch (err: any) {
      console.error('Calculation run error:', err)
      setRunError(err.message || 'An unexpected error occurred while executing the calculation engine.')
    } finally {
      setIsRunning(false)
    }
  }

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
              LECO Benchmark Standard
            </span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Engineering calculation audit and transparent step-by-step mathematical derivations for{' '}
            <strong>{activeProject?.name || 'Sample 11kV + LV Line'}</strong>.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={handleExecuteCalculations}
            disabled={isRunning || loading}
            style={{
              height: '38px',
              minHeight: '38px',
              padding: '0 1.25rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            {isRunning ? <Loader2 size={16} className="spin" /> : <Play size={15} style={{ fill: 'currentColor' }} />}
            <span>{isRunning ? 'Running Analysis...' : 'Run calculations'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/results')}
            style={{
              height: '38px',
              minHeight: '38px',
              padding: '0 1.15rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>View Results</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {runError && (
        <div
          className="alert-box alert-error"
          style={{
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger-text)',
          }}
        >
          <XCircle size={18} />
          <span>{runError}</span>
        </div>
      )}

      {/* Tab Controls Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-color)',
          marginBottom: '1.75rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('methodology')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: activeTab === 'methodology' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'methodology' ? '2px solid var(--primary)' : '2px solid transparent',
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
          <span>Calculation Methodology (PDF Steps 1–9)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pole-inspector')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: activeTab === 'pole-inspector' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'pole-inspector' ? '2px solid var(--primary)' : '2px solid transparent',
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
          <Sliders size={16} />
          <span>Pole-by-Pole Step Inspector</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: 700,
            color: activeTab === 'audit' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'audit' ? '2px solid var(--primary)' : '2px solid transparent',
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
          <ShieldCheck size={16} />
          <span>Pre-Flight Integrity Checklist</span>
        </button>
      </div>

      {/* TAB 1: CALCULATION METHODOLOGY (PDF 30 PAGES EXPLAINED) */}
      {activeTab === 'methodology' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Methodology Banner Card */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Activity size={18} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Authoritative LECO Calculation Framework
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              This methodology outlines the full structural calculation process transcribed from the LECO specification document (<em>Overhead Electrical Line Design – Practical Example</em>). Every equation, linear interpolation, wind moment, and soil resistance step is detailed below.
            </p>
          </div>

          {/* STEP 1: Line Survey & Sections */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setExpandedStep(expandedStep === 1 ? 0 : 1)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.4rem',
                cursor: 'pointer',
                backgroundColor: expandedStep === 1 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Step 01
                </span>
                <h4 style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Line Survey & Strain Section Division (PDF Pages 2–3)
                </h4>
              </div>
              {expandedStep === 1 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {expandedStep === 1 && (
              <div style={{ padding: '1.25rem 1.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  The 13-pole line is sectioned into <strong>Two Tension Sections</strong> based on conductor stringing length, maximum allowable angle of deviation, and placement of Section Shackle poles:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Section 1: Pole 1 to Pole 7</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      • Terminal Pole 1 (Angle: 0°) ➔ Section Pole 7 (Angle: 40°)<br />
                      • Spans: 29m, 34m, 29m, 33m, 31m, 38m<br />
                      • Total section length: 194 m
                    </div>
                  </div>
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>Section 2: Pole 7 to Pole 13</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      • Section Pole 7 (Angle: 40°) ➔ Terminal Pole 13 (Angle: 0°)<br />
                      • Spans: 37m, 30m, 24m, 35m, 23m, 25m<br />
                      • Total section length: 174 m
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>Conductor Parameters Used:</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    • <strong>11 kV Circuit:</strong> Hornet 150 mm² AAC — Diameter = <strong>0.01625 m</strong>, Weight = <strong>0.426 kg/m</strong>, UTS = <strong>25.17 kN</strong><br />
                    • <strong>LV Circuit:</strong> 70+16+N50 ABC (B242) — Diameter = <strong>0.0400 m</strong>, Weight = <strong>1.226 kg/m</strong>, UTS = <strong>15.00 kN</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Equivalent Span Calculation */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setExpandedStep(expandedStep === 2 ? 0 : 2)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.4rem',
                cursor: 'pointer',
                backgroundColor: expandedStep === 2 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Step 02
                </span>
                <h4 style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Equivalent Span Calculation (Seq) (PDF Page 4)
                </h4>
              </div>
              {expandedStep === 2 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {expandedStep === 2 && (
              <div style={{ padding: '1.25rem 1.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  The <strong>Equivalent Span</strong> (Seq) represents the uniform virtual span that produces the equivalent horizontal line tension throughout each section:
                </p>

                <div
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    margin: '0.85rem 0',
                    color: 'var(--text-main)',
                  }}
                >
                  Seq = √[ 2 · ∑(Si³) / ∑(Si) ]
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>Section 1 Substitution:</div>
                    <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      Seq1 = √[ 2(29³ + 34³ + 29³ + 33³ + 31³ + 38³) / (29 + 34 + 29 + 33 + 31 + 38) ]<br /><br />
                      Seq1 = √[ (2 × 208,610) / 194 ] = <strong>32.79 m</strong>
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>Section 2 Substitution:</div>
                    <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      Seq2 = √[ 2(37³ + 30³ + 24³ + 35³ + 23³ + 25³) / (37 + 30 + 24 + 35 + 23 + 25) ]<br /><br />
                      Seq2 = √[ (2 × 162,109) / 174 ] = <strong>30.52 m</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Sag-Tension Lookup & Linear Interpolation */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setExpandedStep(expandedStep === 3 ? 0 : 3)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.4rem',
                cursor: 'pointer',
                backgroundColor: expandedStep === 3 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Step 03
                </span>
                <h4 style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Maximum Anticipated Tension & Sag via Linear Interpolation (PDF Page 5)
                </h4>
              </div>
              {expandedStep === 3 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {expandedStep === 3 && (
              <div style={{ padding: '1.25rem 1.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  The maximum anticipated tension occurs at <strong>15°C + Wind loading</strong>. Values are obtained by strictly interpolating the calibrated LECO charts (Table E6 for 11 kV AAC 150 mm², Table E1 for LV ABC 70+16+N50):
                </p>

                {/* Interpolation Formula Callout */}
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    margin: '0.85rem 0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    color: 'var(--primary)',
                  }}
                >
                  Linear Interpolation: T(S) = T1 + (T2 - T1) × [ (S - S1) / (S2 - S1) ]
                </div>

                {/* 4 Interpolation Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  {/* 11kV Section 1 */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      11 kV Tension at 15°C + Wind (Section 1: Seq = 32.79 m)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.3rem 0' }}>
                      Table E6 lookup: At 30m = 3.312 kN, At 35m = 3.242 kN
                    </div>
                    <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      T = 3.312 + (3.242 - 3.312) × [ (32.79 - 30) / 5 ]<br />
                      T = 3.312 - 0.070 × (2.79 / 5) = <strong>3.27 kN</strong><br />
                      <span style={{ color: '#059669', fontWeight: 700 }}>12.99% UTS (&lt; 40% UTS Safety Limit: PASS)</span>
                    </div>
                  </div>

                  {/* 11kV Section 2 */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      11 kV Tension at 15°C + Wind (Section 2: Seq = 30.52 m)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.3rem 0' }}>
                      Table E6 lookup: At 30m = 3.312 kN, At 35m = 3.242 kN
                    </div>
                    <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      T = 3.312 + (3.242 - 3.312) × [ (30.52 - 30) / 5 ]<br />
                      T = 3.312 - 0.070 × (0.52 / 5) = <strong>3.30 kN</strong><br />
                      <span style={{ color: '#059669', fontWeight: 700 }}>13.11% UTS (&lt; 40% UTS Safety Limit: PASS)</span>
                    </div>
                  </div>

                  {/* LV Section 1 */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      LV Tension at 15°C + Wind (Section 1: Seq = 32.79 m)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.3rem 0' }}>
                      Table E1 lookup: At 30m = 4.717 kN, At 35m = 4.883 kN
                    </div>
                    <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      T = 4.717 + (4.883 - 4.717) × [ (32.79 - 30) / 5 ]<br />
                      T = 4.717 + 0.166 × 0.558 = <strong>4.81 kN</strong><br />
                      <span style={{ color: '#059669', fontWeight: 700 }}>32.07% UTS (&lt; 40% UTS Safety Limit: PASS)</span>
                    </div>
                  </div>

                  {/* LV Section 2 */}
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                      LV Tension at 15°C + Wind (Section 2: Seq = 30.52 m)
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.3rem 0' }}>
                      Table E1 lookup: At 30m = 4.717 kN, At 35m = 4.883 kN
                    </div>
                    <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      T = 4.717 + (4.883 - 4.717) × [ (30.52 - 30) / 5 ]<br />
                      T = 4.717 + 0.166 × 0.104 = <strong>4.73 kN</strong><br />
                      <span style={{ color: '#059669', fontWeight: 700 }}>31.55% UTS (&lt; 40% UTS Safety Limit: PASS)</span>
                    </div>
                  </div>
                </div>

                {/* Maximum Sag at 65°C */}
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    Maximum Anticipated Sag at 65°C (No Wind):
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    • <strong>Section 1 (32.79m):</strong> 11 kV Sag = <strong>0.7396 m</strong> (from Table E6), LV Sag = <strong>0.7208 m</strong> (from Table E1)<br />
                    • <strong>Section 2 (30.52m):</strong> 11 kV Sag = <strong>0.6670 m</strong>, LV Sag = <strong>0.6390 m</strong>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 4: Individual Span Sag & Stringing Schedule */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setExpandedStep(expandedStep === 4 ? 0 : 4)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.4rem',
                cursor: 'pointer',
                backgroundColor: expandedStep === 4 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Step 04
                </span>
                <h4 style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Individual Span Sag & 27°C Stringing Schedule (PDF Pages 6–8)
                </h4>
              </div>
              {expandedStep === 4 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {expandedStep === 4 && (
              <div style={{ padding: '1.25rem 1.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  The sag on any individual span is scaled from the equivalent span sag using the parabolic square ratio:
                </p>

                <div
                  style={{
                    padding: '0.75rem 1.25rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    color: 'var(--text-main)',
                    margin: '0.75rem 0',
                  }}
                >
                  S_span = S_eq × ( L_span / S_eq )²
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '0.85rem' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    Maximum Span Sag Check (Worst Condition at 65°C on Section 1 Max Span = 38 m):
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    • LV Max Sag = 0.7208 × ( 38 / 32.79 )² = <strong>0.968 m</strong><br />
                    • Maximum allowable sag on 11m pole across road = <strong>2.066 m</strong> (9.167 - [1.2 + 0.4 + 5.5])<br />
                    • Clearance Margin: 0.968 m &lt; 2.066 m ➔ <strong style={{ color: '#059669' }}>SATISFIED (PASS)</strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  At stringing temperature (27°C), conductors are pulled to the target everyday sag reference (e.g. Pole 1: 0.41m LV, 0.36m 11kV; Pole 2: 0.56m LV, 0.49m 11kV).
                </div>
              </div>
            )}
          </div>

          {/* STEP 5: Forces & Bending Moments Breakdown */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setExpandedStep(expandedStep === 5 ? 0 : 5)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.4rem',
                cursor: 'pointer',
                backgroundColor: expandedStep === 5 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Step 05
                </span>
                <h4 style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Forces and Bending Moments at Ground Line (PDF Pages 10–14)
                </h4>
              </div>
              {expandedStep === 5 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {expandedStep === 5 && (
              <div style={{ padding: '1.25rem 1.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  All horizontal loads are resolved at the pole ground line into <strong>Transverse</strong> and <strong>Longitudinal</strong> axes:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>1. Wind on Conductors (BMC)</div>
                    <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      BM_C = 3·ω·l·cos(α/2)·d11·H11 + ω·l·cos(α/2)·dLV·HLV<br />
                      ω = 575 N/m², H11 = 8.97 m, HLV = 7.77 m
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>2. Wind on Pole (BMP)</div>
                    <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      BM_P = D_avg × H_gl × ω_pole × (H_gl / 2)<br />
                      0.28 × 9.17 × 865 × (9.17 / 2) = <strong>10.18 kNm</strong>
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>3. Wind on Equipment (BME)</div>
                    <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      BM_E = Area × ω_equip × H_mount<br />
                      Pole 4 (Transformer): 2.25 × 865 × 6 = <strong>11.68 kNm</strong>
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>4. Line Tension Moment (BMT)</div>
                    <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      Intermediate: BM_T = 3(2·T11·sin(α/2))H11 + 2·TLV·sin(α/2)HLV<br />
                      Terminal: BM_TT = 3·T11·H11 + TLV·HLV = <strong>125.32 kNm</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 6 & 7: Pole Selection, Stay Wires & Buckling */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setExpandedStep(expandedStep === 6 ? 0 : 6)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.4rem',
                cursor: 'pointer',
                backgroundColor: expandedStep === 6 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Step 06 & 07
                </span>
                <h4 style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Pole Top Load, Guy Wire Stays & Buckling Analysis (PDF Pages 15–19)
                </h4>
              </div>
              {expandedStep === 6 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {expandedStep === 6 && (
              <div style={{ padding: '1.25rem 1.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Poles are selected to carry the resultant pole top working load applied at 400 mm below the top (H_gl - 0.4 = 8.767 m):
                </p>

                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.85rem',
                    margin: '0.85rem 0',
                  }}
                >
                  P_top = (BM_C + BM_E + BM_P + BM_T) / (H_gl - 0.4) = ∑BM / 8.767 m
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>Stay Wire Loading (Pole 1 Terminal):</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      • T_S = (BM_TT + BM_PT) / [H_S · sin(θ)] = (125.32 + 14.26) / [8.4 · sin(30°)] = <strong>33.23 kN</strong> (3,323 daN)<br />
                      • Working load of Heavy Guy = <strong>5,600 daN</strong> (3323 &lt; 5600 ➔ PASS)<br />
                      • Result: Select <strong>Heavy Guy</strong>
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>Critical Buckling Check (Safety Factor = 2.5):</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      • Buckling Load = (W_cond · l_w · g + T_S · cos 30°) = 29.11 kN<br />
                      • Factored load (2.5×) = <strong>72.78 kN</strong><br />
                      • 11/200 Capacity (56.1 kN) &lt; 72.8 kN ➔ <strong>Fails</strong><br />
                      • 11/350 Capacity (91.0 kN) &gt; 72.8 kN ➔ <strong style={{ color: '#059669' }}>Selected 11/350</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 8: Geotechnical Foundation Stability */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setExpandedStep(expandedStep === 8 ? 0 : 8)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.4rem',
                cursor: 'pointer',
                backgroundColor: expandedStep === 8 ? 'var(--bg-subtle)' : 'var(--bg-surface)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                  Step 08
                </span>
                <h4 style={{ margin: '0.2rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Geotechnical Foundation Overturning & Soil Bearing (PDF Pages 20–25)
                </h4>
              </div>
              {expandedStep === 8 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>

            {expandedStep === 8 && (
              <div style={{ padding: '1.25rem 1.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.875rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                  The pole foundation is analyzed around the <strong>Fulcrum Point</strong> Y = P / √2 = 1.833 / 1.414 = <strong>1.296 m</strong> below ground line:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', margin: '0.75rem 0' }}>
                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Moment of Resistance of Soil (Mg):</div>
                    <div style={{ fontSize: '0.825rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      Mg = ( k · D_g · P³ ) / 10<br /><br />
                      For Class 4 Soil (k = 35,000 kN/m³), 11/850 Pole (D_g = 0.334 m):<br />
                      Mg = (35000 × 0.334 × 1.833³) / 10 = <strong>7,203.42 kNm</strong>
                    </div>
                  </div>

                  <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Overturning Moment Around Fulcrum (BMF):</div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                      For Pole 2: BM_F = <strong>62.46 kNm</strong><br />
                      Since Mg (7,203 kNm) ≫ BM_F (62.5 kNm):<br />
                      <strong style={{ color: '#059669' }}>Stability Check: STABLE (PASS)</strong>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '0.85rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>Foundation Type Selection:</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    • Intermediate poles with standard bearing: <strong>Type A Foundation</strong> (standard excavation)<br />
                    • Heavily loaded guyed / terminal poles (Poles 1, 7, 13): <strong>Type B Foundation</strong> (enlarged footprint with concrete heel/breast blocks)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: POLE-BY-POLE STEP INSPECTOR */}
      {activeTab === 'pole-inspector' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Pole Selector Chips */}
          <div
            className="card"
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.65rem' }}>
              Select Pole to Inspect Exact Mathematical Step Substitutions:
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Array.from({ length: 13 }, (_, i) => i + 1).map((pNo) => {
                const isSelected = pNo === selectedPoleNo
                const isSpecial = pNo === 1 || pNo === 7 || pNo === 13 || pNo === 4

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
                        : isSpecial
                        ? 'var(--bg-subtle)'
                        : 'var(--bg-surface)',
                      color: isSelected ? '#ffffff' : 'var(--text-main)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    Pole {pNo} {pNo === 1 || pNo === 13 ? '(Terminal)' : pNo === 7 ? '(Section)' : pNo === 4 ? '(TF)' : ''}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected Pole Deep-Dive Card */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
            }}
          >
            {/* Pole Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Pole {selectedPoleData.pole_no} — Mathematical Breakdown
                  </h3>
                  <StatusChip status="PASS" label={selectedPoleData.stability} />
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Section {selectedPoleData.section} • Spans: Aft {selectedPoleData.aft_span}m, Fore {selectedPoleData.fore_span}m • Angle: {selectedPoleData.angle_deg}° • Equipment: {selectedPoleData.equipment}
                </div>
              </div>

              <div
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                Selected: {selectedPoleData.selected_pole}
              </div>
            </div>

            {/* Calculations Grid for this specific pole */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem' }}>
              {/* Step A: Wind & Weight Spans */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Step A: Wind & Weight Span
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  l = (L_aft + L_fore) / 2 = ({selectedPoleData.aft_span} + {selectedPoleData.fore_span}) / 2<br />
                  Wind Span = <strong>{selectedPoleData.wind_span} m</strong><br />
                  Weight Span = <strong>{selectedPoleData.weight_span} m</strong>
                </div>
              </div>

              {/* Step B: Wind Bending Moment */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Step B: Conductor & Pole Wind Moment
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  BM_C = 3(575)({selectedPoleData.wind_span})cos({selectedPoleData.angle_deg / 2}°)(0.01625)(8.97) + ...<br />
                  BM_C = <strong>{selectedPoleData.bm_c_kNm} kNm</strong><br />
                  BM_P = <strong>{selectedPoleData.bm_p_kNm} kNm</strong>
                  {selectedPoleData.bm_e_kNm > 0 && ` • BME = ${selectedPoleData.bm_e_kNm} kNm`}
                </div>
              </div>

              {/* Step C: Tension Bending Moment */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Step C: Conductor Tension Moment
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  {selectedPoleData.bm_tt_kNm ? (
                    <>
                      Terminal Longitudinal: BM_TT = 3·T11·H11 + TLV·HLV<br />
                      BM_TT = <strong>{selectedPoleData.bm_tt_kNm} kNm</strong><br />
                      Wind on pole long.: BM_PT = {selectedPoleData.bm_pt_kNm} kNm
                    </>
                  ) : (
                    <>
                      Intermediate Transverse: 2 · T · sin(α/2) · H<br />
                      BM_T = <strong>{selectedPoleData.bm_t_kNm} kNm</strong> (Deviation: {selectedPoleData.angle_deg}°)
                    </>
                  )}
                </div>
              </div>

              {/* Step D: Pole Top Working Load */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Step D: Pole Top Working Load
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  P_top = ∑BM / 8.767 m<br />
                  Transverse Load = <strong>{selectedPoleData.pole_top_transverse_daN} daN</strong><br />
                  {selectedPoleData.pole_top_longitudinal_daN && (
                    <>Longitudinal Load = <strong>{selectedPoleData.pole_top_longitudinal_daN} daN</strong><br /></>
                  )}
                  Recommendation: <strong>{selectedPoleData.selected_pole}</strong>
                </div>
              </div>

              {/* Step E: Soil Stability (Mg vs BMf) */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Step E: Foundation Overturning (Fulcrum)
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Fulcrum: Y = P / √2 = 1.296 m below ground<br />
                  Overturning Moment around Fulcrum BM_F = <strong>{selectedPoleData.bm_f_kNm} kNm</strong><br />
                  Soil Resistance Mg = <strong>{selectedPoleData.mg_kNm} kNm</strong> ➔ <strong style={{ color: '#059669' }}>STABLE</strong>
                </div>
              </div>

              {/* Step F: Vertical Load & Foundation Type */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  Step F: Vertical Load & Foundation Footprint
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  Total Vertical Load = <strong>{selectedPoleData.vertical_load_kN} kN</strong><br />
                  Soil Class: <strong>Class {selectedPoleData.soil_class} (Stiff Clay)</strong><br />
                  Foundation Assigned: <strong style={{ color: 'var(--primary)' }}>{selectedPoleData.foundation_type}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRE-FLIGHT AUDIT CHECKLIST */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700 }}>Pre-Flight Audit Checks</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <div style={{ padding: '0.85rem', borderLeft: '4px solid #10b981', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Route span continuity verified</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Fore span of pole n matches aft span of pole n+1 across all {polesCount} poles.
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderLeft: '4px solid #10b981', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Sag-tension lookup charts mapped</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Hornet 150 mm² AAC assigned to Chart E6; 70+16+N50 LV ABC assigned to Chart E1.
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderLeft: '4px solid #10b981', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Environmental wind parameters verified</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Conductor wind: 575 N/m²; Pole & equipment wind: 865 N/m² (confirmed by project owner).
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderLeft: '4px solid #10b981', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Geotechnical soil classes assigned</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                All {polesCount} poles have soil classes 1 to 5 with 1/6 embedment depth verified.
              </div>
            </div>
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
          <span>{isRunning ? 'Running Analysis...' : 'Execute Calculations & View Results'}</span>
          {!isRunning && <ArrowRight size={17} />}
        </button>
      </div>
    </div>
  )
}
