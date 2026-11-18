import React from 'react'

interface CardProps {
  title?: React.ReactNode
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  noPadding?: boolean
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  style = {},
  noPadding = false,
}) => {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || actions) && (
        <div
          className="card-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <div>
            {typeof title === 'string' ? (
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {title}
              </h3>
            ) : (
              title
            )}
            {subtitle && (
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div style={noPadding ? {} : { padding: '1.25rem' }}>{children}</div>
    </div>
  )
}
