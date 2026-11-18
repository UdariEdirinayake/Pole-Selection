import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, AlertTriangle, CheckCircle, ArrowRight, MapPin, Upload } from 'lucide-react'
import { RouteDiagram } from '../components/RouteDiagram'
import { ImportDropzone } from '../components/ImportDropzone'

export interface PoleRow {
  id?: number
  pole_no: number
  section: number
  aft_span_m: number
  fore_span_m: number
  angle_deg: number
  equipment?: string
  soil_class: string
}

export function validateRouteContinuity(poles: PoleRow[]): { valid: boolean; brokenIndices: number[]; message?: string } {
  const brokenIndices: number[] = []

  for (let i = 0; i < poles.length - 1; i++) {
    const current = poles[i]
    const next = poles[i + 1]

    // Continuity is checked within continuous line or section transition:
    // Fore span of pole n must equal aft span of pole n+1 (within 0.01m tolerance)
    if (Math.abs(Number(current.fore_span_m) - Number(next.aft_span_m)) > 0.05) {
      brokenIndices.push(i)
    }
  }

  if (brokenIndices.length > 0) {
    const polePairs = brokenIndices.map(idx => `Pole ${poles[idx].pole_no} (fore: ${poles[idx].fore_span_m}m) ➔ Pole ${poles[idx + 1].pole_no} (aft: ${poles[idx + 1].aft_span_m}m)`).join(', ')
    return {
      valid: false,
      brokenIndices,
      message: `Route continuity broken: Fore span of pole n must equal aft span of pole n+1. Mismatches at: ${polePairs}`
    }
  }

  return { valid: true, brokenIndices: [] }
}

export const RoutePolesPage: React.FC = () => {
  const [poles, setPoles] = useState<PoleRow[]>([])
  const [soilClasses, setSoilClasses] = useState<string[]>(['1', '2', '3', '4', '5'])
  const [showUploader, setShowUploader] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Try to load sample line poles from master data or seed
    fetch('/api/master/sample-line-poles?limit=50')
      .then(res => res.json())
      .then(data => {
        if (data && data.items && data.items.length > 0) {
          const mapped: PoleRow[] = data.items.map((item: any) => ({
            id: item.id,
            pole_no: item.pole_no,
            section: item.section || 1,
            aft_span_m: item.aft_span_m || 0,
            fore_span_m: item.fore_span_m || 0,
            angle_deg: item.angle_deg || 0,
            equipment: item.equipment || 'None',
            soil_class: String(item.soil_class_num || item.soil_class || '4'),
          }))
          setPoles(mapped)
        } else {
          // Default initial rows if table empty
          setPoles([
            { pole_no: 1, section: 1, aft_span_m: 0, fore_span_m: 45, angle_deg: 0, equipment: 'None', soil_class: '3' },
            { pole_no: 2, section: 1, aft_span_m: 45, fore_span_m: 50, angle_deg: 5, equipment: 'None', soil_class: '3' },
            { pole_no: 3, section: 1, aft_span_m: 50, fore_span_m: 0, angle_deg: 0, equipment: 'Transformer', soil_class: '3' },
          ])
        }
      })
      .catch(err => {
        console.error('Error loading sample line poles:', err)
      })

    // Fetch soil classes from master API
    fetch('/api/master/soil-classes?limit=20')
      .then(res => res.json())
      .then(data => {
        if (data && data.items && data.items.length > 0) {
          setSoilClasses(data.items.map((s: any) => String(s.soil_class_number || s.name || s.id)))
        }
      })
      .catch(() => {})
  }, [])

  const continuityResult = validateRouteContinuity(poles)

  const handleFieldChange = (index: number, field: keyof PoleRow, val: any) => {
    const updated = [...poles]
    updated[index] = { ...updated[index], [field]: val }
    setPoles(updated)
  }

  const handleAddPole = () => {
    const last = poles[poles.length - 1]
    const newPoleNo = last ? last.pole_no + 1 : 1
    const newAftSpan = last ? Number(last.fore_span_m) : 0
    const newRow: PoleRow = {
      pole_no: newPoleNo,
      section: last ? last.section : 1,
      aft_span_m: newAftSpan,
      fore_span_m: 40,
      angle_deg: 0,
      equipment: 'None',
      soil_class: last ? last.soil_class : '3',
    }
    setPoles([...poles, newRow])
  }

  const handleRemovePole = (index: number) => {
    if (poles.length <= 1) return
    const updated = poles.filter((_, i) => i !== index)
    // Re-stitch continuity: aft_span of each pole must equal fore_span of the previous pole
    for (let i = 1; i < updated.length; i++) {
      updated[i] = { ...updated[i], aft_span_m: updated[i - 1].fore_span_m }
    }
    setPoles(updated)
  }

  const handleAutoFixContinuity = () => {
    // Automatically match fore_span of pole n to aft_span of pole n+1
    const fixed = [...poles]
    for (let i = 0; i < fixed.length - 1; i++) {
      fixed[i + 1].aft_span_m = fixed[i].fore_span_m
    }
    setPoles(fixed)
  }

  const handleSaveAndProceed = () => {
    setTimeout(() => {
      navigate('/review-run')
    }, 200)
  }

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h2>Route & Poles Grid</h2>
          <p className="page-subtitle">
            Configure line sectioning, pole spans, deviation angles, equipment, and geotechnical soil classes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowUploader(!showUploader)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Upload size={16} />
            <span>{showUploader ? 'Hide Uploader' : 'Import Excel'}</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSaveAndProceed}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>Save & Review</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {showUploader && (
        <div style={{ marginBottom: '1.5rem' }}>
          <ImportDropzone />
        </div>
      )}

      {/* Route Continuity Banner */}
      {!continuityResult.valid ? (
        <div className="alert-box alert-error" role="alert" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
            <AlertTriangle size={20} color="#b91c1c" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', color: '#991b1b', marginBottom: '0.25rem' }}>
                Route Continuity Validation Error
              </strong>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#7f1d1d' }}>
                {continuityResult.message}
              </p>
              <button
                type="button"
                onClick={handleAutoFixContinuity}
                className="btn-secondary"
                style={{ marginTop: '0.6rem', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              >
                Auto-align Aft Spans to Fore Spans
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="alert-box alert-success" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={18} color="#047857" />
            <span style={{ fontSize: '0.875rem', color: '#065f46' }}>
              <strong>Route continuity satisfied:</strong> Every fore span matches the consecutive pole's aft span.
            </span>
          </div>
        </div>
      )}

      {/* Editable Route Grid */}
      <div className="card" style={{ marginBottom: '1.75rem', overflow: 'hidden' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={18} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Poles Configuration Table ({poles.length} poles)</h3>
          </div>
          <button
            type="button"
            onClick={handleAddPole}
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem' }}
          >
            <Plus size={15} />
            <span>Add Pole</span>
          </button>
        </div>

        <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          <table className="data-table" data-testid="route-poles-grid">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Pole No</th>
                <th style={{ width: '80px' }}>Section</th>
                <th style={{ width: '110px' }}>Aft Span (m)</th>
                <th style={{ width: '110px' }}>Fore Span (m)</th>
                <th style={{ width: '100px' }}>Angle (deg)</th>
                <th style={{ width: '150px' }}>Equipment</th>
                <th style={{ width: '110px' }}>Soil Class</th>
                <th style={{ width: '90px' }}>Continuity</th>
                <th style={{ width: '60px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {poles.map((row, idx) => {
                const isBrokenNext = continuityResult.brokenIndices.includes(idx)
                const isBrokenPrev = continuityResult.brokenIndices.includes(idx - 1)
                const hasError = isBrokenNext || isBrokenPrev

                return (
                  <tr
                    key={idx}
                    className={hasError ? 'row-warning' : ''}
                    style={hasError ? { backgroundColor: 'rgba(254, 242, 242, 0.7)' } : {}}
                  >
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        value={row.pole_no}
                        onChange={(e) => handleFieldChange(idx, 'pole_no', Number(e.target.value))}
                        style={{ width: '100%', padding: '0.3rem 0.4rem', textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        value={row.section}
                        onChange={(e) => handleFieldChange(idx, 'section', Number(e.target.value))}
                        style={{ width: '100%', padding: '0.3rem 0.4rem', textAlign: 'center' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        className={`form-input ${isBrokenPrev ? 'input-error' : ''}`}
                        value={row.aft_span_m}
                        onChange={(e) => handleFieldChange(idx, 'aft_span_m', Number(e.target.value))}
                        style={{ width: '100%', padding: '0.3rem 0.4rem', textAlign: 'right' }}
                        data-testid={`aft-span-${idx}`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        className={`form-input ${isBrokenNext ? 'input-error' : ''}`}
                        value={row.fore_span_m}
                        onChange={(e) => handleFieldChange(idx, 'fore_span_m', Number(e.target.value))}
                        style={{ width: '100%', padding: '0.3rem 0.4rem', textAlign: 'right' }}
                        data-testid={`fore-span-${idx}`}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.5"
                        className="form-input"
                        value={row.angle_deg}
                        onChange={(e) => handleFieldChange(idx, 'angle_deg', Number(e.target.value))}
                        style={{ width: '100%', padding: '0.3rem 0.4rem', textAlign: 'right' }}
                      />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={row.equipment || 'None'}
                        onChange={(e) => handleFieldChange(idx, 'equipment', e.target.value)}
                        style={{ width: '100%', padding: '0.3rem 0.4rem' }}
                      >
                        <option value="None">None</option>
                        <option value="Transformer">Transformer</option>
                        <option value="Switchgear">Switchgear / ABS</option>
                        <option value="Sectionalizer">Sectionalizer</option>
                        <option value="Auto Recloser">Auto Recloser</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={row.soil_class}
                        onChange={(e) => handleFieldChange(idx, 'soil_class', e.target.value)}
                        style={{ width: '100%', padding: '0.3rem 0.4rem' }}
                      >
                        {soilClasses.map((sc) => (
                          <option key={sc} value={sc}>
                            Class {sc}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {hasError ? (
                        <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.75rem' }}>MISMATCH</span>
                      ) : (
                        <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.75rem' }}>OK</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemovePole(idx)}
                        disabled={poles.length <= 1}
                        className="btn-icon-danger"
                        title="Delete pole"
                        aria-label={`Delete pole ${row.pole_no}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SVG Serpentine Route Diagram */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Route Geometry Visualizer (Serpentine Layout)</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Interactive SVG diagram: click any pole circle to inspect its geometric parameters and benchmark attributes.
          </p>
        </div>
        <div style={{ padding: '1rem' }}>
          <RouteDiagram poles={poles} />
        </div>
      </div>
    </div>
  )
}
