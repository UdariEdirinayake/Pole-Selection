import React, { useState, useEffect } from 'react'
import { DataTable, Column } from '../components/DataTable'
import { StatusChip } from '../components/StatusChip'
import { RouteDiagram } from '../components/RouteDiagram'
import { AlertCircle, FileSpreadsheet, CheckCircle2, Sliders, Layers } from 'lucide-react'

export const ResultsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'loads' | 'clearances'>('summary')
  const [resultsData, setResultsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch('/api/results/sample')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load sample benchmark results')
        return res.json()
      })
      .then((data) => {
        setResultsData(data.data)
      })
      .catch((err) => {
        console.error(err)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

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
    { key: 'fore_span_m', header: 'Fore Span (m)' },
    { key: 'angle_deg', header: 'Angle (°)' },
    { key: 'eq_span_m', header: 'Equiv Span (m)' },
    { key: 'bm_wind_line_kn_m', header: 'BM Line (kN·m)' },
    { key: 'bm_tension_kn_m', header: 'BM Tension (kN·m)' },
    { key: 'bm_wind_pole_kn_m', header: 'BM Pole (kN·m)' },
    { key: 'bm_wind_equip_kn_m', header: 'BM Equip (kN·m)' },
    { key: 'total_bm_kn_m', header: 'Total BM (kN·m)' },
    {
      key: 'pole_top_loads',
      header: 'Pole-Top Loads',
      render: (row) => <StatusChip status="PENDING" label={row.pole_top_loads || 'Pending'} />,
    },
    {
      key: 'buckling_capacity',
      header: 'Buckling Check',
      render: (row) => <StatusChip status="PENDING" label={row.buckling_capacity || 'Pending'} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusChip status={row.status} />,
    },
  ]

  const foundationColumns: Column<any>[] = [
    { key: 'sec', header: 'Sec' },
    { key: 'pole', header: 'Pole' },
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

  // Map poles for RouteDiagram
  const diagramPoles = (resultsData?.pole_summary || []).map((p: any, idx: number) => {
    const loadingRow = resultsData?.structural_loading?.find((l: any) => l.pole === p.pole)
    return {
      pole_no: p.pole,
      section: p.sec,
      aft_span_m: idx === 0 ? 0 : resultsData?.structural_loading?.[idx - 1]?.fore_span_m || 30,
      fore_span_m: loadingRow?.fore_span_m || 30,
      angle_deg: loadingRow?.angle_deg || 0,
      equipment: p.equipment,
      status: p.status,
    }
  })

  return (
    <div className="page-wrapper">
      {/* REQUIRED PHASE 2 BENCHMARK BANNER */}
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
            Live engine computation integration will occur in Phase 3.
          </p>
        </div>
      </div>

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
                  title="Structural Loading Analysis (Bending Moments)"
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

          {/* Embedded Route Geometry Visualizer */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-header">
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Interactive Route Geometry & Pole Inspector</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Click on any pole in the serpentine diagram to open an in-depth telemetry panel showing its row across all benchmark result tables.
              </p>
            </div>
            <div style={{ padding: '1rem' }}>
              <RouteDiagram
                poles={diagramPoles}
                resultData={{
                  summary: resultsData.pole_summary,
                  loads: resultsData.structural_loading,
                  foundation: resultsData.foundation_soil_bearing,
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
