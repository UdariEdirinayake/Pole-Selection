import React from 'react'
import { Link } from 'react-router-dom'
import { Clock, ArrowRight, Layers, MapPin } from 'lucide-react'
import { StatusChip } from '../StatusChip'

export interface ProjectData {
  id: number
  name: string
  description?: string
  line_arrangement: string
  status: string
  updated_at?: string
  pole_count: number
  circuit_count: number
}

interface ProjectRowProps {
  project: ProjectData
  onOpen?: () => void
}

export const ProjectRow: React.FC<ProjectRowProps> = ({ project, onOpen }) => {
  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.15s ease',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-subtle)',
              color: 'var(--primary)',
              border: '1px solid var(--primary-border)',
            }}
          >
            {project.line_arrangement}
          </span>
          <StatusChip status={project.status} />
        </div>

        <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
          {project.name}
        </h4>

        <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <MapPin size={13} color="var(--primary)" />
              <strong style={{ color: 'var(--text-main)' }}>{project.pole_count}</strong> poles
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Layers size={13} color="var(--primary)" />
              <strong style={{ color: 'var(--text-main)' }}>{project.circuit_count}</strong> ccts
            </span>
          </div>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} />
            {project.updated_at ? new Date(project.updated_at).toLocaleDateString() : 'Recent'}
          </span>
        </div>

        <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
          <Link
            to="/route-poles"
            onClick={onOpen}
            className="btn-secondary"
            style={{
              height: '32px',
              minHeight: '32px',
              fontSize: '0.8rem',
              padding: '0 0.85rem',
              width: '100%',
              display: 'inline-flex',
              justifyContent: 'center',
            }}
          >
            <span>Open Project</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
