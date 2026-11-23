import React, { useState } from 'react'
import { Download, Maximize2, Minimize2 } from 'lucide-react'

export interface ProfilePoleData {
  pole_no: number
  section: number
  fore_span_m: number
  aft_span_m?: number
  angle_deg: number
  equipment?: string | null
  kva?: number | null
  spur?: string | null
  recommended_pole?: string | null
  foundation_type?: string | null
}

interface LineProfileDiagramProps {
  poles?: ProfilePoleData[]
  projectName?: string
}

const DEFAULT_PROFILE_POLES: ProfilePoleData[] = [
  { pole_no: 1, section: 1, fore_span_m: 29, angle_deg: 0, equipment: 'None', spur: 'Terminal (Start)', recommended_pole: '11/350 M' },
  { pole_no: 2, section: 1, fore_span_m: 34, angle_deg: 14, equipment: 'None', recommended_pole: '11.0/850 U' },
  { pole_no: 3, section: 1, fore_span_m: 29, angle_deg: 4, equipment: 'None', recommended_pole: '11.0/500 U' },
  { pole_no: 4, section: 1, fore_span_m: 33, angle_deg: 4, equipment: 'TF - 160kVA', kva: 160, recommended_pole: '11.0/850 U' },
  { pole_no: 5, section: 1, fore_span_m: 31, angle_deg: 2, equipment: 'None', recommended_pole: '11.0/350 U' },
  { pole_no: 6, section: 1, fore_span_m: 38, angle_deg: 5, equipment: 'None', recommended_pole: '11.0/500 U' },
  { pole_no: 7, section: 2, fore_span_m: 37, angle_deg: 40, equipment: 'None', recommended_pole: '11/350 M' },
  { pole_no: 8, section: 2, fore_span_m: 30, angle_deg: 4, equipment: 'None', recommended_pole: '11.0/500 U' },
  { pole_no: 9, section: 2, fore_span_m: 24, angle_deg: 15, equipment: 'None', recommended_pole: '11.0/850 U' },
  { pole_no: 10, section: 2, fore_span_m: 35, angle_deg: 8, equipment: 'None', recommended_pole: '11.0/500 U' },
  { pole_no: 11, section: 2, fore_span_m: 23, angle_deg: 2, equipment: 'None', recommended_pole: '11.0/350 U' },
  { pole_no: 12, section: 2, fore_span_m: 25, angle_deg: 5, equipment: 'None', recommended_pole: '11.0/500 U' },
  { pole_no: 13, section: 2, fore_span_m: 0, angle_deg: 0, equipment: 'None', spur: 'Terminal (End)', recommended_pole: '11/350 M' },
]

export const LineProfileDiagram: React.FC<LineProfileDiagramProps> = ({
  poles = DEFAULT_PROFILE_POLES,
  projectName = 'Kelaniya Distribution Feeder',
}) => {
  const [hoveredPole, setHoveredPole] = useState<ProfilePoleData | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const activePoles = poles && poles.length > 0 ? poles : DEFAULT_PROFILE_POLES

  // Divide into Section 1 and Section 2
  const sec1Poles = activePoles.filter((p) => (p.section || 1) === 1)
  const sec2Poles = activePoles.filter((p) => (p.section || 1) === 2)

  // Fallback split if sections aren't explicitly marked
  const displaySec1 = sec1Poles.length > 0 ? sec1Poles : activePoles.slice(0, 6)
  const displaySec2 = sec2Poles.length > 0 ? sec2Poles : activePoles.slice(6)

  // Geometry coordinates
  // Row 1 (Section 1)
  const sec1StartX = 190
  const sec1Spacing = 145
  const groundY1 = 148
  const poleTopY1 = 76
  const crossarmY1 = 80
  const lvY1 = 106

  // Row 2 (Section 2)
  const sec2StartX = 190
  const sec2Spacing = 145
  const groundY2 = 388
  const poleTopY2 = 316
  const crossarmY2 = 320
  const lvY2 = 346

  // Calculate Section lengths
  const sec1Length = displaySec1.reduce((sum, p) => sum + (Number(p.fore_span_m) || 0), 0)
  const sec2Length = displaySec2.reduce((sum, p) => sum + (Number(p.fore_span_m) || 0), 0)

  // Download SVG utility
  const handleExportSvg = () => {
    const svgEl = document.getElementById('line-profile-svg')
    if (!svgEl) return
    const svgData = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Line_Profile.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      style={{
        backgroundColor: '#0c1322',
        borderRadius: isFullscreen ? 0 : '12px',
        border: '1px solid #1e293b',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        color: '#f8fafc',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        right: isFullscreen ? 0 : undefined,
        bottom: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 9999 : 1,
        height: isFullscreen ? '100vh' : 'auto',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Top Diagram Controls Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.25rem',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.3px' }}>
            Overhead Distribution Line Route Profile & Elevation
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.5rem' }}>
            {projectName} • 11 kV + LV Bundle
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
            title={isFullscreen ? 'Exit full screen' : 'Expand diagram to full screen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportSvg}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: '#1e293b',
              color: '#94a3b8',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
            title="Download SVG vector diagram"
          >
            <Download size={13} />
            <span>Export SVG</span>
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div style={{ position: 'relative', padding: '1rem 0.5rem 0.5rem' }}>
        <svg
          id="line-profile-svg"
          viewBox="0 0 1040 550"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <defs>
            {/* Ground Hatch Pattern */}
            <pattern id="groundHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#334155" strokeWidth="1" opacity="0.6" />
            </pattern>

            {/* Dimension Line Marker Arrows */}
            <marker id="arrowStart" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 9 2 L 2 5 L 9 8 z" fill="#38bdf8" />
            </marker>
            <marker id="arrowEnd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 1 2 L 8 5 L 1 8 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Section 1 Card Header */}
          <g>
            <text x="64" y="44" fill="#38bdf8" fontSize="13" fontWeight="bold">Section 1</text>
            <text x="124" y="44" fill="#64748b" fontSize="10">Poles 1–6 • {sec1Length > 0 ? `${sec1Length} m` : '194 m'} • flows left to right</text>
          </g>

          {/* Ground Plane Section 1 */}
          <line x1="48" y1={groundY1} x2="980" y2={groundY1} stroke="#475569" strokeWidth="1.5" />
          <rect x="48" y={groundY1} width="932" height="18" fill="url(#groundHatch)" />

          {/* Section 1 Poles & Equipment */}
          {displaySec1.map((p, idx) => {
            const x = sec1StartX + idx * sec1Spacing
            const isTerminal = idx === 0 || p.spur?.includes('Terminal')
            const isFirst = idx === 0
            const hasEquip = Boolean(p.equipment && p.equipment !== 'None') || (p.kva && p.kva > 0)
            const kvaText = p.kva ? `${p.kva} kVA` : (p.equipment?.match(/\d+\s*kVA/i)?.[0] || '160 kVA')

            const badgeBg = isTerminal ? '#261214' : '#1e293b'
            const badgeBorder = isTerminal ? '#ef4444' : '#94a3b8'
            const badgeText = isTerminal ? '#f87171' : '#f8fafc'

            return (
              <g
                key={`sec1-pole-${p.pole_no}`}
                onMouseEnter={() => setHoveredPole(p)}
                onMouseLeave={() => setHoveredPole(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pole Number Badge at Top */}
                <rect x={x - 11} y="34" width="22" height="20" rx="4" fill={badgeBg} stroke={badgeBorder} strokeWidth="1.5" />
                <text x={x} y="48" textAnchor="middle" fill={badgeText} fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {p.pole_no}
                </text>

                {/* Guy Wire for Pole 1 (Terminal) */}
                {isFirst && (
                  <g>
                    <line x1={x - 2} y1={crossarmY1 + 10} x2={x - 44} y2={groundY1} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" />
                    {/* Guy anchor block */}
                    <rect x={x - 47} y={groundY1} width="6" height="4" fill="#ef4444" opacity="0.8" />
                  </g>
                )}

                {/* Pole Foundation Concrete Block */}
                <polygon points={`${x - 6},${groundY1 + 8} ${x + 6},${groundY1 + 8} ${x + 4},${groundY1 - 2} ${x - 4},${groundY1 - 2}`} fill="#64748b" opacity="0.7" />

                {/* Vertical Pole Shaft */}
                <line x1={x} y1={groundY1} x2={x} y2={poleTopY1} stroke="#94a3b8" strokeWidth="4.5" strokeLinecap="round" />

                {/* Top Crossarm */}
                <line x1={x - 14} y1={crossarmY1} x2={x + 14} y2={crossarmY1} stroke="#cbd5e1" strokeWidth="2.5" />

                {/* Pin Insulator Ring for 11 kV */}
                <circle cx={x} cy={crossarmY1 - 5} r="3" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* LV Bracket & Insulator */}
                <line x1={x - 5} y1={lvY1} x2={x + 5} y2={lvY1} stroke="#64748b" strokeWidth="2" />
                <circle cx={x} cy={lvY1} r="2" fill="#60a5fa" />

                {/* Transformer Mounted on Pole (e.g. Pole 4) */}
                {hasEquip && (
                  <g>
                    <rect x={x + 7} y={crossarmY1 + 10} width="22" height="26" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.8" />
                    {/* Transformer Coil Symbol */}
                    <line x1={x + 11} y1={crossarmY1 + 19} x2={x + 25} y2={crossarmY1 + 19} stroke="#f59e0b" strokeWidth="1.5" />
                    <line x1={x + 11} y1={crossarmY1 + 24} x2={x + 25} y2={crossarmY1 + 24} stroke="#f59e0b" strokeWidth="1.5" />
                    <text x={x + 18} y={crossarmY1 + 45} textAnchor="middle" fill="#f59e0b" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                      {kvaText}
                    </text>
                  </g>
                )}

                {/* Deviation Angle Indicator below Ground */}
                {p.angle_deg > 0 && (
                  <g>
                    <path
                      d={
                        p.angle_deg > 20
                          ? `M ${x - 14} ${groundY1 + 24} L ${x} ${groundY1 + 24} L ${x + 12} ${groundY1 + 12}`
                          : `M ${x - 14} ${groundY1 + 24} L ${x} ${groundY1 + 24} L ${x + 12} ${groundY1 + 19}`
                      }
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <text x={x} y={groundY1 + 38} textAnchor="middle" fill="#22c55e" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                      {p.angle_deg}°
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Section 1 Conductor Catenary Curves & Spans */}
          {displaySec1.map((p, idx) => {
            if (idx === displaySec1.length - 1) return null
            const x1 = sec1StartX + idx * sec1Spacing
            const x2 = sec1StartX + (idx + 1) * sec1Spacing
            const midX = (x1 + x2) / 2
            const spanM = p.fore_span_m || 30

            return (
              <g key={`sec1-span-${idx}`}>
                {/* 11 kV Conductor Curve (White) */}
                <path d={`M ${x1} ${crossarmY1 - 5} Q ${midX} ${crossarmY1 + 14} ${x2} ${crossarmY1 - 5}`} fill="none" stroke="#ffffff" strokeWidth="1.8" />

                {/* LV Conductor Curve (Blue/Gray) */}
                <path d={`M ${x1} ${lvY1} Q ${midX} ${lvY1 + 13} ${x2} ${lvY1}`} fill="none" stroke="#60a5fa" strokeWidth="1.4" opacity="0.9" />

                {/* Dimension Arrows & Span Distance Label */}
                <g>
                  <line x1={x1 + 6} y1={groundY1 + 48} x2={midX - 18} y2={groundY1 + 48} stroke="#38bdf8" strokeWidth="1" markerStart="url(#arrowStart)" />
                  <text x={midX} y={groundY1 + 51} textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    {spanM} m
                  </text>
                  <line x1={midX + 18} y1={groundY1 + 48} x2={x2 - 6} y2={groundY1 + 48} stroke="#38bdf8" strokeWidth="1" markerEnd="url(#arrowEnd)" />
                </g>
              </g>
            )
          })}

          {/* Transition Arc from Section 1 (Pole 6) to Section 2 (Pole 7) */}
          {displaySec1.length > 0 && displaySec2.length > 0 && (
            <g>
              {/* S-curve transition line */}
              <path
                d={`M ${sec1StartX + 5 * sec1Spacing} ${crossarmY1 - 5} C ${sec1StartX + 5 * sec1Spacing + 55} 120, ${sec2StartX + 5 * sec2Spacing + 55} 270, ${sec2StartX + 5 * sec2Spacing} ${crossarmY2 - 5}`}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.8"
              />
              <path
                d={`M ${sec1StartX + 5 * sec1Spacing} ${lvY1} C ${sec1StartX + 5 * sec1Spacing + 42} 150, ${sec2StartX + 5 * sec2Spacing + 42} 290, ${sec2StartX + 5 * sec2Spacing} ${lvY2}`}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1.4"
                opacity="0.8"
              />
              {/* Transition Span Badge */}
              <rect x="915" y="210" width="38" height="20" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
              <text x="934" y="224" textAnchor="middle" fill="#f8fafc" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                38 m
              </text>
            </g>
          )}

          {/* Section 2 Card Header */}
          <g>
            <text x="64" y="284" fill="#38bdf8" fontSize="13" fontWeight="bold">Section 2</text>
            <text x="124" y="284" fill="#64748b" fontSize="10">Poles 7–13 • {sec2Length > 0 ? `${sec2Length} m` : '174 m'} • flows right to left</text>
          </g>

          {/* Ground Plane Section 2 */}
          <line x1="48" y1={groundY2} x2="980" y2={groundY2} stroke="#475569" strokeWidth="1.5" />
          <rect x="48" y={groundY2} width="932" height="18" fill="url(#groundHatch)" />

          {/* Section 2 Poles & Equipment (Rendered sequentially 7 to 13) */}
          {displaySec2.map((p, idx) => {
            // Render sequentially from right to left or left to right
            // In the reference image, row 2 aligns Pole 7 on the right, Pole 13 on the left:
            const x = sec2StartX + (displaySec2.length - 1 - idx) * (sec1Spacing * 5 / (displaySec2.length - 1))
            const isTerminal = idx === displaySec2.length - 1 || p.spur?.includes('Terminal')
            const isSectionPole = idx === 0 || p.pole_no === 7

            const badgeBg = isTerminal ? '#261214' : isSectionPole ? '#2e1065' : '#1e293b'
            const badgeBorder = isTerminal ? '#ef4444' : isSectionPole ? '#a855f7' : '#94a3b8'
            const badgeText = isTerminal ? '#f87171' : isSectionPole ? '#d8b4fe' : '#f8fafc'

            return (
              <g
                key={`sec2-pole-${p.pole_no}`}
                onMouseEnter={() => setHoveredPole(p)}
                onMouseLeave={() => setHoveredPole(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pole Badge */}
                <rect x={x - 11} y="274" width="22" height="20" rx="4" fill={badgeBg} stroke={badgeBorder} strokeWidth="1.5" />
                <text x={x} y="288" textAnchor="middle" fill={badgeText} fontSize="11" fontWeight="bold" fontFamily="monospace">
                  {p.pole_no}
                </text>

                {/* Section Pole Guy Wire (Pole 7) */}
                {isSectionPole && (
                  <g>
                    <line x1={x + 2} y1={crossarmY2 + 10} x2={x + 40} y2={groundY2} stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 3" />
                    <rect x={x + 38} y={groundY2} width="6" height="4" fill="#a855f7" opacity="0.8" />
                  </g>
                )}

                {/* Terminal Pole Guy Wire (Pole 13) */}
                {isTerminal && (
                  <g>
                    <line x1={x - 2} y1={crossarmY2 + 10} x2={x - 42} y2={groundY2} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 3" />
                    <rect x={x - 45} y={groundY2} width="6" height="4" fill="#ef4444" opacity="0.8" />
                  </g>
                )}

                {/* Pole Foundation Concrete Block */}
                <polygon points={`${x - 6},${groundY2 + 8} ${x + 6},${groundY2 + 8} ${x + 4},${groundY2 - 2} ${x - 4},${groundY2 - 2}`} fill="#64748b" opacity="0.7" />

                {/* Vertical Pole Shaft */}
                <line x1={x} y1={groundY2} x2={x} y2={poleTopY2} stroke="#94a3b8" strokeWidth="4.5" strokeLinecap="round" />

                {/* Top Crossarm */}
                <line x1={x - 14} y1={crossarmY2} x2={x + 14} y2={crossarmY2} stroke="#cbd5e1" strokeWidth="2.5" />

                {/* Pin Insulator Ring for 11 kV */}
                <circle cx={x} cy={crossarmY2 - 5} r="3" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* LV Bracket & Insulator */}
                <line x1={x - 5} y1={lvY2} x2={x + 5} y2={lvY2} stroke="#64748b" strokeWidth="2" />
                <circle cx={x} cy={lvY2} r="2" fill="#60a5fa" />

                {/* Deviation Angle Indicator below Ground */}
                {p.angle_deg > 0 && (
                  <g>
                    <path
                      d={
                        p.angle_deg > 20
                          ? `M ${x - 14} ${groundY2 + 24} L ${x} ${groundY2 + 24} L ${x + 12} ${groundY2 + 12}`
                          : `M ${x - 14} ${groundY2 + 24} L ${x} ${groundY2 + 24} L ${x + 12} ${groundY2 + 19}`
                      }
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <text x={x} y={groundY2 + 38} textAnchor="middle" fill="#22c55e" fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                      {p.angle_deg}°
                    </text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Section 2 Conductor Catenary Curves & Spans */}
          {displaySec2.map((p, idx) => {
            if (idx === displaySec2.length - 1) return null
            const step = (sec1Spacing * 5) / (displaySec2.length - 1)
            const xRight = sec2StartX + (displaySec2.length - 1 - idx) * step
            const xLeft = sec2StartX + (displaySec2.length - 2 - idx) * step
            const midX = (xLeft + xRight) / 2
            const spanM = p.fore_span_m || 30

            return (
              <g key={`sec2-span-${idx}`}>
                {/* 11 kV Conductor Curve */}
                <path d={`M ${xRight} ${crossarmY2 - 5} Q ${midX} ${crossarmY2 + 14} ${xLeft} ${crossarmY2 - 5}`} fill="none" stroke="#ffffff" strokeWidth="1.8" />

                {/* LV Conductor Curve */}
                <path d={`M ${xRight} ${lvY2} Q ${midX} ${lvY2 + 13} ${xLeft} ${lvY2}`} fill="none" stroke="#60a5fa" strokeWidth="1.4" opacity="0.9" />

                {/* Dimension Arrows & Span Distance Label */}
                <g>
                  <line x1={xLeft + 6} y1={groundY2 + 48} x2={midX - 18} y2={groundY2 + 48} stroke="#38bdf8" strokeWidth="1" markerStart="url(#arrowStart)" />
                  <text x={midX} y={groundY2 + 51} textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    {spanM} m
                  </text>
                  <line x1={midX + 18} y1={groundY2 + 48} x2={xRight - 6} y2={groundY2 + 48} stroke="#38bdf8" strokeWidth="1" markerEnd="url(#arrowEnd)" />
                </g>
              </g>
            )
          })}

          {/* Bottom Footer Legend Bar */}
          <g>
            {/* Scale Bar */}
            <g>
              <text x="64" y="522" fill="#64748b" fontSize="8" fontWeight="bold">Scale</text>
              {/* 50m Scale Line with subdivisions: 0, 10, 20, 30, 40, 50 */}
              <rect x="98" y="516" width="36" height="4" fill="#ffffff" />
              <rect x="134" y="516" width="36" height="4" fill="#334155" />
              <rect x="170" y="516" width="36" height="4" fill="#ffffff" />
              <rect x="206" y="516" width="36" height="4" fill="#334155" />
              <rect x="242" y="516" width="36" height="4" fill="#ffffff" />
              <text x="98" y="530" fill="#64748b" fontSize="7" textAnchor="middle">0</text>
              <text x="134" y="530" fill="#64748b" fontSize="7" textAnchor="middle">10</text>
              <text x="170" y="530" fill="#64748b" fontSize="7" textAnchor="middle">20</text>
              <text x="206" y="530" fill="#64748b" fontSize="7" textAnchor="middle">30</text>
              <text x="242" y="530" fill="#64748b" fontSize="7" textAnchor="middle">40</text>
              <text x="278" y="530" fill="#64748b" fontSize="7" textAnchor="middle">50 m</text>
            </g>

            {/* Legend Item: Terminal Pole */}
            <rect x="370" y="516" width="8" height="8" rx="2" fill="#ef4444" />
            <text x="384" y="523" fill="#cbd5e1" fontSize="9">Terminal pole</text>

            {/* Legend Item: Section Pole */}
            <rect x="460" y="516" width="8" height="8" rx="2" fill="#a855f7" />
            <text x="474" y="523" fill="#cbd5e1" fontSize="9">Section pole</text>

            {/* Legend Item: Intermediate Pole */}
            <rect x="546" y="516" width="8" height="8" rx="2" fill="#f8fafc" />
            <text x="560" y="523" fill="#cbd5e1" fontSize="9">Intermediate pole</text>

            {/* Legend Item: 11 kV Conductor */}
            <line x1="656" y1="520" x2="674" y2="520" stroke="#ffffff" strokeWidth="2" />
            <text x="682" y="523" fill="#cbd5e1" fontSize="9">11 kV conductor</text>

            {/* Legend Item: LV Conductor */}
            <line x1="770" y1="520" x2="788" y2="520" stroke="#60a5fa" strokeWidth="1.8" />
            <text x="796" y="523" fill="#cbd5e1" fontSize="9">LV conductor</text>

            {/* Legend Item: Transformer */}
            <rect x="868" y="514" width="10" height="11" rx="2" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="884" y="523" fill="#cbd5e1" fontSize="9">Transformer</text>
          </g>
        </svg>

        {/* Hovered Pole Quick Telemetry Popover */}
        {hoveredPole && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              padding: '0.65rem 1rem',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.6)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              pointerEvents: 'none',
              backdropFilter: 'blur(6px)',
              zIndex: 20,
            }}
          >
            <div style={{ fontWeight: 'bold', color: '#38bdf8', borderBottom: '1px solid #334155', paddingBottom: '0.2rem', marginBottom: '0.3rem' }}>
              Pole {hoveredPole.pole_no} Telemetry
            </div>
            <div>Section: <strong style={{ color: '#f8fafc' }}>{hoveredPole.section}</strong></div>
            <div>Span (Fore): <strong style={{ color: '#f8fafc' }}>{hoveredPole.fore_span_m} m</strong></div>
            <div>Deviation Angle: <strong style={{ color: '#f8fafc' }}>{hoveredPole.angle_deg}°</strong></div>
            <div>Equipment: <strong style={{ color: '#fbbf24' }}>{hoveredPole.equipment || 'None'}</strong></div>
            {hoveredPole.recommended_pole && (
              <div>Recommended: <strong style={{ color: '#4ade80' }}>{hoveredPole.recommended_pole}</strong></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
