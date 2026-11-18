import React from 'react'
import { Check } from 'lucide-react'

interface SelectCardProps {
  selected: boolean
  onClick: () => void
  title: string
  description?: string
  icon?: React.ReactNode
  badge?: string
}

export const SelectCard: React.FC<SelectCardProps> = ({
  selected,
  onClick,
  title,
  description,
  icon,
  badge,
}) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`select-card ${selected ? 'selected' : ''}`}
      style={{
        flex: 1,
        minWidth: '180px',
        padding: '1.15rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        border: selected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
        backgroundColor: selected ? 'var(--primary-subtle)' : 'var(--bg-surface)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: selected ? '0 2px 6px rgba(37, 99, 235, 0.15)' : 'var(--shadow-xs)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {icon && (
            <div style={{ color: selected ? 'var(--primary)' : 'var(--text-muted)' }}>
              {icon}
            </div>
          )}
          <span style={{ fontSize: '1rem', fontWeight: 700, color: selected ? 'var(--primary)' : 'var(--text-main)' }}>
            {title}
          </span>
        </div>

        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            border: selected ? '2px solid var(--primary)' : '2px solid var(--border-strong)',
            backgroundColor: selected ? 'var(--primary)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
            transition: 'all 0.15s ease',
          }}
        >
          {selected && <Check size={12} strokeWidth={3} />}
        </div>
      </div>

      {description && (
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {description}
        </p>
      )}

      {badge && (
        <div style={{ marginTop: '0.75rem' }}>
          <span
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: selected ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-subtle)',
              color: selected ? 'var(--primary)' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {badge}
          </span>
        </div>
      )}
    </div>
  )
}
