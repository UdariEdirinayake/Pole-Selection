import React from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  subtext?: string
  icon?: React.ReactNode
  badge?: string
  accentColor?: string
  trend?: {
    value: string
    isPositive?: boolean
  }
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  icon,
  badge,
  accentColor,
  trend,
}) => {
  return (
    <div
      className="stat-card"
      style={{
        borderLeft: accentColor ? `3.5px solid ${accentColor}` : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
        <div className="stat-label">{title}</div>
        {icon && (
          <div
            style={{
              color: accentColor || 'var(--primary)',
              opacity: 0.85,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </div>
        )}
        {badge && (
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.1rem 0.4rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-subtle)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      <div className="stat-val">{value}</div>

      {(subtext || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
          {trend && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: trend.isPositive ? 'var(--success-main)' : 'var(--danger-main)',
              }}
            >
              {trend.value}
            </span>
          )}
          {subtext && <p className="stat-sub">{subtext}</p>}
        </div>
      )}
    </div>
  )
}
