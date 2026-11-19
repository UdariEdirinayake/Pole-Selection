import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FolderGit2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useProject } from '../context/ProjectContext'
import {
  PageHeader,
  Card,
  KpiCard,
  ProjectRow,
  EmptyState,
} from '../components/layout'

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
  const { setActiveProject } = useProject()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [loading, setLoading] = useState(true)
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

  const handleDeleteProject = async (projectId: number) => {
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

  const handleNewProject = () => {
    setActiveProject(null)
    navigate('/project-circuits')
  }

  const headerActions = (
    <button type="button" onClick={handleNewProject} className="btn-primary">
      <Plus size={16} />
      <span>New Project</span>
    </button>
  )

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.email || 'Engineer'} (${user?.role || 'Designer'})`}
        actions={headerActions}
      />

      {/* Summary KPI Cards */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <KpiCard
          title="Total Projects"
          value={projects.length}
          subtext="Active distribution line projects"
          icon={<FolderGit2 size={20} />}
          accentColor="var(--primary)"
        />
      </div>

      {/* Projects List Card */}
      <Card
        title="Distribution Line Projects"
        subtitle="Manage route layouts, circuit definitions, and structural engineering reports"
        actions={
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} registered
          </span>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects configured"
            description="Get started by creating a new overhead line survey."
            action={
              <button onClick={handleNewProject} className="btn-primary">
                <Plus size={16} />
                <span>Create New Project</span>
              </button>
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {projects.map((p) => (
              <ProjectRow
                key={p.id}
                project={p}
                onOpen={() => setActiveProject(p)}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
