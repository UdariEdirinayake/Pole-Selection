import React from 'react'
import { useTheme } from '../context/ThemeContext'

export interface SymbolNotation {
  symbol: string
  description: string
  unit?: string
}

export interface MethodologyEquationBoxProps {
  id?: string
  number?: string
  title: string
  category: 'common' | 'pole'
  equationSvg: React.ReactNode
  variables: SymbolNotation[]
  standardRef?: string
  substitution?: React.ReactNode
}

function formatSymbol(sym: string): React.ReactNode {
  // Convert underscore notation like BM_F, S_fore, q_pole into clean subscripted JSX
  if (!sym.includes('_')) return sym
  const parts = sym.split(/([A-Za-zα-ωΑ-Ω]+_[A-Za-z0-9,]+)/g)
  return parts.map((part, idx) => {
    const match = part.match(/^([A-Za-zα-ωΑ-Ω]+)_([A-Za-z0-9,]+)$/)
    if (match) {
      return (
        <React.Fragment key={idx}>
          {match[1]}
          <sub style={{ fontSize: '0.72em', fontStyle: 'italic' }}>{match[2]}</sub>
        </React.Fragment>
      )
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>
  })
}

export const MethodologyEquationBox: React.FC<MethodologyEquationBoxProps> = ({
  id,
  number,
  title,
  category,
  equationSvg,
  variables,
  standardRef,
  substitution,
}) => {
  const { isDark } = useTheme()

  const isCommon = category === 'common'
  const categoryLabel = isCommon ? 'Route-Wide' : 'Pole-Specific'
  const categoryBadgeBg = isCommon
    ? isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe'
    : isDark ? 'rgba(71, 85, 105, 0.28)' : '#f1f5f9'
  const categoryBadgeColor = isCommon
    ? isDark ? '#38bdf8' : '#0369a1'
    : isDark ? '#94a3b8' : '#475569'
  const categoryBadgeBorder = isCommon
    ? isDark ? '#0284c7' : '#bae6fd'
    : isDark ? '#475569' : '#cbd5e1'

  return (
    <div
      id={id}
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: isDark
          ? '0 2px 10px rgba(0, 0, 0, 0.25)'
          : '0 1px 4px rgba(0, 0, 0, 0.04)',
        scrollMarginTop: '210px',
      }}
    >
      {/* Header with EQ Pill, Title, Category Badge, Citation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {number && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--primary)',
              fontFamily: 'var(--font-mono, monospace)',
              backgroundColor: 'var(--primary-subtle, rgba(2, 132, 199, 0.12))',
              padding: '2px 8px',
              borderRadius: '4px',
            }}
          >
            EQ {number}
          </span>
        )}
        <h4
          style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: 'var(--text-main)',
          }}
        >
          {title}
        </h4>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: categoryBadgeBg,
              color: categoryBadgeColor,
              border: `1px solid ${categoryBadgeBorder}`,
            }}
          >
            {categoryLabel}
          </span>
          {standardRef && (
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {standardRef}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.15rem 1.25rem 1.25rem' }}>
        {/* Formula Display Container (.fx) */}
        <div
          style={{
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '1.35rem 1rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflowX: 'auto',
            color: 'var(--text-main)',
          }}
        >
          {equationSvg}
        </div>

        {/* "Where" Structured Symbol Table */}
        {variables.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <div
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '0.4rem',
              }}
            >
              Where
            </div>
            <div style={{ overflowX: 'auto', borderRadius: '6px' }}>
              <table className="review-eq-table">
                <tbody>
                  {variables.map((v, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-main)' }}>{formatSymbol(v.symbol)}</td>
                      <td style={{ color: 'var(--text-secondary, var(--text-main))' }}>{v.description}</td>
                      <td>{v.unit || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Live Substitution Box (.sb) */}
        {substitution && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.8rem 1rem',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid var(--primary)',
              borderRadius: '6px',
              fontSize: '0.825rem',
              lineHeight: 1.75,
            }}
          >
            {substitution}
          </div>
        )}
      </div>
    </div>
  )
}
