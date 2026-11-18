import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderGit2, Database, Calendar, Wind } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
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

interface DatasetVersionInfo {
  id: number
  name: string
  imported_at: string
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [datasetVersion, setDatasetVersion] = useState<DatasetVersionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

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

  const loadDatasetVersion = async () => {
    try {
      const res = await fetch('/api/master/dataset-versions?limit=1')
      if (res.ok) {
        const data = await res.json()
        if (data && data.items && data.items.length > 0) {
          setDatasetVersion(data.items[0])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadProjects()
    loadDatasetVersion()
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

  const headerActions = (
    <>
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
        <Plus size={16} />
        <span>New Project</span>
      </Link>
    </>
  )

  const formattedImportDate = datasetVersion?.imported_at
    ? datasetVersion.imported_at.split('T')[0]
    : '2026-11-18'

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.email || 'Engineer'} (${user?.role || 'Designer'})`}
        actions={headerActions}
      />

      {/* 4 KPI Cards in one horizontal row */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <KpiCard
          title="Total Projects"
          value={projects.length}
          subtext="Active line design files"
          icon={<FolderGit2 size={20} />}
          accentColor="var(--primary)"
        />

        <KpiCard
          title="Master Dataset Version"
          value={datasetVersion ? datasetVersion.name.replace('LECO_Import_', 'v.') : 'v.1.0'}
          subtext={datasetVersion ? datasetVersion.name : 'Master Catalog'}
          icon={<Database size={20} />}
          accentColor="#059669"
        />

        <KpiCard
          title="Dataset Import Date"
          value={formattedImportDate}
          subtext="Verified database seed"
          icon={<Calendar size={20} />}
          accentColor="#6366f1"
        />

        <KpiCard
          title="Conductor Wind Spec"
          value="575 N/m²"
          subtext="Confirmed by project owner"
          icon={<Wind size={20} />}
          accentColor="#d97706"
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
            description="Get started by creating a new overhead line survey or loading the official 11 kV + LV sample project (Poles 1 to 13)."
            action={
              <button onClick={handleCreateSample} className="btn-primary">
                <FolderGit2 size={16} />
                <span>Load Sample 11 kV + LV Feeder</span>
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
              <ProjectRow key={p.id} project={p} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
