import React from 'react'

export type StatusType = 'PASS' | 'OK' | 'SATISFIED' | 'CAUTION' | 'FAIL' | 'NOT ASSESSED' | 'PENDING'

interface StatusChipProps {
  status: string
  label?: string
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label }) => {
  const normalized = (status || '').toUpperCase()
  const displayLabel = label || status || 'NOT ASSESSED'

  let bg = '#e2e8f0'
  let color = '#2d3748'
  let border = '#cbd5e0'
  let dotColor = '#64748b'

  if (['PASS', 'OK', 'SATISFIED'].includes(normalized)) {
    bg = '#def7ec'
    color = '#03543f'
    border = '#84e1bc'
    dotColor = '#059669'
  } else if (['CAUTION', 'WARNING'].includes(normalized)) {
    bg = '#fef08a'
    color = '#713f12'
    border = '#fde047'
    dotColor = '#d97706'
  } else if (['FAIL'].includes(normalized)) {
    bg = '#fde8e8'
    color = '#9b1c1c'
    border = '#f8b4b4'
    dotColor = '#dc2626'
  } else if (['PENDING'].includes(normalized)) {
    bg = '#e1effe'
    color = '#1e429f'
    border = '#a4cafe'
    dotColor = '#2563eb'
  } else if (['NOT CALCULATED', 'NOT ASSESSED'].includes(normalized)) {
    bg = '#f1f5f9'
    color = '#475569'
    border = '#cbd5e1'
    dotColor = '#94a3b8'
  }

  return (
    <span
      data-testid="status-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '9999px',
        fontSize: '0.72rem',
        fontWeight: '700',
        lineHeight: 1,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block',
        }}
      />
      {displayLabel}
    </span>
  )
}
