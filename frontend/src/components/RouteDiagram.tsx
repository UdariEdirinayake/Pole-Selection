import React, { useState } from 'react'
import { Info, X, Zap, Cpu, Compass, HardHat } from 'lucide-react'
import { StatusChip } from './StatusChip'

interface PoleNode {
  pole_no: number
  section: number
  aft_span_m: number
  fore_span_m: number
  angle_deg: number
  equipment?: string | null
  status?: string
}

interface RouteDiagramProps {
  poles: PoleNode[]
  resultData?: {
    summary?: any[]
    loads?: any[]
    foundation?: any[]
  }
}

export const RouteDiagram: React.FC<RouteDiagramProps> = ({ poles, resultData }) => {
  const [selectedPole, setSelectedPole] = useState<PoleNode | null>(null)

  // Compute serpentine layout positions
  const poleSpacing = 72
  const polesPerRow = 7
  const startX = 55
  const startY = 55
  const rowHeight = 105

  const positions = poles.map((p, index) => {
    const row = Math.floor(index / polesPerRow)
    const isReversed = row % 2 === 1
    const col = index % polesPerRow
    const actualCol = isReversed ? polesPerRow - 1 - col : col
    return {
      x: startX + actualCol * poleSpacing,
      y: startY + row * rowHeight,
      pole: p,
    }
  })

  const selectedSummary = resultData?.summary?.find((r) => r.pole === selectedPole?.pole_no)
  const selectedLoad = resultData?.loads?.find((r) => r.pole === selectedPole?.pole_no)
  const selectedFoundation = resultData?.foundation?.find((r) => r.pole === selectedPole?.pole_no)

  return (
    <div className="route-diagram-wrapper">
      <div className="diagram-container">
        <svg
          viewBox="0 0 580 250"
          className="route-svg"
          style={{ width: '100%', height: 'auto', maxHeight: '280px', display: 'block' }}
        >
          <defs>
            {/* Subtle engineering grid background */}
            <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="var(--border-color)"
                strokeWidth="0.5"
                opacity="0.6"
              />
            </pattern>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Grid canvas background */}
          <rect width="100%" height="100%" fill="url(#cadGrid)" />

          {/* Span Connection Lines */}
          {positions.map((pos, idx) => {
            if (idx === positions.length - 1) return null
            const nextPos = positions[idx + 1]
            return (
              <g key={`span-${idx}`}>
                <line
                  x1={pos.x}
                  y1={pos.y}
                  x2={nextPos.x}
                  y2={nextPos.y}
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                  strokeDasharray="5 3"
                  opacity="0.8"
                />
              </g>
            )
          })}

          {/* Pole Nodes */}
          {positions.map((pos) => {
            const isSelected = selectedPole?.pole_no === pos.pole.pole_no
            const isCaution = pos.pole.angle_deg > 20
            const hasEquip = Boolean(pos.pole.equipment && pos.pole.equipment !== 'None')

            let strokeColor = 'var(--primary)'
            let fillColor = 'var(--bg-surface)'
            let textColor = 'var(--text-main)'

            if (hasEquip) {
              strokeColor = '#8b5cf6' // Purple for transformer/equipment
            }
            if (isCaution) {
              strokeColor = '#f59e0b' // Amber for heavy angle
            }
            if (isSelected) {
              fillColor = 'var(--primary)'
              textColor = '#ffffff'
            }

            return (
              <g
                key={`pole-${pos.pole.pole_no}`}
                onClick={() => setSelectedPole(pos.pole)}
                style={{ cursor: 'pointer' }}
                aria-label={`Pole ${pos.pole.pole_no}`}
              >
                {/* Glow ring if selected */}
                {isSelected && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={18}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    opacity="0.7"
                  />
                )}

                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={13}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={2.5}
                />

                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="var(--font-mono)"
                >
                  {pos.pole.pole_no}
                </text>

                {/* Subtext: span length */}
                <text
                  x={pos.x}
                  y={pos.y + 25}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="9"
                  fontFamily="var(--font-mono)"
                  fontWeight="600"
                >
                  {pos.pole.fore_span_m ? `${pos.pole.fore_span_m}m` : 'End'}
                </text>
              </g>
            )
          })}
        </svg>

        {/* CAD Legend Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            marginTop: '0.75rem',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
            Standard Tangent/Angle Pole
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
            Transformer / Substation (TF)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            Heavy Angle (&gt;20°)
          </span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)' }}>
            <Info size={13} />
            Click pole node to inspect detailed schedules
          </span>
        </div>
      </div>

      {/* Selected Pole Telemetry Side Drawer */}
      {selectedPole && (
        <div className="pole-drawer">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '0.85rem',
            }}
          >
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Pole #{selectedPole.pole_no} Telemetry
              </h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Section {selectedPole.section} • Schedule Inspection
              </span>
            </div>
            <button
              onClick={() => setSelectedPole(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                borderRadius: '4px',
              }}
              aria-label="Close pole drawer"
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.825rem' }}>
            {/* Section 1: Route Geometry */}
            <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                <Compass size={14} color="var(--primary)" />
                <span>Survey Geometry</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                <div>Aft Span: <strong style={{ color: 'var(--text-main)' }}>{selectedPole.aft_span_m} m</strong></div>
                <div>Fore Span: <strong style={{ color: 'var(--text-main)' }}>{selectedPole.fore_span_m} m</strong></div>
                <div>Angle: <strong style={{ color: 'var(--text-main)' }}>{selectedPole.angle_deg}°</strong></div>
                <div>Equip: <strong style={{ color: 'var(--text-main)' }}>{selectedPole.equipment || 'None'}</strong></div>
              </div>
            </div>

            {/* Section 2: Recommended Pole */}
            {selectedSummary && (
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  <HardHat size={14} color="#059669" />
                  <span>Selection Summary</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div>Pole: <strong style={{ color: 'var(--text-main)' }}>{selectedSummary.final_recommended_pole}</strong></div>
                  <div>Foundation: <strong style={{ color: 'var(--text-main)' }}>{selectedSummary.foundation_recommendation}</strong></div>
                  <div style={{ marginTop: '0.35rem' }}>
                    Status: <StatusChip status={selectedSummary.status} />
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Structural Load */}
            {selectedLoad && (
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  <Zap size={14} color="#d97706" />
                  <span>Mechanical Bending Moments</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div>Total BM: <strong style={{ color: 'var(--text-main)' }}>{selectedLoad.total_bm_kn_m} kN·m</strong></div>
                  <div>Wind Span: <strong style={{ color: 'var(--text-main)' }}>{selectedLoad.wind_span_m} m</strong></div>
                  <div>Weight Span: <strong style={{ color: 'var(--text-main)' }}>{selectedLoad.weight_span_m} m</strong></div>
                </div>
              </div>
            )}

            {/* Section 4: Foundation */}
            {selectedFoundation && (
              <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  <Cpu size={14} color="#6366f1" />
                  <span>Geotechnical Foundation</span>
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <div>Soil Class: <strong style={{ color: 'var(--text-main)' }}>Class {selectedFoundation.soil_class}</strong></div>
                  <div>Resisting Moment Mr: <strong style={{ color: 'var(--text-main)' }}>{selectedFoundation.mr_kn_m} kN·m</strong></div>
                  <div>Total Vertical: <strong style={{ color: 'var(--text-main)' }}>{selectedFoundation.total_vertical_load_kn} kN</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
