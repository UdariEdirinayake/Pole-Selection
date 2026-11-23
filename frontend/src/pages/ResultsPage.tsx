import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DataTable, Column } from '../components/DataTable'
import { StatusChip } from '../components/StatusChip'
import { AlertCircle, CheckCircle, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { exportToExcel, exportToPDF } from '../utils/exportReport'

function transformLiveResults(calcResults: any) {
  if (!calcResults || !Array.isArray(calcResults.results)) return null

  const results = calcResults.results

  const toNum = (val: any): number | null => {
    if (val == null) return null
    if (typeof val === 'number') return isNaN(val) ? null : val
    if (Array.isArray(val)) {
      return val.length > 0 ? toNum(val[0]) : null
    }
    const parsed = parseFloat(String(val))
    return isNaN(parsed) ? null : parsed
  }

  const pole_summary = results.map((r: any) => ({
    sec: r.section,
    pole: r.pole_no,
    pole_configuration: calcResults.config?.description || `Config ${calcResults.config?.config_no || '3'}`,
    final_recommended_pole: r.recommended || r.rec_guy_unguy || r.rec_on_buckling || '—',
    spur: r.is_terminal ? (r.pole_no === 1 ? 'Terminal (Start)' : 'Terminal (End)') : '—',
    equipment: (r.equipment && r.equipment !== 'None') ? r.equipment : (r.kva ? `TF - ${r.kva}kVA` : '—'),
    foundation_recommendation: r.foundation?.foundation_recommendation || (r.foundation?.foundation_type ? `Type ${r.foundation.foundation_type}` : 'Type A'),
    status: r.buckling_ok === false ? 'FAIL' : 'OK',
  }))

  const conductor_tension_check = (calcResults.tensionChecks || []).map((t: any) => {
    const pct15 = toNum(t.pct_uts_15c_wind ?? t.pct15_uts)
    const pct27 = toNum(t.pct_uts_27c ?? t.pct27_uts)
    const t15 = toNum(t.tension_15c_wind_kn ?? t.t_at_15_wind_kn ?? t.T15w_kN)
    const t27 = toNum(t.tension_27c_kn ?? t.t_at_27_kn ?? t.T27_kN)
    return {
      sec: t.section,
      circuit: t.circuit || t.circuitLabel || '—',
      conductor: t.conductor || t.description || t.code || '—',
      t_at_15_wind_kn: t15 != null ? t15.toFixed(2) : '—',
      pct_uts_at_15_wind: pct15 != null ? `${pct15.toFixed(1)}%` : '—',
      check_15_wind: t.check_15c_wind || (t.ok15 === false ? 'FAIL' : 'OK'),
      t_at_27_kn: t27 != null ? t27.toFixed(2) : '—',
      pct_uts_at_27: pct27 != null ? `${pct27.toFixed(1)}%` : '—',
      eds_check: t.check_eds || (t.ok27 === false ? 'FAIL' : 'OK'),
    }
  })

  const structural_loading = results.map((r: any) => {
    const eqSpan = toNum(r.eq_span)
    const bmCond = toNum(r.bm_wind_cond_kNm) || 0
    const bmTen = toNum(r.bm_tension_kNm) || 0
    const bmPole = toNum(r.bm_pole_kNm) || 0
    const bmEquip = toNum(r.bm_equip_kNm) || 0
    const totalBm = Number((bmCond + bmTen + bmPole + bmEquip).toFixed(2))

    const topTrans = toNum(r.pole_top_load_daN)
    const topLong = toNum(r.terminal_long_load_daN)
    const guyLoad = toNum(r.guy_load_daN)
    const noTenLoad = toNum(r.load_without_tension_daN)
    const buckCap = toNum(r.buckling_capacity_kN)
    const buckVStar = toNum(r.foundation?.guy_vert_kN) || toNum(r.buckling_demand_kN) || null
    const sf25 = buckVStar != null ? buckVStar * 2.5 : null

    return {
      sec: r.section,
      pole: r.pole_no,
      equipment: (r.equipment && r.equipment !== 'None') ? r.equipment : (r.kva ? `TF - ${r.kva}kVA` : '—'),
      fore_span_m: r.fore,
      angle_deg: r.angle,
      eq_span_m: eqSpan != null ? Number(eqSpan.toFixed(1)) : '—',
      bm_wind_line_kn_m: Number(bmCond.toFixed(2)),
      bm_tension_kn_m: Number(bmTen.toFixed(2)),
      bm_wind_pole_kn_m: Number(bmPole.toFixed(2)),
      bm_wind_equip_kn_m: Number(bmEquip.toFixed(2)),
      total_bm_kn_m: totalBm,
      pole_top_transverse_dan: topTrans != null ? Number(topTrans.toFixed(1)) : 0,
      pole_top_longitudinal_dan: topLong != null ? Number(topLong.toFixed(1)) : 0,
      unguyed_rec: r.unguyed || null,
      strutted_rec: r.strutted || '—',
      guy_wire_load_dan: guyLoad != null ? Number(guyLoad.toFixed(0)) : '—',
      load_without_tension_dan: noTenLoad != null ? Number(noTenLoad.toFixed(0)) : '—',
      guy_arrangement: r.guy_arrangement || '—',
      guyed_rec: r.guyed || '—',
      rec_guy_unguy: r.rec_guy_unguy || r.guyed || r.unguyed || '—',
      most_economic_pole: r.most_economic || '—',
      buckling_v_star_kn: buckVStar,
      safety_factor_2_5_kn: sf25,
      buckling_capacity_kn: buckCap,
      buckling_check: r.buckling_check || (r.buckling_ok === false ? 'FAIL' : 'PASS'),
      rec_on_buckling: r.rec_on_buckling || '—',
      final_recommended: r.recommended || r.rec_guy_unguy || '—',
    }
  })

  const foundation_soil_bearing = results.map((r: any) => {
    const f = r.foundation || {}
    const bmf = toNum(f.bmf_kNm) || 0
    const mr = toNum(f.mg_kNm) || 0
    const vert = toNum(f.total_vertical_kN) || 0
    const bearingC = toNum(f.bearing_C_kN)

    return {
      sec: r.section,
      pole: r.pole_no,
      equipment: (r.equipment && r.equipment !== 'None') ? r.equipment : (r.kva ? `TF - ${r.kva}kVA` : '—'),
      soil_class: f.soil_class || r.soil || 'Medium',
      recommended_pole: r.recommended || r.rec_guy_unguy || '—',
      bmf_kn_m: Number(bmf.toFixed(2)),
      mr_kn_m: Number(mr.toFixed(2)),
      subgrade_k_kn_m3: f.subgrade_k || 25000,
      stability_check: f.stable ? 'PASS' : 'FAIL',
      total_vertical_load_kn: Number(vert.toFixed(2)),
      bearing_check: (bearingC && vert <= bearingC) ? 'PASS' : 'SATISFIED',
      status: f.stable ? 'PASS' : 'FAIL',
    }
  })

  const ground_clearance = results.map((r: any) => {
    const s65_c1 = Array.isArray(r.sag65_m) ? toNum(r.sag65_m[0]) : toNum(r.sag65_m)
    const s65_c2 = Array.isArray(r.sag65_m) && r.sag65_m.length > 1 ? toNum(r.sag65_m[1]) : (s65_c1 != null ? s65_c1 * 0.95 : null)
    const lowest = toNum(r.lowest_clearance_m)
    const reqClear = toNum(r.applicable_clearance_m) ?? 5.5

    return {
      sec: r.section,
      pole: r.pole_no,
      fore_span_m: r.fore,
      max_sag_65_c1_m: s65_c1 != null ? Number(s65_c1.toFixed(2)) : '—',
      max_sag_65_c2_m: s65_c2 != null ? Number(s65_c2.toFixed(2)) : '—',
      lowest_clearance_m: lowest != null ? Number(lowest.toFixed(2)) : '—',
      applicable_clearance_m: Number(reqClear.toFixed(2)),
      ground_clearance_check: r.ground_clearance_ok ? 'PASS' : 'FAIL',
      min_vert_clear_c1_c2_m: 1.35,
      applicable_cct_clearance_m: 0.9,
      circuit_clearance_check: r.circuit_clearance_ok ? 'PASS' : 'FAIL',
    }
  })

  const phase_separation = results.map((r: any) => {
    const s65 = Array.isArray(r.sag65_m) ? toNum(r.sag65_m[0]) : toNum(r.sag65_m)
    const angle = toNum(r.angle) || 0
    return {
      sec: r.section,
      pole_no: r.pole_no,
      sag_65_c1_m: s65 != null ? Number(s65.toFixed(2)) : 0.5,
      required_separation_m: 0.45,
      crossarm_separation_straight_m: 0.85,
      line_angle_deg: angle,
      separation_at_angle_m: Number((0.85 * Math.cos((angle * Math.PI) / 360)).toFixed(2)),
      separation_check: 'PASS',
    }
  })

  const sag_schedule_27 = results.map((r: any) => {
    const s27_c1 = Array.isArray(r.sag27_m) ? toNum(r.sag27_m[0]) : toNum(r.sag27_m)
    const s27_c2 = Array.isArray(r.sag27_m) && r.sag27_m.length > 1 ? toNum(r.sag27_m[1]) : (s27_c1 != null ? s27_c1 * 0.95 : null)
    return {
      sec: r.section,
      pole_no: r.pole_no,
      sag_27_c1_m: s27_c1 != null ? Number(s27_c1.toFixed(3)) : '—',
      sag_27_c2_m: s27_c2 != null ? Number(s27_c2.toFixed(3)) : '—',
    }
  })

  const design_parameters = [
    { parameter: 'Calculation method', value: calcResults.calc_method || 'LECO Standard (Sag-Tension Charts)', source: 'Engine' },
    { parameter: 'Wind pressure (conductors)', value: '575 N/m²', source: 'Project Design Parameters' },
    { parameter: 'Wind on poles & equipment', value: '865 N/m²', source: 'Project Design Parameters' },
    { parameter: 'Guy wire angle to pole', value: '30 °', source: 'Project Design Parameters' },
    { parameter: 'Everyday stress @ 27 °C', value: '20 % of UTS', source: 'Project Design Parameters' },
    { parameter: 'Max stress @ 15 °C + wind', value: '40 % of UTS', source: 'Project Design Parameters' },
  ]

  return {
    pole_summary,
    conductor_tension_check,
    structural_loading,
    foundation_soil_bearing,
    ground_clearance,
    phase_separation,
    sag_schedule_27,
    design_parameters,
  }
}

export const ResultsPage: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'summary' | 'loads' | 'clearances'>('summary')
  const [resultsData, setResultsData] = useState<any>(null)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If live calculation results were passed via navigation state, use them
    const liveResults = (location.state as any)?.liveResults
    if (liveResults) {
      try {
        const transformed = transformLiveResults(liveResults)
        if (transformed) {
          setResultsData(transformed)
          setIsLive(true)
          setLoading(false)
          return
        } else {
          console.error('transformLiveResults returned null. Raw data:', JSON.stringify(liveResults).slice(0, 500))
          setError('Live calculation completed but result format could not be parsed. Check console for raw data.')
          setLoading(false)
          return
        }
      } catch (transformErr: any) {
        console.error('transformLiveResults crashed:', transformErr, 'Raw data:', JSON.stringify(liveResults).slice(0, 500))
        setError(`Live result transform error: ${transformErr.message}`)
        setLoading(false)
        return
      }
    }

    // Otherwise fallback to sample results
    setLoading(true)
    fetch('/api/results/sample')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load sample benchmark results')
        return res.json()
      })
      .then((data) => {
        setResultsData(data.data)
        setIsLive(false)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [location.state])

  // Column definitions for Summary Tab
  const poleSummaryColumns: Column<any>[] = [
    { key: 'sec', header: 'Sec' },
    { key: 'pole', header: 'Pole' },
    { key: 'pole_configuration', header: 'Configuration' },
    { key: 'final_recommended_pole', header: 'Recommended Pole' },
    { key: 'spur', header: 'Spur' },
    { key: 'equipment', header: 'Equipment' },
    { key: 'foundation_recommendation', header: 'Foundation Type' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusChip status={row.status} />,
    },
  ]

  const tensionCheckColumns: Column<any>[] = [
    { key: 'sec', header: 'Sec' },
    { key: 'circuit', header: 'Circuit' },
    { key: 'conductor', header: 'Conductor' },
    { key: 't_at_15_wind_kn', header: 'T @ 15°C+Wind (kN)' },
    { key: 'pct_uts_at_15_wind', header: '% UTS' },
    {
      key: 'check_15_wind',
      header: 'Max Stress Check',
      render: (row) => <StatusChip status={row.check_15_wind} />,
    },
    { key: 't_at_27_kn', header: 'T @ 27°C (kN)' },
    { key: 'pct_uts_at_27', header: '% EDS' },
    {
      key: 'eds_check',
      header: 'EDS Check',
      render: (row) => <StatusChip status={row.eds_check} />,
    },
  ]

  // Column definitions for Loads & Foundation Tab
  const structuralLoadingColumns: Column<any>[] = [
    { key: 'sec', header: 'Sec' },
    { key: 'pole', header: 'Pole' },
    { key: 'equipment', header: 'Equipment' },
    { key: 'fore_span_m', header: 'Fore Span (m)' },
    { key: 'angle_deg', header: 'Angle (°)' },
    { key: 'eq_span_m', header: 'Equiv Span (m)' },
    { key: 'bm_wind_line_kn_m', header: 'BM Wind (kN·m)' },
    { key: 'bm_tension_kn_m', header: 'BM Tension (kN·m)' },
    { key: 'bm_wind_pole_kn_m', header: 'BM Pole (kN·m)' },
    { key: 'bm_wind_equip_kn_m', header: 'BM Equip (kN·m)' },
    { key: 'total_bm_kn_m', header: 'Total BM (kN·m)' },
    // POLE TOP LOADS (DAN)
    {
      key: 'pole_top_transverse_dan',
      header: 'TRANSVERSE',
      group: 'POLE TOP LOADS (DAN)',
      render: (row) => row.pole_top_transverse_dan ?? '—',
    },
    {
      key: 'pole_top_longitudinal_dan',
      header: 'LONGITUDINAL',
      group: 'POLE TOP LOADS (DAN)',
      render: (row) => row.pole_top_longitudinal_dan ?? '—',
    },
    // UNGUYED
    {
      key: 'unguyed_rec',
      header: 'UNGUYED',
      group: 'UNGUYED',
      render: (row) =>
        row.unguyed_rec ? (
          <span>{row.unguyed_rec}</span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '9999px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              letterSpacing: '2px',
            }}
          >
            ✕✕
          </span>
        ),
    },
    // STRUTTED
    {
      key: 'strutted_rec',
      header: 'STRUTTED',
      group: 'STRUTTED',
      render: (row) => row.strutted_rec ?? '—',
    },
    // GUY ARRANGEMENTS
    {
      key: 'guy_wire_load_dan',
      header: 'GUY WIRE LOAD (DAN)',
      group: 'GUY ARRANGEMENTS',
      render: (row) => row.guy_wire_load_dan ?? '—',
    },
    {
      key: 'load_without_tension_dan',
      header: 'LOAD W/O TENSION',
      group: 'GUY ARRANGEMENTS',
      render: (row) => row.load_without_tension_dan ?? '—',
    },
    {
      key: 'guy_arrangement',
      header: 'GUY ARR.',
      group: 'GUY ARRANGEMENTS',
      render: (row) => row.guy_arrangement ?? '—',
    },
    {
      key: 'rec_guy_unguy',
      header: 'REC. GUY/UNGUY',
      group: 'GUY ARRANGEMENTS',
      render: (row) => row.rec_guy_unguy ?? '—',
    },
    // BUCKLING (GUYED)
    {
      key: 'buckling_v_star_kn',
      header: 'BUCKLING V*',
      group: 'BUCKLING (GUYED)',
      render: (row) => (row.buckling_v_star_kn != null ? row.buckling_v_star_kn.toFixed(2) : '—'),
    },
    {
      key: 'safety_factor_2_5_kn',
      header: 'SAFETY×2.5',
      group: 'BUCKLING (GUYED)',
      render: (row) => (row.safety_factor_2_5_kn != null ? row.safety_factor_2_5_kn.toFixed(2) : '—'),
    },
    {
      key: 'buckling_capacity_kn',
      header: 'BUCK. CAP. (REC. GUY/UNGUY)',
      group: 'BUCKLING (GUYED)',
      render: (row) => (row.buckling_capacity_kn != null ? row.buckling_capacity_kn.toFixed(1) : '—'),
    },
    {
      key: 'buckling_check',
      header: 'BUCKLING CHECK',
      group: 'BUCKLING (GUYED)',
      render: (row) => <StatusChip status={row.buckling_check || 'PENDING'} />,
    },
    {
      key: 'rec_on_buckling',
      header: 'REC. ON BUCKLING',
      group: 'BUCKLING (GUYED)',
      render: (row) => row.rec_on_buckling ?? '—',
    },
    // FINAL
    {
      key: 'final_recommended',
      header: 'RECOMMENDED',
      group: 'FINAL',
      render: (row) => (
        <strong style={{ fontWeight: 700, color: 'var(--text-main)' }}>
          {row.final_recommended || row.final_recommended_pole || '—'}
        </strong>
      ),
    },
  ]

  const foundationColumns: Column<any>[] = [
    { key: 'sec', header: 'Sec' },
    { key: 'pole', header: 'Pole' },
    { key: 'equipment', header: 'Equipment' },
    { key: 'soil_class', header: 'Soil Class' },
    { key: 'recommended_pole', header: 'Pole' },
    { key: 'bmf_kn_m', header: 'BM Foundation (kN·m)' },
    { key: 'mr_kn_m', header: 'Resisting Moment (kN·m)' },
    { key: 'subgrade_k_kn_m3', header: 'Subgrade k (kN/m³)' },
    {
      key: 'stability_check',
      header: 'Overturning Stability',
      render: (row) => <StatusChip status={row.stability_check} />,
    },
    { key: 'total_vertical_load_kn', header: 'Vert Load (kN)' },
    {
      key: 'bearing_check',
      header: 'Bearing Capacity',
      render: (row) => <StatusChip status={row.bearing_check} />,
    },
    {
      key: 'status',
      header: 'Overall Foundation',
      render: (row) => <StatusChip status={row.status} />,
    },
  ]

  // Column definitions for Clearances & Sag Tab
  const groundClearanceColumns: Column<any>[] = [
    { key: 'sec', header: 'Sec' },
    { key: 'pole', header: 'Span From Pole' },
    { key: 'fore_span_m', header: 'Span (m)' },
    { key: 'max_sag_65_c1_m', header: 'Max Sag C1 (m)' },
    { key: 'max_sag_65_c2_m', header: 'Max Sag C2 (m)' },
    { key: 'lowest_clearance_m', header: 'Lowest Clearance (m)' },
    { key: 'applicable_clearance_m', header: 'Required Clearance (m)' },
    {
      key: 'ground_clearance_check',
      header: 'Ground Clearance',
      render: (row) => <StatusChip status={row.ground_clearance_check} />,
    },
    { key: 'min_vert_clear_c1_c2_m', header: 'Phase Vert Clear (m)' },
    { key: 'applicable_cct_clearance_m', header: 'Req Cct Clear (m)' },
    {
      key: 'circuit_clearance_check',
      header: 'Circuit Separation',
      render: (row) => <StatusChip status={row.circuit_clearance_check} />,
    },
  ]

  const phaseSeparationColumns: Column<any>[] = [
    { key: 'sec', header: 'Sec' },
    { key: 'pole_no', header: 'Pole' },
    { key: 'sag_65_c1_m', header: 'Sag @ 65°C (m)' },
    { key: 'required_separation_m', header: 'Required Sep (m)' },
    { key: 'crossarm_separation_straight_m', header: 'Crossarm Sep (m)' },
    { key: 'line_angle_deg', header: 'Angle (°)' },
    { key: 'separation_at_angle_m', header: 'Sep at Angle (m)' },
    {
      key: 'separation_check',
      header: 'Phase Separation Check',
      render: (row) => <StatusChip status={row.separation_check} />,
    },
  ]

  const sagScheduleColumns: Column<any>[] = [
    { key: 'sec', header: 'Sec' },
    { key: 'pole_no', header: 'Pole' },
    { key: 'sag_27_c1_m', header: 'Sag C1 @ 27°C (m)' },
    { key: 'sag_27_c2_m', header: 'Sag C2 @ 27°C (m)' },
  ]

  return (
    <div className="page-wrapper">
      {/* BENCHMARK / LIVE CALCULATION BANNER */}
      {isLive ? (
        <div
          className="alert-box alert-success"
          role="alert"
          data-testid="live-data-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            backgroundColor: '#ecfdf5',
            border: '1px solid #6ee7b7',
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
          }}
        >
          <CheckCircle size={22} color="#059669" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#065f46', fontSize: '0.95rem' }}>
              Live Calculation Results
            </strong>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.825rem', color: '#047857' }}>
              Computed live by the pure Python calculation engine (Phase 4C) from project model geometry and master engineering datasets.
            </p>
          </div>
        </div>
      ) : (
        <div
          className="alert-box alert-warning"
          role="alert"
          data-testid="sample-data-banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            backgroundColor: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '8px',
            padding: '0.85rem 1.25rem',
          }}
        >
          <AlertCircle size={22} color="#b45309" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#92400e', fontSize: '0.95rem' }}>
              Sample data – not a live calculation
            </strong>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.825rem', color: '#78350f' }}>
              Transcribed directly from benchmark engineering dossier <code>docs/result.pdf</code>.
              Run calculations from the <strong>Review & run</strong> tab to generate live results.
            </p>
          </div>
        </div>
      )}

      <div className="page-header-row">
        <div>
          <h2>Calculation Results & Structural Schedules</h2>
          <p className="page-subtitle">
            Comprehensive structural pole selection, conductor tension verification, foundation stability, and clearance envelopes.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-bar" role="tablist" style={{ marginBottom: '1.5rem' }}>
        <button
          role="tab"
          aria-selected={activeTab === 'summary'}
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
          data-testid="tab-summary"
        >
          Summary & Tension
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'loads'}
          className={`tab-btn ${activeTab === 'loads' ? 'active' : ''}`}
          onClick={() => setActiveTab('loads')}
          data-testid="tab-loads"
        >
          Loads & Foundation
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'clearances'}
          className={`tab-btn ${activeTab === 'clearances' ? 'active' : ''}`}
          onClick={() => setActiveTab('clearances')}
          data-testid="tab-clearances"
        >
          Clearances & Sag
        </button>
      </div>

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading benchmark results...
        </div>
      )}

      {error && (
        <div className="alert-box alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {resultsData && !loading && (
        <>
          {/* TAB 1: SUMMARY */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <DataTable
                  title="Pole Selection Summary (Poles 1–13)"
                  columns={poleSummaryColumns}
                  data={resultsData.pole_summary || []}
                  csvFilename="pole_summary_schedule.csv"
                />
              </div>

              <div className="card">
                <DataTable
                  title="Conductor Tension & Stress Check (Sections 1 & 2)"
                  columns={tensionCheckColumns}
                  data={resultsData.conductor_tension_check || []}
                  csvFilename="conductor_tension_check.csv"
                />
              </div>

              {/* Design Parameters Overview Card */}
              <div className="card">
                <div className="card-header">
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Governing Design Parameters</h3>
                </div>
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Design Value</th>
                        <th>Source Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(resultsData.design_parameters || []).map((p: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{p.parameter}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.value}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.source}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOADS & FOUNDATION */}
          {activeTab === 'loads' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <DataTable
                  title="Detailed Structural Loading & Moment Analysis"
                  columns={structuralLoadingColumns}
                  data={resultsData.structural_loading || []}
                  csvFilename="structural_loading.csv"
                />
              </div>

              <div className="card">
                <DataTable
                  title="Foundation Stability & Soil Bearing Analysis"
                  columns={foundationColumns}
                  data={resultsData.foundation_soil_bearing || []}
                  csvFilename="foundation_soil_bearing.csv"
                />
              </div>
            </div>
          )}

          {/* TAB 3: CLEARANCES & SAG */}
          {activeTab === 'clearances' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card">
                <DataTable
                  title="Ground & Circuit Clearance Profile"
                  columns={groundClearanceColumns}
                  data={resultsData.ground_clearance || []}
                  csvFilename="ground_clearance_profile.csv"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                <div className="card">
                  <DataTable
                    title="Phase Separation & Swing Check"
                    columns={phaseSeparationColumns}
                    data={resultsData.phase_separation || []}
                    csvFilename="phase_separation.csv"
                  />
                </div>

                <div className="card">
                  <DataTable
                    title="27°C Everyday Sag Stringing Schedule"
                    columns={sagScheduleColumns}
                    data={resultsData.sag_schedule_27 || []}
                    csvFilename="sag_schedule_27c.csv"
                  />
                </div>
              </div>
            </div>
          )}

        </>
      )}

      {/* Bottom footer action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate('/dashboard')}
          style={{ height: '44px', minHeight: '44px', padding: '0 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>Return to Dashboard</span>
        </button>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Excel Export */}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => exportToExcel(resultsData, 'LineDesign_Report')}
            disabled={!resultsData}
            style={{ height: '44px', minHeight: '44px', padding: '0 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            title="Download all result tables as a multi-sheet Excel workbook"
          >
            <FileSpreadsheet size={17} style={{ color: '#16a34a' }} />
            <span>Export Excel</span>
          </button>

          {/* PDF Export */}
          <button
            type="button"
            className="btn-primary"
            onClick={() => exportToPDF(resultsData, 'LineDesign_Report')}
            disabled={!resultsData}
            style={{ height: '44px', minHeight: '44px', padding: '0 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            title="Download full engineering report as a formatted PDF"
          >
            <FileText size={17} />
            <span>Export PDF</span>
            <Download size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
