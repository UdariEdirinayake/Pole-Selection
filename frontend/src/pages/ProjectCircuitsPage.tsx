import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Layers, Activity } from 'lucide-react'
import {
  PageHeader,
  Card,
  FormField,
  SelectCard,
  StatusChip,
} from '../components/layout'

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
  const [c2Conductor, setC2Conductor] = useState<number | ''>(1)
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

  const actions = (
    <button
      type="button"
      onClick={handleSave}
      disabled={saving}
      className="btn-primary"
    >
      <span>{saving ? 'Saving Project...' : 'Save & Continue to Route'}</span>
      <ArrowRight size={16} />
    </button>
  )

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Project & Circuits Setup"
        description="Configure line project identification, structural framing arrangement, and phase conductor specifications"
        actions={actions}
      />

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Card 1: Project Identification (2-column grid) */}
        <Card
          title="1. Project Identification"
          subtitle="General administrative attributes and survey geographical references"
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <FormField label="Project Name / Reference" htmlFor="projectName" required>
              <input
                id="projectName"
                type="text"
                className="form-input"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Kelaniya Feeder Section 1-2"
              />
            </FormField>

            <FormField
              label="Description / Region Area"
              htmlFor="description"
              hint="Optional design brief or client reference code"
            >
              <input
                id="description"
                type="text"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Standard 11 kV + LV common pole line section"
              />
            </FormField>
          </div>
        </Card>

        {/* Card 2: Line Arrangement Options (3 SelectCards in one row) */}
        <Card
          title="2. Line Structure Arrangement"
          subtitle="Select distribution line electrical voltage framing and circuit configuration"
        >
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <SelectCard
              selected={arrangement === '11 kV'}
              onClick={() => setArrangement('11 kV')}
              title="11 kV Only"
              description="Single overhead 11 kV medium-voltage distribution circuit with crossarm framing."
              badge="Medium Voltage"
              icon={<Zap size={18} />}
            />

            <SelectCard
              selected={arrangement === 'LV'}
              onClick={() => setArrangement('LV')}
              title="LV Only (0.4 kV)"
              description="Single low-voltage aerial bundled conductor (ABC) distribution circuit."
              badge="Low Voltage"
              icon={<Activity size={18} />}
            />

            <SelectCard
              selected={arrangement === '11 kV + LV'}
              onClick={() => setArrangement('11 kV + LV')}
              title="11 kV + LV (Combined)"
              description="Dual circuit sharing common distribution poles. Upper 11 kV crossarm with lower LV ABC bracket."
              badge="Standard Common Pole"
              icon={<Layers size={18} />}
            />
          </div>
        </Card>

        {/* Circuit 1 Card: 11 kV */}
        {(arrangement === '11 kV' || arrangement === '11 kV + LV') && (
          <Card
            title="Circuit 1 — 11 kV Medium Voltage"
            subtitle="Conductor mechanical parameters and sag-tension lookup mapping"
            actions={
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary-border)',
                }}
              >
                {selectedC1 ? selectedC1.description : '11.0 kV Overhead ABC'}
              </span>
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <FormField
                label="Primary Conductor Specification"
                htmlFor="c1_cond"
                required
                hint="Loaded from versioned master database table 'conductor'"
              >
                <select
                  id="c1_cond"
                  className="form-select"
                  value={c1Conductor}
                  onChange={(e) => setC1Conductor(Number(e.target.value))}
                >
                  {conductors.map((c) => (
                    <option key={c.code} value={c.code}>
                      Code {c.code}: {c.description} {c.lookup_table ? `(Table: ${c.lookup_table})` : '(No Table)'}
                    </option>
                  ))}
                </select>
              </FormField>

              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Linked Sag-Tension Lookup Table
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {selectedC1?.lookup_table || 'None assigned'}
                </div>
                {selectedC1?.needs_confirmation && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <StatusChip status="CAUTION" label="REQUIRES CONFIRMATION" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning-text)' }}>
                      {selectedC1.confirmation_note || 'Requires confirmation'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Circuit 2 Card: LV */}
        {(arrangement === 'LV' || arrangement === '11 kV + LV') && (
          <Card
            title="Circuit 2 — Low Voltage (0.4 kV)"
            subtitle="Conductor mechanical parameters and sag-tension lookup mapping"
            actions={
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-subtle)',
                  color: 'var(--primary)',
                  border: '1px solid var(--primary-border)',
                }}
              >
                {selectedC2 ? selectedC2.description : '0.4 kV Aerial Bundled Conductor'}
              </span>
            }
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <FormField
                label="Secondary Conductor Specification"
                htmlFor="c2_cond"
                required
                hint="Loaded from versioned master database table 'conductor'"
              >
                <select
                  id="c2_cond"
                  className="form-select"
                  value={c2Conductor}
                  onChange={(e) => setC2Conductor(Number(e.target.value))}
                >
                  {conductors.map((c) => (
                    <option key={c.code} value={c.code}>
                      Code {c.code}: {c.description} {c.lookup_table ? `(Table: ${c.lookup_table})` : '(No Table)'}
                    </option>
                  ))}
                </select>
              </FormField>

              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Linked Sag-Tension Lookup Table
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                  {selectedC2?.lookup_table || 'None assigned'}
                </div>
                {selectedC2?.needs_confirmation && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <StatusChip status="CAUTION" label="REQUIRES CONFIRMATION" />
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning-text)' }}>
                      {selectedC2.confirmation_note || 'Requires confirmation'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Footer Actions Card */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
          {savedSuccess && (
            <span style={{ color: 'var(--success-main)', fontSize: '0.875rem', fontWeight: 600 }}>
              Project configuration saved successfully! Navigating to route survey...
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ height: '44px', minHeight: '44px', padding: '0 1.5rem' }}
          >
            <span>{saving ? 'Saving Project...' : 'Save & Continue to Route'}</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </div>
  )
}
