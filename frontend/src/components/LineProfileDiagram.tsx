import React, { useState } from 'react'
import { Download, Maximize2, Minimize2, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

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
  const { isDark, toggleTheme } = useTheme()
  const [hoveredPole, setHoveredPole] = useState<ProfilePoleData | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const activePoles = poles && poles.length > 0 ? poles : DEFAULT_PROFILE_POLES

  // Theme-aware color palette
  const c = isDark
    ? {
        containerBg: '#0c1322',
        headerBg: '#0f172a',
        border: '#1e293b',
        titleText: '#f8fafc',
        subtitleText: '#94a3b8',
        dotBg: '#38bdf8',
        btnBg: '#1e293b',
        btnText: '#94a3b8',
        btnBorder: '#334155',
        svgBg: '#0c1322',
        sectionHeader: '#38bdf8',
        sectionSub: '#64748b',
        groundLine: '#475569',
        groundHatch: '#334155',
        poleShaft: '#94a3b8',
        poleBase: '#64748b',
        crossarm: '#cbd5e1',
        insulatorRingFill: '#0f172a',
        insulatorRingStroke: '#cbd5e1',
        lvBracket: '#64748b',
        lvInsulator: '#60a5fa',
        conductor11kV: '#ffffff',
        conductorLV: '#60a5fa',
        dimArrow: '#38bdf8',
        dimText: '#f8fafc',
        angleStroke: '#22c55e',
        angleText: '#22c55e',
        badgeDefaultBg: '#1e293b',
        badgeDefaultBorder: '#94a3b8',
        badgeDefaultText: '#f8fafc',
        badgeTerminalBg: '#261214',
        badgeTerminalBorder: '#ef4444',
        badgeTerminalText: '#f87171',
        badgeSectionBg: '#2e1065',
        badgeSectionBorder: '#a855f7',
        badgeSectionText: '#d8b4fe',
        guyTerminal: '#ef4444',
        guySection: '#a855f7',
        transformerBoxBg: '#1e293b',
        transformerStroke: '#f59e0b',
        transformerText: '#f59e0b',
        transitionArc11: '#cbd5e1',
        transitionArcLV: '#60a5fa',
        transitionBadgeBg: '#0f172a',
        transitionBadgeBorder: '#38bdf8',
        transitionBadgeText: '#f8fafc',
        scaleLabel: '#64748b',
        scaleSegA: '#ffffff',
        scaleSegB: '#334155',
        legendText: '#cbd5e1',
        legendIntermediate: '#f8fafc',
        popoverBg: 'rgba(15, 23, 42, 0.95)',
        popoverBorder: '#38bdf8',
        popoverTitle: '#38bdf8',
        popoverText: '#f8fafc',
      }
    : {
        containerBg: '#ffffff',
        headerBg: '#f8fafc',
        border: '#cbd5e1',
        titleText: '#0f172a',
        subtitleText: '#64748b',
        dotBg: '#0284c7',
        btnBg: '#f1f5f9',
        btnText: '#475569',
        btnBorder: '#cbd5e1',
        svgBg: '#ffffff',
        sectionHeader: '#0369a1',
        sectionSub: '#64748b',
        groundLine: '#64748b',
        groundHatch: '#e2e8f0',
        poleShaft: '#475569',
        poleBase: '#94a3b8',
        crossarm: '#334155',
        insulatorRingFill: '#ffffff',
        insulatorRingStroke: '#334155',
        lvBracket: '#64748b',
        lvInsulator: '#2563eb',
        conductor11kV: '#1e293b', // Graphite dark conductor
        conductorLV: '#2563eb', // Royal blue LV conductor
        dimArrow: '#0284c7',
        dimText: '#0f172a',
        angleStroke: '#16a34a',
        angleText: '#15803d',
        badgeDefaultBg: '#f8fafc',
        badgeDefaultBorder: '#64748b',
        badgeDefaultText: '#0f172a',
        badgeTerminalBg: '#fee2e2',
        badgeTerminalBorder: '#ef4444',
        badgeTerminalText: '#b91c1c',
        badgeSectionBg: '#f3e8ff',
        badgeSectionBorder: '#a855f7',
        badgeSectionText: '#7e22ce',
        guyTerminal: '#dc2626',
        guySection: '#9333ea',
        transformerBoxBg: '#fffbeb',
        transformerStroke: '#d97706',
        transformerText: '#b45309',
        transitionArc11: '#475569',
        transitionArcLV: '#2563eb',
        transitionBadgeBg: '#f0f9ff',
        transitionBadgeBorder: '#0284c7',
        transitionBadgeText: '#0369a1',
        scaleLabel: '#64748b',
        scaleSegA: '#0f172a',
        scaleSegB: '#e2e8f0',
        legendText: '#334155',
        legendIntermediate: '#64748b',
        popoverBg: 'rgba(255, 255, 255, 0.97)',
        popoverBorder: '#0284c7',
        popoverTitle: '#0284c7',
        popoverText: '#0f172a',
      }

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
        backgroundColor: c.containerBg,
        borderRadius: isFullscreen ? 0 : '12px',
        border: `1px solid ${c.border}`,
        boxShadow: isDark
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
          : '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        color: c.titleText,
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        right: isFullscreen ? 0 : undefined,
        bottom: isFullscreen ? 0 : undefined,
        zIndex: isFullscreen ? 9999 : 1,
        height: isFullscreen ? '100vh' : 'auto',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Top Diagram Controls Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.25rem',
          backgroundColor: c.headerBg,
          borderBottom: `1px solid ${c.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.dotBg }} />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: c.titleText, letterSpacing: '0.3px' }}>
            Overhead Distribution Line Route Profile & Elevation
          </h3>
          <span style={{ fontSize: '0.75rem', color: c.subtitleText, marginLeft: '0.5rem' }}>
            {projectName} • 11 kV + LV Bundle
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Quick theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: c.btnBg,
              color: c.btnText,
              border: `1px solid ${c.btnBorder}`,
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
            title={isDark ? 'Switch to light blueprint theme' : 'Switch to dark CAD theme'}
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
            <span>{isDark ? 'Light View' : 'Dark CAD'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              backgroundColor: c.btnBg,
              color: c.btnText,
              border: `1px solid ${c.btnBorder}`,
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
              backgroundColor: c.btnBg,
              color: c.btnText,
              border: `1px solid ${c.btnBorder}`,
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
      <div style={{ position: 'relative', padding: '1rem 0.5rem 0.5rem', backgroundColor: c.svgBg }}>
        <svg
          id="line-profile-svg"
          viewBox="0 0 1040 550"
          style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: c.svgBg }}
        >
          <defs>
            {/* Ground Hatch Pattern */}
            <pattern id="groundHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke={c.groundHatch} strokeWidth="1" opacity="0.7" />
            </pattern>

            {/* Dimension Line Marker Arrows */}
            <marker id="arrowStart" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 9 2 L 2 5 L 9 8 z" fill={c.dimArrow} />
            </marker>
            <marker id="arrowEnd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 1 2 L 8 5 L 1 8 z" fill={c.dimArrow} />
            </marker>
          </defs>

          {/* Section 1 Card Header */}
          <g>
            <text x="64" y="44" fill={c.sectionHeader} fontSize="13" fontWeight="bold">Section 1</text>
            <text x="124" y="44" fill={c.sectionSub} fontSize="10">Poles 1–6 • {sec1Length > 0 ? `${sec1Length} m` : '194 m'} • flows left to right</text>
          </g>

          {/* Ground Plane Section 1 */}
          <line x1="48" y1={groundY1} x2="980" y2={groundY1} stroke={c.groundLine} strokeWidth="1.5" />
          <rect x="48" y={groundY1} width="932" height="18" fill="url(#groundHatch)" />

          {/* Section 1 Poles & Equipment */}
          {displaySec1.map((p, idx) => {
            const x = sec1StartX + idx * sec1Spacing
            const isTerminal = idx === 0 || p.spur?.includes('Terminal')
            const isFirst = idx === 0
            const hasEquip = Boolean(p.equipment && p.equipment !== 'None') || (p.kva && p.kva > 0)
            const kvaText = p.kva ? `${p.kva} kVA` : (p.equipment?.match(/\d+\s*kVA/i)?.[0] || '160 kVA')

            const badgeBg = isTerminal ? c.badgeTerminalBg : c.badgeDefaultBg
            const badgeBorder = isTerminal ? c.badgeTerminalBorder : c.badgeDefaultBorder
            const badgeText = isTerminal ? c.badgeTerminalText : c.badgeDefaultText

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
                    <line x1={x - 2} y1={crossarmY1 + 10} x2={x - 44} y2={groundY1} stroke={c.guyTerminal} strokeWidth="1.5" strokeDasharray="4 3" />
                    {/* Guy anchor block */}
                    <rect x={x - 47} y={groundY1} width="6" height="4" fill={c.guyTerminal} opacity="0.85" />
                  </g>
                )}

                {/* Pole Foundation Concrete Block */}
                <polygon points={`${x - 6},${groundY1 + 8} ${x + 6},${groundY1 + 8} ${x + 4},${groundY1 - 2} ${x - 4},${groundY1 - 2}`} fill={c.poleBase} opacity="0.75" />

                {/* Vertical Pole Shaft */}
                <line x1={x} y1={groundY1} x2={x} y2={poleTopY1} stroke={c.poleShaft} strokeWidth="4.5" strokeLinecap="round" />

                {/* Top Crossarm */}
                <line x1={x - 14} y1={crossarmY1} x2={x + 14} y2={crossarmY1} stroke={c.crossarm} strokeWidth="2.5" />

                {/* Pin Insulator Ring for 11 kV */}
                <circle cx={x} cy={crossarmY1 - 5} r="3" fill={c.insulatorRingFill} stroke={c.insulatorRingStroke} strokeWidth="1.5" />

                {/* LV Bracket & Insulator */}
                <line x1={x - 5} y1={lvY1} x2={x + 5} y2={lvY1} stroke={c.lvBracket} strokeWidth="2" />
                <circle cx={x} cy={lvY1} r="2" fill={c.lvInsulator} />

                {/* Transformer Mounted on Pole (e.g. Pole 4) */}
                {hasEquip && (
                  <g>
                    <rect x={x + 7} y={crossarmY1 + 10} width="22" height="26" rx="3" fill={c.transformerBoxBg} stroke={c.transformerStroke} strokeWidth="1.8" />
                    {/* Transformer Coil Symbol */}
                    <line x1={x + 11} y1={crossarmY1 + 19} x2={x + 25} y2={crossarmY1 + 19} stroke={c.transformerStroke} strokeWidth="1.5" />
                    <line x1={x + 11} y1={crossarmY1 + 24} x2={x + 25} y2={crossarmY1 + 24} stroke={c.transformerStroke} strokeWidth="1.5" />
                    <text x={x + 18} y={crossarmY1 + 45} textAnchor="middle" fill={c.transformerText} fontSize="8.5" fontWeight="bold" fontFamily="monospace">
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
                      stroke={c.angleStroke}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <text x={x} y={groundY1 + 38} textAnchor="middle" fill={c.angleText} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
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
                {/* 11 kV Conductor Curve */}
                <path d={`M ${x1} ${crossarmY1 - 5} Q ${midX} ${crossarmY1 + 14} ${x2} ${crossarmY1 - 5}`} fill="none" stroke={c.conductor11kV} strokeWidth="1.8" />

                {/* LV Conductor Curve */}
                <path d={`M ${x1} ${lvY1} Q ${midX} ${lvY1 + 13} ${x2} ${lvY1}`} fill="none" stroke={c.conductorLV} strokeWidth="1.4" opacity="0.9" />

                {/* Dimension Arrows & Span Distance Label */}
                <g>
                  <line x1={x1 + 6} y1={groundY1 + 48} x2={midX - 18} y2={groundY1 + 48} stroke={c.dimArrow} strokeWidth="1" markerStart="url(#arrowStart)" />
                  <text x={midX} y={groundY1 + 51} textAnchor="middle" fill={c.dimText} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    {spanM} m
                  </text>
                  <line x1={midX + 18} y1={groundY1 + 48} x2={x2 - 6} y2={groundY1 + 48} stroke={c.dimArrow} strokeWidth="1" markerEnd="url(#arrowEnd)" />
                </g>
              </g>
            )
          })}

          {/* Transition Arc from Section 1 (Pole 6) to Section 2 (Pole 7) */}
          {displaySec1.length > 0 && displaySec2.length > 0 && (
            <g>
              {/* S-curve transition line */}
              <path
                d={`M ${sec1StartX + 5 * sec1Spacing} ${crossarmY1 - 5} C ${sec1StartX + 5 * sec1Spacing + 55} 120, ${sec2StartX + 5 * sec1Spacing + 55} 270, ${sec2StartX + 5 * sec1Spacing} ${crossarmY2 - 5}`}
                fill="none"
                stroke={c.transitionArc11}
                strokeWidth="1.8"
              />
              <path
                d={`M ${sec1StartX + 5 * sec1Spacing} ${lvY1} C ${sec1StartX + 5 * sec1Spacing + 42} 150, ${sec2StartX + 5 * sec1Spacing + 42} 290, ${sec2StartX + 5 * sec1Spacing} ${lvY2}`}
                fill="none"
                stroke={c.transitionArcLV}
                strokeWidth="1.4"
                opacity="0.8"
              />
              {/* Transition Span Badge */}
              <rect x="915" y="210" width="38" height="20" rx="4" fill={c.transitionBadgeBg} stroke={c.transitionBadgeBorder} strokeWidth="1.2" />
              <text x="934" y="224" textAnchor="middle" fill={c.transitionBadgeText} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
                {displaySec1[displaySec1.length - 1]?.fore_span_m ? `${displaySec1[displaySec1.length - 1].fore_span_m} m` : '38 m'}
              </text>
            </g>
          )}

          {/* Section 2 Card Header */}
          <g>
            <text x="64" y="284" fill={c.sectionHeader} fontSize="13" fontWeight="bold">Section 2</text>
            <text x="124" y="284" fill={c.sectionSub} fontSize="10">Poles 7–13 • {sec2Length > 0 ? `${sec2Length} m` : '174 m'} • flows right to left</text>
          </g>

          {/* Ground Plane Section 2 */}
          <line x1="48" y1={groundY2} x2="980" y2={groundY2} stroke={c.groundLine} strokeWidth="1.5" />
          <rect x="48" y={groundY2} width="932" height="18" fill="url(#groundHatch)" />

          {/* Section 2 Poles & Equipment (Rendered sequentially 7 to 13) */}
          {displaySec2.map((p, idx) => {
            const step = (sec1Spacing * 5) / (displaySec2.length - 1)
            const x = sec2StartX + (displaySec2.length - 1 - idx) * step
            const isTerminal = idx === displaySec2.length - 1 || p.spur?.includes('Terminal')
            const isSectionPole = idx === 0 || p.pole_no === 7

            const badgeBg = isTerminal ? c.badgeTerminalBg : isSectionPole ? c.badgeSectionBg : c.badgeDefaultBg
            const badgeBorder = isTerminal ? c.badgeTerminalBorder : isSectionPole ? c.badgeSectionBorder : c.badgeDefaultBorder
            const badgeText = isTerminal ? c.badgeTerminalText : isSectionPole ? c.badgeSectionText : c.badgeDefaultText

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
                    <line x1={x + 2} y1={crossarmY2 + 10} x2={x + 40} y2={groundY2} stroke={c.guySection} strokeWidth="1.5" strokeDasharray="4 3" />
                    <rect x={x + 38} y={groundY2} width="6" height="4" fill={c.guySection} opacity="0.85" />
                  </g>
                )}

                {/* Terminal Pole Guy Wire (Pole 13) */}
                {isTerminal && (
                  <g>
                    <line x1={x - 2} y1={crossarmY2 + 10} x2={x - 42} y2={groundY2} stroke={c.guyTerminal} strokeWidth="1.5" strokeDasharray="4 3" />
                    <rect x={x - 45} y={groundY2} width="6" height="4" fill={c.guyTerminal} opacity="0.85" />
                  </g>
                )}

                {/* Pole Foundation Concrete Block */}
                <polygon points={`${x - 6},${groundY2 + 8} ${x + 6},${groundY2 + 8} ${x + 4},${groundY2 - 2} ${x - 4},${groundY2 - 2}`} fill={c.poleBase} opacity="0.75" />

                {/* Vertical Pole Shaft */}
                <line x1={x} y1={groundY2} x2={x} y2={poleTopY2} stroke={c.poleShaft} strokeWidth="4.5" strokeLinecap="round" />

                {/* Top Crossarm */}
                <line x1={x - 14} y1={crossarmY2} x2={x + 14} y2={crossarmY2} stroke={c.crossarm} strokeWidth="2.5" />

                {/* Pin Insulator Ring for 11 kV */}
                <circle cx={x} cy={crossarmY2 - 5} r="3" fill={c.insulatorRingFill} stroke={c.insulatorRingStroke} strokeWidth="1.5" />

                {/* LV Bracket & Insulator */}
                <line x1={x - 5} y1={lvY2} x2={x + 5} y2={lvY2} stroke={c.lvBracket} strokeWidth="2" />
                <circle cx={x} cy={lvY2} r="2" fill={c.lvInsulator} />

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
                      stroke={c.angleStroke}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <text x={x} y={groundY2 + 38} textAnchor="middle" fill={c.angleText} fontSize="9.5" fontWeight="bold" fontFamily="monospace">
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
                <path d={`M ${xRight} ${crossarmY2 - 5} Q ${midX} ${crossarmY2 + 14} ${xLeft} ${crossarmY2 - 5}`} fill="none" stroke={c.conductor11kV} strokeWidth="1.8" />

                {/* LV Conductor Curve */}
                <path d={`M ${xRight} ${lvY2} Q ${midX} ${lvY2 + 13} ${xLeft} ${lvY2}`} fill="none" stroke={c.conductorLV} strokeWidth="1.4" opacity="0.9" />

                {/* Dimension Arrows & Span Distance Label */}
                <g>
                  <line x1={xLeft + 6} y1={groundY2 + 48} x2={midX - 18} y2={groundY2 + 48} stroke={c.dimArrow} strokeWidth="1" markerStart="url(#arrowStart)" />
                  <text x={midX} y={groundY2 + 51} textAnchor="middle" fill={c.dimText} fontSize="9" fontWeight="bold" fontFamily="monospace">
                    {spanM} m
                  </text>
                  <line x1={midX + 18} y1={groundY2 + 48} x2={xRight - 6} y2={groundY2 + 48} stroke={c.dimArrow} strokeWidth="1" markerEnd="url(#arrowEnd)" />
                </g>
              </g>
            )
          })}

          {/* Bottom Footer Legend Bar */}
          <g>
            {/* Scale Bar */}
            <g>
              <text x="64" y="522" fill={c.scaleLabel} fontSize="8" fontWeight="bold">Scale</text>
              {/* 50m Scale Line with subdivisions: 0, 10, 20, 30, 40, 50 */}
              <rect x="98" y="516" width="36" height="4" fill={c.scaleSegA} />
              <rect x="134" y="516" width="36" height="4" fill={c.scaleSegB} />
              <rect x="170" y="516" width="36" height="4" fill={c.scaleSegA} />
              <rect x="206" y="516" width="36" height="4" fill={c.scaleSegB} />
              <rect x="242" y="516" width="36" height="4" fill={c.scaleSegA} />
              <text x="98" y="530" fill={c.scaleLabel} fontSize="7" textAnchor="middle">0</text>
              <text x="134" y="530" fill={c.scaleLabel} fontSize="7" textAnchor="middle">10</text>
              <text x="170" y="530" fill={c.scaleLabel} fontSize="7" textAnchor="middle">20</text>
              <text x="206" y="530" fill={c.scaleLabel} fontSize="7" textAnchor="middle">30</text>
              <text x="242" y="530" fill={c.scaleLabel} fontSize="7" textAnchor="middle">40</text>
              <text x="278" y="530" fill={c.scaleLabel} fontSize="7" textAnchor="middle">50 m</text>
            </g>

            {/* Legend Item: Terminal Pole */}
            <rect x="370" y="516" width="8" height="8" rx="2" fill={c.badgeTerminalBorder} />
            <text x="384" y="523" fill={c.legendText} fontSize="9">Terminal pole</text>

            {/* Legend Item: Section Pole */}
            <rect x="460" y="516" width="8" height="8" rx="2" fill={c.badgeSectionBorder} />
            <text x="474" y="523" fill={c.legendText} fontSize="9">Section pole</text>

            {/* Legend Item: Intermediate Pole */}
            <rect x="546" y="516" width="8" height="8" rx="2" fill={c.legendIntermediate} stroke={c.badgeDefaultBorder} strokeWidth="0.8" />
            <text x="560" y="523" fill={c.legendText} fontSize="9">Intermediate pole</text>

            {/* Legend Item: 11 kV Conductor */}
            <line x1="656" y1="520" x2="674" y2="520" stroke={c.conductor11kV} strokeWidth="2" />
            <text x="682" y="523" fill={c.legendText} fontSize="9">11 kV conductor</text>

            {/* Legend Item: LV Conductor */}
            <line x1="770" y1="520" x2="788" y2="520" stroke={c.conductorLV} strokeWidth="1.8" />
            <text x="796" y="523" fill={c.legendText} fontSize="9">LV conductor</text>

            {/* Legend Item: Transformer */}
            <rect x="868" y="514" width="10" height="11" rx="2" fill={c.transformerBoxBg} stroke={c.transformerStroke} strokeWidth="1.5" />
            <text x="884" y="523" fill={c.legendText} fontSize="9">Transformer</text>
          </g>
        </svg>

        {/* Hovered Pole Quick Telemetry Popover */}
        {hoveredPole && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              backgroundColor: c.popoverBg,
              border: `1px solid ${c.popoverBorder}`,
              borderRadius: '8px',
              padding: '0.65rem 1rem',
              boxShadow: isDark ? '0 8px 20px rgba(0, 0, 0, 0.6)' : '0 8px 24px rgba(0, 0, 0, 0.12)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              pointerEvents: 'none',
              backdropFilter: 'blur(6px)',
              zIndex: 20,
            }}
          >
            <div style={{ fontWeight: 'bold', color: c.popoverTitle, borderBottom: `1px solid ${c.border}`, paddingBottom: '0.2rem', marginBottom: '0.3rem' }}>
              Pole {hoveredPole.pole_no} Telemetry
            </div>
            <div>Section: <strong style={{ color: c.popoverText }}>{hoveredPole.section}</strong></div>
            <div>Span (Fore): <strong style={{ color: c.popoverText }}>{hoveredPole.fore_span_m} m</strong></div>
            <div>Deviation Angle: <strong style={{ color: c.popoverText }}>{hoveredPole.angle_deg}°</strong></div>
            <div>Equipment: <strong style={{ color: '#d97706' }}>{hoveredPole.equipment || 'None'}</strong></div>
            {hoveredPole.recommended_pole && (
              <div>Recommended: <strong style={{ color: '#16a34a' }}>{hoveredPole.recommended_pole}</strong></div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
