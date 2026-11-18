import React from 'react'
import { FolderPlus } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '3rem 1.5rem',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-strong)',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-subtle)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1rem',
        }}
      >
        {icon || <FolderPlus size={24} color="var(--primary)" />}
      </div>

      <h4 style={{ margin: '0 0 0.35rem 0', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
        {title}
      </h4>

      <p style={{ margin: '0 auto 1.25rem', maxWidth: '380px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {description}
      </p>

      {action && <div>{action}</div>}
    </div>
  )
}
