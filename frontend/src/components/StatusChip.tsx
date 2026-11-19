import React from 'react'
import { useTheme } from '../context/ThemeContext'

export type StatusType = 'PASS' | 'OK' | 'SATISFIED' | 'CAUTION' | 'FAIL' | 'NOT ASSESSED' | 'PENDING'

interface StatusChipProps {
  status: string
  label?: string
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, label }) => {
  const { isDark } = useTheme()
  const normalized = (status || '').toUpperCase()
  const displayLabel = label || status || 'NOT ASSESSED'

  let bg = isDark ? '#1e293b' : '#f1f5f9'
  let color = isDark ? '#94a3b8' : '#475569'
  let border = isDark ? '#334155' : '#cbd5e1'
  let symbol = '○'

  if (['PASS', 'OK', 'SATISFIED'].includes(normalized)) {
    bg = isDark ? 'rgba(16, 185, 129, 0.18)' : '#def7ec'
    color = isDark ? '#34d399' : '#03543f'
    border = isDark ? 'rgba(16, 185, 129, 0.4)' : '#84e1bc'
    symbol = '●'
  } else if (['CAUTION', 'WARNING'].includes(normalized)) {
    bg = isDark ? 'rgba(245, 158, 11, 0.18)' : '#fef08a'
    color = isDark ? '#fbbf24' : '#713f12'
    border = isDark ? 'rgba(245, 158, 11, 0.4)' : '#fde047'
    symbol = '◆'
  } else if (['FAIL'].includes(normalized)) {
    bg = isDark ? 'rgba(239, 68, 68, 0.18)' : '#fde8e8'
    color = isDark ? '#f87171' : '#9b1c1c'
    border = isDark ? 'rgba(239, 68, 68, 0.4)' : '#f8b4b4'
    symbol = '■'
  } else if (['PENDING'].includes(normalized)) {
    bg = isDark ? 'rgba(59, 130, 246, 0.18)' : '#e1effe'
    color = isDark ? '#93c5fd' : '#1e429f'
    border = isDark ? 'rgba(59, 130, 246, 0.4)' : '#a4cafe'
    symbol = '●'
  }

  return (
    <span
      data-testid="status-chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.2rem 0.55rem',
        borderRadius: '6px',
        fontSize: '0.72rem',
        fontWeight: '700',
        lineHeight: 1,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      <span style={{ fontSize: '0.65rem', lineHeight: 1 }}>{symbol}</span>
      <span>{displayLabel}</span>
    </span>
  )
}
