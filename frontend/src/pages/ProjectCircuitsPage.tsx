import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Layers, Activity } from 'lucide-react'
import { useProject } from '../context/ProjectContext'
import { DEFAULT_LINE_POLES } from '../data/defaultPoles'
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
  const { activeProject, setActiveProject, refreshProjects } = useProject()
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
      .catch((err) => console.error('Failed to fetch conductors:', err))
  }, [])

  // If an active project exists, load its settings
  useEffect(() => {
    if (!activeProject?.id) return
    fetch(`/api/projects/${activeProject.id}`)
      .then((res) => {
        if (res.ok) return res.json()
        return null
      })
      .then((proj) => {
        if (proj) {
          if (proj.name) setProjectName(proj.name)
          if (proj.description !== undefined) setDescription(proj.description || '')
          if (proj.line_arrangement) {
            setArrangement(proj.line_arrangement as '11 kV' | 'LV' | '11 kV + LV')
          }
          if (proj.circuits && proj.circuits.length > 0) {
            const c1 = proj.circuits.find(
              (c: any) => (c.circuit_name && c.circuit_name.includes('11')) || (c.nominal_voltage_kv && c.nominal_voltage_kv > 1)
            ) || proj.circuits[0]
            const c2 = proj.circuits.find(
              (c: any) => (c.circuit_name && c.circuit_name.includes('LV')) || (c.nominal_voltage_kv && c.nominal_voltage_kv < 1)
            ) || (proj.circuits.length > 1 ? proj.circuits[1] : proj.circuits[0])

            if (c1 && c1.conductor_code != null) {
              setC1Conductor(Number(c1.conductor_code))
            }
            if (c2 && c2.conductor_code != null) {
              setC2Conductor(Number(c2.conductor_code))
            }
          }
        }
      })
      .catch((err) => console.error('Failed to load project details:', err))
  }, [activeProject?.id])

  const selectedC1 = conductors.find((c) => Number(c.code) === Number(c1Conductor))
  const selectedC2 = conductors.find((c) => Number(c.code) === Number(c2Conductor))

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)

    const circuits = []
    if (arrangement === '11 kV' || arrangement === '11 kV + LV') {
      circuits.push({
        circuit_name: 'C1 (11kV)',
        nominal_voltage_kv: 11.0,
        circuit_type: 'Overhead ABC',
        conductor_code: selectedC1 ? Number(selectedC1.code) : (c1Conductor ? Number(c1Conductor) : 1),
        conductor_name: selectedC1?.description || '',
        lookup_table: selectedC1?.lookup_table || null,
      })
    }
    if (arrangement === 'LV' || arrangement === '11 kV + LV') {
      circuits.push({
        circuit_name: 'C2 (LV)',
        nominal_voltage_kv: 0.4,
        circuit_type: 'Overhead ABC',
        conductor_code: selectedC2 ? Number(selectedC2.code) : (c2Conductor ? Number(c2Conductor) : 1),
        conductor_name: selectedC2?.description || '',
        lookup_table: selectedC2?.lookup_table || null,
      })
    }

    try {
      if (activeProject?.id) {
        // Update existing active project
        const res = await fetch(`/api/projects/${activeProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: projectName,
            description: description,
            line_arrangement: arrangement,
            circuits: circuits,
          }),
        })
        if (res.ok) {
          await refreshProjects()
          setSavedSuccess(true)
          setTimeout(() => navigate('/route-poles'), 400)
        } else {
          const err = await res.json().catch(() => ({}))
          alert(err.detail || 'Failed to save project.')
        }
      } else {
        // Create new project with standard 13 route poles
        const initialPoles = DEFAULT_LINE_POLES.map((p) => ({
          section: p.section,
          pole_no: p.pole_no,
          pole_id_name: `Pole ${p.pole_no}`,
          aft_span_m: p.aft_span_m,
          fore_span_m: p.fore_span_m,
          angle_deg: p.angle_deg,
          soil_class_num: Number(p.soil_class) || 4,
          equipment: p.equipment !== 'None' ? p.equipment : null,
          span_environment: 'across any road or street',
        }))

        const res = await fetch('/api/projects/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: projectName,
            description: description,
            line_arrangement: arrangement,
            circuits: circuits,
            poles: initialPoles,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const projs = await refreshProjects()
          const matched = projs.find((p) => p.id === data.id)
          if (matched) {
            setActiveProject(matched)
          } else if (data.id) {
            setActiveProject({
              id: data.id,
              name: projectName,
              description: description,
              line_arrangement: arrangement,
              status: 'Not calculated',
              pole_count: initialPoles.length,
              circuit_count: circuits.length,
            })
          }
          setSavedSuccess(true)
          setTimeout(() => navigate('/route-poles'), 400)
        } else {
          const err = await res.json().catch(() => ({}))
          alert(err.detail || 'Failed to create project.')
        }
      }
    } catch (err) {
      console.error('Error saving project circuits:', err)
      alert('Network error while saving project.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Project & Circuits Setup"
        description="Configure line project identification, structural framing arrangement, and phase conductor specifications"
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
                  value={c1Conductor ?? ''}
                  onChange={(e) => setC1Conductor(Number(e.target.value))}
                >
                  {conductors.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.description}
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
                  value={c2Conductor ?? ''}
                  onChange={(e) => setC2Conductor(Number(e.target.value))}
                >
                  {conductors.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.description}
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
            <span>{saving ? 'Saving Project...' : 'Save & Next: Route & Poles'}</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </form>
    </div>
  )
}
