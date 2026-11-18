import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Play } from 'lucide-react'

interface ValidationItem {
  id: string
  title: string
  detail: string
  status: 'ready' | 'warning' | 'blocking'
  category: 'Project & Circuits' | 'Route & Spans' | 'Geotechnical' | 'Clearances'
}

export const ReviewRunPage: React.FC = () => {
  const navigate = useNavigate()

  // Sample frontend validation checklist
  const [items] = useState<ValidationItem[]>([
    {
      id: 'circuits-config',
      title: 'Circuits arrangement selected',
      detail: 'Arrangement set to "11 kV + LV" with 2 circuit configurations assigned.',
      status: 'ready',
      category: 'Project & Circuits',
    },
    {
      id: 'conductor-lookup',
      title: 'Primary conductor sag-tension table linked',
      detail: 'Conductor code 1 (3/4/2.74 mm) mapped to lookup table "UD-2.74".',
      status: 'ready',
      category: 'Project & Circuits',
    },
    {
      id: 'conductor-confirm',
      title: 'Conductor needs confirmation flag',
      detail: 'LV conductor has needs_confirmation = true from source sheet note. Review recommended before final construction drawing.',
      status: 'warning',
      category: 'Project & Circuits',
    },
    {
      id: 'route-continuity',
      title: 'Route span continuity verified',
      detail: 'All consecutive spans match across poles 1 to 13 (fore span of pole n = aft span of pole n+1).',
      status: 'ready',
      category: 'Route & Spans',
    },
    {
      id: 'soil-bearing',
      title: 'Soil classes assigned for all poles',
      detail: 'Poles have assigned geotechnical classes (Class 2 to Class 4). Embedment depth ratio 1/6 (0.1667) applied.',
      status: 'ready',
      category: 'Geotechnical',
    },
    {
      id: 'wind-spec',
      title: 'Design wind pressures initialized',
      detail: 'Conductor wind pressure: 575 N/m² (confirmed by project owner); pole wind pressure: 865 N/m².',
      status: 'ready',
      category: 'Clearances',
    },
  ])

  const blockingItems = items.filter((i) => i.status === 'blocking')
  const warningItems = items.filter((i) => i.status === 'warning')
  const readyItems = items.filter((i) => i.status === 'ready')

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h2>Review & Run Calculation</h2>
          <p className="page-subtitle">
            Pre-flight model validation and integrity audit before structural analysis execution.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/results')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>View Benchmark Results</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Validation Summary Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="stat-label">Blocking Issues</div>
          <div className="stat-val" style={{ color: blockingItems.length > 0 ? '#dc2626' : 'var(--text-color)' }}>
            {blockingItems.length}
          </div>
          <p className="stat-sub">Must be resolved prior to calculation</p>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-label">Warnings</div>
          <div className="stat-val" style={{ color: '#d97706' }}>{warningItems.length}</div>
          <p className="stat-sub">Review advised (will not block calculation)</p>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-label">Ready Checks</div>
          <div className="stat-val" style={{ color: '#059669' }}>{readyItems.length}</div>
          <p className="stat-sub">Verified against master engineering constraints</p>
        </div>
      </div>

      {/* Run Action Box */}
      <div className="card" style={{ marginBottom: '1.75rem', padding: '1.25rem', backgroundColor: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 600 }}>Calculation Engine Status</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Phase 2 UI Shell active. Engineering calculation engine integration is scheduled for Phase 3.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn-primary"
              disabled
              style={{
                cursor: 'not-allowed',
                opacity: 0.6,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              data-testid="run-calc-btn"
            >
              <Play size={16} />
              <span>Run calculations (Available in a later phase)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Pre-Flight Audit Checklist</h3>
        </div>

        <div style={{ padding: '1rem' }}>
          {/* Blocking Section */}
          {blockingItems.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#dc2626' }}>
                <XCircle size={18} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Blocking Items ({blockingItems.length})</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {blockingItems.map((item) => (
                  <div key={item.id} className="validation-item blocking" style={{ borderLeft: '4px solid #dc2626' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings Section */}
          {warningItems.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#d97706' }}>
                <AlertTriangle size={18} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Warnings ({warningItems.length})</h4>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {warningItems.map((item) => (
                  <div key={item.id} className="validation-item warning" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{item.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ready Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#059669' }}>
              <CheckCircle2 size={18} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Ready Items ({readyItems.length})</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {readyItems.map((item) => (
                <div key={item.id} className="validation-item ready" style={{ borderLeft: '4px solid #10b981' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
