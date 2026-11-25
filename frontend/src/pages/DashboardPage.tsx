import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Trash2, FolderOpen, Save } from 'lucide-react'
import { useProject } from '../context/ProjectContext'

interface ProjectItem {
  id: number
  name: string
  description?: string
  line_arrangement: string
  status: string
  updated_at: string
  pole_count: number
  circuit_count: number
}

export const DashboardPage: React.FC = () => {
  const { setActiveProject } = useProject()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [voltageFilter, setVoltageFilter] = useState('ALL')
  const navigate = useNavigate()

  const loadProjects = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/projects/')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleDeleteProject = async (projectId: number, projectName: string) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"?`)) {
      return
    }
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await loadProjects()
      } else {
        alert('Failed to delete project.')
      }
    } catch (e) {
      console.error(e)
      alert('Error deleting project.')
    }
  }

  const handleOpenProject = (project: ProjectItem) => {
    setActiveProject(project)
    navigate('/route-poles')
  }

  const handleNewProject = () => {
    setActiveProject(null)
    navigate('/project-circuits')
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSaveProjectToDevice = async (project: ProjectItem) => {
    try {
      const res = await fetch(`/api/projects/${project.id}`)
      if (!res.ok) throw new Error('Failed to fetch project data')
      const data = await res.json()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(project.name || 'project').replace(/[^a-zA-Z0-9_-]/g, '_')}_linedesign.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: any) {
      alert('Save failed: ' + e.message)
    }
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      // Create the project via API
      const res = await fetch('/api/projects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name || file.name.replace('_linedesign.json', ''),
          description: data.description || '',
          line_arrangement: data.line_arrangement || '11 kV + LV',
          circuits: (data.circuits || []).map((c: any) => ({
            circuit_name: c.circuit_name,
            nominal_voltage_kv: c.nominal_voltage_kv,
            circuit_type: c.circuit_type || 'Overhead ABC',
            conductor_code: c.conductor_code,
            conductor_name: c.conductor_name,
            lookup_table: c.lookup_table,
          })),
          poles: (data.poles || []).map((p: any) => ({
            section: p.section || 1,
            pole_no: p.pole_no,
            aft_span_m: p.aft_span_m || 0,
            fore_span_m: p.fore_span_m || 0,
            angle_deg: p.angle_deg || 0,
            soil_class_num: p.soil_class_num || 4,
            equipment: p.equipment,
            span_environment: p.span_environment || 'across any road or street',
          })),
        }),
      })
      if (!res.ok) throw new Error('Failed to import project')
      const created = await res.json()
      await loadProjects()
      // Set as active and navigate
      const all = await fetch('/api/projects/').then(r => r.json())
      const newProj = all.find((p: any) => p.id === created.id) || all[0]
      if (newProj) { setActiveProject(newProj); navigate('/project-circuits') }
    } catch (err: any) {
      alert('Import failed: ' + (err.message || 'Invalid file'))
    } finally {
      if (e.target) e.target.value = ''
    }
  }

  const totalPoles = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.pole_count || 0), 0)
  }, [projects])

  const totalCircuits = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.circuit_count || 0), 0)
  }, [projects])

  // Filtered list
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = p.name.toLowerCase().includes(query)
        const matchesDesc = (p.description || '').toLowerCase().includes(query)
        if (!matchesName && !matchesDesc) return false
      }

      // Voltage filter
      if (voltageFilter !== 'ALL') {
        const arr = (p.line_arrangement || '').toLowerCase()
        if (voltageFilter === '11kV_LV' && !arr.includes('11') && !arr.includes('lv')) return false
        if (voltageFilter === 'LV_ONLY' && (!arr.includes('lv') || arr.includes('11') || arr.includes('33'))) return false
        if (voltageFilter === '11kV' && !arr.includes('11')) return false
      }

      return true
    })
  }, [projects, searchQuery, voltageFilter])

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '19 Nov 2026'
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return '19 Nov 2026'
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return '19 Nov 2026'
    }
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '1360px', margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              margin: '0 0 0.3rem 0',
              color: 'var(--text-main)',
              letterSpacing: '-0.025em',
            }}
          >
            Dashboard
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Distribution line projects and their structural compliance.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            style={{
              height: '38px',
              minHeight: '38px',
              padding: '0 0.95rem',
              fontSize: '0.825rem',
              fontWeight: 600,
            }}
          >
            <FolderOpen size={14} />
            <span>Open existing project</span>
          </button>

          <button
            type="button"
            onClick={handleNewProject}
            className="btn-primary"
            style={{
              height: '38px',
              minHeight: '38px',
              padding: '0 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            <Plus size={16} />
            <span>New project</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileImport}
          />
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        {/* Total Projects Card */}
        <div
          className="card"
          style={{
            padding: '1.25rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Total Projects
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0.35rem 0 0.2rem',
              lineHeight: 1.1,
            }}
          >
            {projects.length}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Active distribution feeder lines
          </div>
        </div>

        {/* Total Route Poles Card */}
        <div
          className="card"
          style={{
            padding: '1.25rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Total Route Poles
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0.35rem 0 0.2rem',
              lineHeight: 1.1,
            }}
          >
            {totalPoles}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Poles surveyed across all routes
          </div>
        </div>

        {/* Configured Circuits Card */}
        <div
          className="card"
          style={{
            padding: '1.25rem 1.4rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Configured Circuits
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0.35rem 0 0.2rem',
              lineHeight: 1.1,
            }}
          >
            {totalCircuits}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            MV & LV circuit conductor stages
          </div>
        </div>
      </div>

      {/* Distribution Line Projects Section */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Section Top Controls Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.15rem 1.4rem',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Distribution line projects{' '}
            <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.875rem', marginLeft: '0.35rem' }}>
              {filteredProjects.length} of {projects.length}
            </span>
          </div>

          {/* Search & Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search feeder name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  height: '36px',
                  minHeight: '36px',
                  paddingLeft: '32px',
                  fontSize: '0.825rem',
                  backgroundColor: 'var(--bg-app)',
                  borderColor: 'var(--border-color)',
                }}
              />
            </div>

            {/* Voltage Dropdown */}
            <select
              className="form-select"
              value={voltageFilter}
              onChange={(e) => setVoltageFilter(e.target.value)}
              style={{
                width: '140px',
                height: '36px',
                minHeight: '36px',
                fontSize: '0.825rem',
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--border-color)',
              }}
            >
              <option value="ALL">All voltages</option>
              <option value="11kV_LV">11 kV + LV</option>
              <option value="11kV">11 kV</option>
              <option value="LV_ONLY">LV only</option>
            </select>

          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No projects found matching the criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    letterSpacing: '0.02em',
                  }}
                >
                  <th style={{ padding: '0.85rem 1.4rem' }}>Project</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Configuration</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Poles</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Circuits</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Modified</th>
                  <th style={{ padding: '0.85rem 1.4rem', textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background-color 0.15s ease',
                      }}
                      className="table-row-hover"
                    >
                      {/* Project Name & Description */}
                      <td style={{ padding: '1rem 1.4rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.925rem', marginBottom: '0.2rem' }}>
                          {p.name}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.775rem' }}>
                          {p.description || `Poles 1–${p.pole_count || 13} transcribed from master schedule`}
                        </div>
                      </td>

                      {/* Configuration */}
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.825rem' }}>
                        {p.line_arrangement || '11 kV + LV'}
                      </td>

                      {/* Poles */}
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {p.pole_count || 13}
                      </td>

                      {/* Circuits */}
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                        {p.circuit_count || 2}
                      </td>

                      {/* Modified */}
                      <td style={{ padding: '1rem 1rem', verticalAlign: 'middle', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                        {formatDate(p.updated_at)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.4rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenProject(p)}
                            className="btn-secondary"
                            style={{
                              height: '32px',
                              minHeight: '32px',
                              padding: '0 0.85rem',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            <span>Open</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSaveProjectToDevice(p)}
                            className="btn-secondary"
                            title="Save project to device"
                            style={{
                              height: '32px',
                              minHeight: '32px',
                              padding: '0 0.75rem',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <Save size={13} />
                            <span>Save</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id, p.name)}
                            className="btn-secondary"
                            title="Delete project"
                            style={{
                              height: '32px',
                              minHeight: '32px',
                              width: '32px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text-muted)',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
