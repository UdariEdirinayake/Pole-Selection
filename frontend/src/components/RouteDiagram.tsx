import React, { useState } from 'react'
import { Info, X } from 'lucide-react'
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
  const poleSpacing = 70
  const polesPerRow = 7
  const startX = 60
  const startY = 60
  const rowHeight = 110

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
          viewBox="0 0 580 260"
          className="route-svg"
          style={{ width: '100%', height: 'auto', maxHeight: '280px' }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Span Connection Lines */}
          {positions.map((pos, idx) => {
            if (idx === positions.length - 1) return null
            const nextPos = positions[idx + 1]
            return (
              <line
                key={`line-${idx}`}
                x1={pos.x}
                y1={pos.y}
                x2={nextPos.x}
                y2={nextPos.y}
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
            )
          })}

          {/* Pole Nodes */}
          {positions.map((pos) => {
            const isSelected = selectedPole?.pole_no === pos.pole.pole_no
            const isCaution = pos.pole.angle_deg > 25
            const isTF = Boolean(pos.pole.equipment)

            let fillColor = '#3b82f6'
            if (isCaution) fillColor = '#eab308'
            if (isTF) fillColor = '#8b5cf6'

            return (
              <g
                key={`pole-${pos.pole.pole_no}`}
                onClick={() => setSelectedPole(pos.pole)}
                style={{ cursor: 'pointer' }}
                aria-label={`Pole ${pos.pole.pole_no}`}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isSelected ? 16 : 13}
                  fill={fillColor}
                  stroke={isSelected ? '#1e293b' : '#ffffff'}
                  strokeWidth={isSelected ? 3 : 2}
                  className="pole-circle"
                />
                <text
                  x={pos.x}
                  y={pos.y + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {pos.pole.pole_no}
                </text>
                <text
                  x={pos.x}
                  y={pos.y + 26}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="9"
                  opacity="0.8"
                >
                  {pos.pole.fore_span_m ? `${pos.pole.fore_span_m}m` : 'End'}
                </text>
              </g>
            )
          })}
        </svg>

        <div className="diagram-legend">
          <span><span className="dot dot-blue"></span> Standard Pole</span>
          <span><span className="dot dot-purple"></span> Equipment / TF</span>
          <span><span className="dot dot-yellow"></span> Heavy Angle</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b' }}>
            <Info size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            Click pole node to inspect details
          </span>
        </div>
      </div>

      {/* Selected Pole Side Drawer */}
      {selectedPole && (
        <div className="pole-side-drawer">
          <div className="drawer-header">
            <h4>Pole #{selectedPole.pole_no} Details</h4>
            <button onClick={() => setSelectedPole(null)} className="btn-close-drawer">
              <X size={16} />
            </button>
          </div>
          <div className="drawer-content">
            <div className="drawer-section">
              <h5>Route Geometry</h5>
              <p><strong>Section:</strong> {selectedPole.section}</p>
              <p><strong>After Span:</strong> {selectedPole.aft_span_m} m</p>
              <p><strong>Fore Span:</strong> {selectedPole.fore_span_m} m</p>
              <p><strong>Deviation Angle:</strong> {selectedPole.angle_deg}°</p>
              <p><strong>Equipment:</strong> {selectedPole.equipment || 'None'}</p>
            </div>

            {selectedSummary && (
              <div className="drawer-section">
                <h5>Selection Summary</h5>
                <p><strong>Recommended:</strong> {selectedSummary.final_recommended_pole}</p>
                <p><strong>Foundation:</strong> {selectedSummary.foundation_recommendation}</p>
                <p><strong>Status:</strong> <StatusChip status={selectedSummary.status} /></p>
              </div>
            )}

            {selectedLoad && (
              <div className="drawer-section">
                <h5>Structural Loading</h5>
                <p><strong>Wind Span:</strong> {selectedLoad.wind_span_m} m</p>
                <p><strong>Weight Span:</strong> {selectedLoad.weight_span_m} m</p>
                <p><strong>Total Bending Moment:</strong> {selectedLoad.total_bm_kn_m} kN·m</p>
                <p><strong>Buckling:</strong> <span className="text-pending">{selectedLoad.buckling_capacity}</span></p>
              </div>
            )}

            {selectedFoundation && (
              <div className="drawer-section">
                <h5>Foundation & Soil</h5>
                <p><strong>Soil Class:</strong> {selectedFoundation.soil_class}</p>
                <p><strong>Resisting Moment (Mr):</strong> {selectedFoundation.mr_kn_m} kN·m</p>
                <p><strong>Total Vertical Load:</strong> {selectedFoundation.total_vertical_load_kn} kN</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
