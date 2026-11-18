import React from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: React.ReactNode
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
}) => {
  return (
    <div className="page-header-row">
      <div style={{ flex: 1, minWidth: '240px' }}>
        {breadcrumbs && <div style={{ marginBottom: '0.4rem' }}>{breadcrumbs}</div>}
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--text-main)' }}>
          {title}
        </h2>
        {description && (
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  )
}
