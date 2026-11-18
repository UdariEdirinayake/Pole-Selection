import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, FolderGit2, CheckCircle2, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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
  const { user } = useAuth()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
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

  const handleCreateSample = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/projects/seed-sample')
      if (res.ok) {
        await loadProjects()
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h2>Dashboard</h2>
          <p className="page-subtitle">Welcome back, {user?.email} ({user?.role})</p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleCreateSample}
            disabled={creating}
            className="btn-secondary"
            title="Load sample route project (Poles 1-13)"
          >
            <FolderGit2 size={16} />
            <span>{creating ? 'Loading...' : 'Load Sample Project'}</span>
          </button>
          <Link to="/project-circuits" className="btn-primary">
            <Plus size={16} /> <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* Quick Overview Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Projects</div>
          <div className="stat-value">{projects.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Standard</div>
          <div className="stat-value">LECO 2026</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Conductor Wind Load</div>
          <div className="stat-value">575 N/m²</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Validation Engine</div>
          <div className="stat-value text-success">Strict PASS</div>
        </div>
      </div>

      {/* Projects List */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>Your Line Projects</h3>
        </div>
        {loading ? (
          <p className="text-loading">Loading projects...</p>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects created yet.</p>
            <button onClick={handleCreateSample} className="btn-primary" style={{ marginTop: '0.75rem' }}>
              Load Sample 11kV + LV Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((p) => (
              <div key={p.id} className="project-card">
                <div className="project-card-top">
                  <span className="badge badge-primary">{p.line_arrangement}</span>
                  <span className={`badge ${p.status === 'ready' ? 'badge-success' : 'badge-warning'}`}>
                    {p.status}
                  </span>
                </div>
                <h4 className="project-title">{p.name}</h4>
                <p className="project-desc">{p.description || 'No description provided'}</p>
                <div className="project-meta">
                  <span><strong>{p.pole_count}</strong> poles</span> &bull;{' '}
                  <span><strong>{p.circuit_count}</strong> circuits</span>
                </div>
                <div className="project-footer">
                  <span className="project-date">
                    <Clock size={12} style={{ marginRight: '4px' }} />
                    {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : 'Recent'}
                  </span>
                  <Link to="/route-poles" className="btn-open-project">
                    Open <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
