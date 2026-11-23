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
  const categoryLabel = isCommon ? 'Common for Entire Route' : 'Pole-Specific Calculation'
  const categoryBadgeBg = isCommon
    ? isDark ? 'rgba(56, 189, 248, 0.15)' : '#e0f2fe'
    : isDark ? 'rgba(168, 85, 247, 0.15)' : '#f3e8ff'
  const categoryBadgeColor = isCommon
    ? isDark ? '#38bdf8' : '#0369a1'
    : isDark ? '#c084fc' : '#7e22ce'
  const categoryBadgeBorder = isCommon
    ? isDark ? '#0284c7' : '#bae6fd'
    : isDark ? '#7e22ce' : '#e9d5ff'

  return (
    <div
      id={id}
      style={{
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        border: `1px solid ${isDark ? '#1e293b' : '#e2e8f0'}`,
        borderRadius: '10px',
        padding: '1.25rem 1.5rem',
        boxShadow: isDark
          ? '0 4px 12px rgba(0, 0, 0, 0.25)'
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header with Title and Category Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
          borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
          paddingBottom: '0.65rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {number && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: isCommon ? '#38bdf8' : '#a855f7',
                fontFamily: 'monospace',
                backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
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
              color: isDark ? '#f8fafc' : '#0f172a',
            }}
          >
            {title}
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '9999px',
              backgroundColor: categoryBadgeBg,
              color: categoryBadgeColor,
              border: `1px solid ${categoryBadgeBorder}`,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            {categoryLabel}
          </span>
          {standardRef && (
            <span style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b' }}>
              ({standardRef})
            </span>
          )}
        </div>
      </div>

      {/* Boxed Equation: Matches exactly the white/dark rectangular border in reference image */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          margin: '0.85rem 0 1.25rem',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            backgroundColor: isDark ? '#000000' : '#ffffff',
            border: `1.5px solid ${isDark ? '#ffffff' : '#334155'}`,
            borderRadius: '2px',
            padding: '0.85rem 1.6rem',
            color: isDark ? '#ffffff' : '#0f172a',
            boxShadow: isDark
              ? '0 0 15px rgba(255, 255, 255, 0.05)'
              : '0 2px 6px rgba(0, 0, 0, 0.06)',
          }}
        >
          {equationSvg}
        </div>
      </div>

      {/* "Where:" Symbol Notations List */}
      <div style={{ marginTop: '0.75rem' }}>
        <div
          style={{
            fontSize: '0.9rem',
            fontWeight: 700,
            color: isDark ? '#f8fafc' : '#0f172a',
            marginBottom: '0.5rem',
          }}
        >
          Where:
        </div>
        <ul
          style={{
            margin: 0,
            paddingLeft: '1.4rem',
            listStyleType: 'disc',
            color: isDark ? '#cbd5e1' : '#334155',
            fontSize: '0.875rem',
            lineHeight: 1.8,
          }}
        >
          {variables.map((v, i) => (
            <li key={i} style={{ marginBottom: '0.2rem' }}>
              <span
                style={{
                  fontFamily: "'Times New Roman', 'Cambria Math', serif",
                  fontStyle: 'italic',
                  fontWeight: 600,
                  color: isDark ? '#f8fafc' : '#0f172a',
                  fontSize: '0.95rem',
                }}
              >
                {v.symbol}
              </span>{' '}
              ={' '}
              <span>{v.description}</span>
              {v.unit && (
                <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.8rem', marginLeft: '0.35rem' }}>
                  ({v.unit})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Real Project Substitution or Benchmark Data if provided */}
      {substitution && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.85rem 1rem',
            backgroundColor: isDark ? '#1e293b' : '#f8fafc',
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            borderRadius: '6px',
            fontSize: '0.825rem',
          }}
        >
          {substitution}
        </div>
      )}
    </div>
  )
}
