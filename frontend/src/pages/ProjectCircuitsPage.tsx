import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Check, Layers, ArrowRight } from 'lucide-react'

interface ConductorOption {
  code: number
  description: string
  lookup_table: string | null
  needs_confirmation: boolean
  confirmation_note: string | null
}

export const ProjectCircuitsPage: React.FC = () => {
  const [arrangement, setArrangement] = useState<'11 kV' | 'LV' | '11 kV + LV'>('11 kV + LV')
  const [projectName, setProjectName] = useState('Kelaniya Distribution Feeder')
  const [description, setDescription] = useState('Standard 11 kV + LV common pole line section')
  const [conductors, setConductors] = useState<ConductorOption[]>([])
  const [c1Conductor, setC1Conductor] = useState<number | ''>(1)
  const [c2Conductor, setC2Conductor] = useState<number | ''>(2)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch conductors from master API
    fetch('/api/master/conductors?limit=50')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.items) {
          setConductors(data.items)
        }
      })
      .catch((err) => console.error(err))
  }, [])

  const selectedC1 = conductors.find((c) => c.code === Number(c1Conductor))
  const selectedC2 = conductors.find((c) => c.code === Number(c2Conductor))

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)

    const circuits = []
    if (arrangement === '11 kV' || arrangement === '11 kV + LV') {
      circuits.push({
        circuit_name: 'C1 (11kV)',
        nominal_voltage_kv: 11.0,
        circuit_type: 'Overhead ABC',
        conductor_code: selectedC1?.code,
        conductor_name: selectedC1?.description,
        lookup_table: selectedC1?.lookup_table,
      })
    }
    if (arrangement === 'LV' || arrangement === '11 kV + LV') {
      circuits.push({
        circuit_name: 'C2 (LV)',
        nominal_voltage_kv: 0.4,
        circuit_type: 'Overhead ABC',
        conductor_code: selectedC2?.code,
        conductor_name: selectedC2?.description,
        lookup_table: selectedC2?.lookup_table,
      })
    }

    try {
      const res = await fetch('/api/projects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: description,
          line_arrangement: arrangement,
          circuits: circuits,
          poles: [],
        }),
      })
      if (res.ok) {
        setSavedSuccess(true)
        setTimeout(() => navigate('/route-poles'), 800)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h2>Project & Circuits Setup</h2>
          <p className="page-subtitle">Configure line arrangement and conductor framing</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="form-card">
        {/* Project Details */}
        <div className="form-section">
          <h3>1. Project Identification</h3>
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="projectName">Project Name / Reference</label>
              <input
                id="projectName"
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="description">Description / Area</label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Line Arrangement Choice */}
        <div className="form-section">
          <h3>2. Line Structure Arrangement</h3>
          <p className="section-desc">Choose distribution line voltage configuration:</p>
          <div className="arrangement-selector">
            {(['11 kV', 'LV', '11 kV + LV'] as const).map((opt) => (
              <label
                key={opt}
                className={`arrangement-option ${arrangement === opt ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="arrangement"
                  value={opt}
                  checked={arrangement === opt}
                  onChange={() => setArrangement(opt)}
                />
                <span className="arrangement-label">{opt}</span>
                <span className="arrangement-sub">
                  {opt === '11 kV + LV'
                    ? 'Shared common poles'
                    : opt === '11 kV'
                    ? 'Single 11 kV circuit'
                    : 'Low voltage bundled'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Conductor Selection */}
        <div className="form-section">
          <h3>3. Circuit Conductors Selection</h3>
          <div className="form-grid-2">
            {/* Circuit 1 (11 kV) */}
            {(arrangement === '11 kV' || arrangement === '11 kV + LV') && (
              <div className="circuit-box">
                <h4>Circuit 1 (11 kV)</h4>
                <div className="form-group">
                  <label htmlFor="c1_cond">Conductor</label>
                  <select
                    id="c1_cond"
                    value={c1Conductor}
                    onChange={(e) => setC1Conductor(Number(e.target.value))}
                  >
                    {conductors.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.description} {c.lookup_table ? `(Table: ${c.lookup_table})` : '(No Table)'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedC1?.needs_confirmation && (
                  <div className="warning-chip-box">
                    <AlertTriangle size={15} color="#ca8a04" />
                    <span>
                      <strong>Warning:</strong> {selectedC1.confirmation_note || 'Requires confirmation'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Circuit 2 (LV) */}
            {(arrangement === 'LV' || arrangement === '11 kV + LV') && (
              <div className="circuit-box">
                <h4>Circuit 2 (LV)</h4>
                <div className="form-group">
                  <label htmlFor="c2_cond">Conductor</label>
                  <select
                    id="c2_cond"
                    value={c2Conductor}
                    onChange={(e) => setC2Conductor(Number(e.target.value))}
                  >
                    {conductors.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.description} {c.lookup_table ? `(Table: ${c.lookup_table})` : '(No Table)'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedC2?.needs_confirmation && (
                  <div className="warning-chip-box">
                    <AlertTriangle size={15} color="#ca8a04" />
                    <span>
                      <strong>Warning:</strong> {selectedC2.confirmation_note || 'Requires confirmation'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions-bar">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save & Continue to Route'}
            <ArrowRight size={16} style={{ marginLeft: '6px' }} />
          </button>
          {savedSuccess && <span className="text-success"><Check size={16} /> Saved!</span>}
        </div>
      </form>
    </div>
  )
}
