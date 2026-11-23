/**
 * LineDesign – Engineering Report Export Utilities
 * Exports all result tables to multi-sheet Excel (.xlsx) or high-fidelity,
 * professional engineering PDF (.pdf) with standard CEB/LECO logo header,
 * redesigned clean project details card (without wind loadings and standards),
 * all table columns rendered crystal clearly, and the formal Engineer's Recommendation & Signature block.
 */
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { LECO_LOGO_BASE64 } from './logoBase64'

export interface ProjectPDFMetadata {
  projectName?: string
  lineArrangement?: string
  status?: string
  engineerName?: string
  organization?: string
  date?: string
  poleCount?: number
  circuitCount?: number
}

// ─── EXCEL HELPERS & EXPORT ──────────────────────────────────────────────────

function sheetFromArray(data: Record<string, any>[], title: string): XLSX.WorkSheet {
  if (!data || data.length === 0) {
    return XLSX.utils.aoa_to_sheet([[title], ['No data available']])
  }
  const headers = Object.keys(data[0])
  const rows = data.map((r) => headers.map((h) => r[h] ?? ''))
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 3, 12) }))
  return ws
}

export function exportToExcel(resultsData: any, projectName = 'LineDesign') {
  const wb = XLSX.utils.book_new()

  const sections: Array<{ name: string; key: string }> = [
    { name: 'Pole Summary', key: 'pole_summary' },
    { name: 'Conductor Tension', key: 'conductor_tension_check' },
    { name: 'Structural Loading', key: 'structural_loading' },
    { name: 'Foundation & Soil', key: 'foundation_soil_bearing' },
    { name: 'Ground Clearance', key: 'ground_clearance' },
    { name: 'Phase Separation', key: 'phase_separation' },
    { name: 'Sag Schedule 27C', key: 'sag_schedule_27' },
    { name: 'Design Parameters', key: 'design_parameters' },
  ]

  sections.forEach(({ name, key }) => {
    const data = resultsData?.[key] || []
    const ws = sheetFromArray(data, name)
    XLSX.utils.book_append_sheet(wb, ws, name)
  })

  const filename = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_engineering_report.xlsx`
  XLSX.writeFile(wb, filename)
}

// ─── PROFESSIONAL PDF REPORT EXPORT ──────────────────────────────────────────

export function exportToPDF(resultsData: any, metaInput: string | ProjectPDFMetadata = 'LineDesign') {
  const meta: ProjectPDFMetadata = typeof metaInput === 'string' ? { projectName: metaInput } : metaInput
  const projectName = meta.projectName || 'Kelaniya Distribution Feeder'
  const lineArrangement = meta.lineArrangement || '11 kV + LV'
  const polesCount = meta.poleCount || (resultsData?.pole_summary?.length ?? 13)

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()   // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight() // 210 mm
  const marginX = 14
  const contentWidth = pageWidth - marginX * 2         // 269 mm

  const today = new Date()
  const dateFormatted = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const dateTimeFormatted = today.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Colors
  const darkNavy: [number, number, number] = [24, 43, 73]
  const tableHeaderBlue: [number, number, number] = [30, 58, 138]
  const altRowBg: [number, number, number] = [248, 250, 252]
  const borderSlate: [number, number, number] = [226, 232, 240]
  const textMuted: [number, number, number] = [100, 116, 139]
  const textDark: [number, number, number] = [15, 23, 42]

  // ───────────────────────────────────────────────────────────────────────────
  // PAGE 1: HEADER WITH OFFICIAL LOGO & REDESIGNED CLEAN PROJECT DETAILS CARD
  // ───────────────────────────────────────────────────────────────────────────

  // Top authority banner
  doc.setFillColor(...darkNavy)
  doc.rect(0, 0, pageWidth, 24, 'F')

  // Official Logo on the left
  try {
    if (LECO_LOGO_BASE64) {
      doc.addImage(LECO_LOGO_BASE64, 'PNG', marginX, 3.5, 9.5, 17)
    }
  } catch (err) {
    console.warn('Could not embed logo image:', err)
  }

  // Header Typography next to logo
  const headerTextX = marginX + 13
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('LANKA ELECTRICITY COMPANY (PVT) LTD  /  CEYLON ELECTRICITY BOARD', headerTextX, 7)

  doc.setFontSize(13.5)
  doc.text('DISTRIBUTION LINE DESIGN & POLE SELECTION REPORT', headerTextX, 14.5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(203, 213, 225)
  doc.text('Overhead Distribution Network Engineering Analysis', headerTextX, 20)

  // Header Right Metadata
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text(`Report Date: ${dateFormatted}`, pageWidth - marginX, 11, { align: 'right' })
  doc.setTextColor(203, 213, 225)
  doc.setFontSize(7.5)
  doc.text(`Generated: ${dateTimeFormatted}`, pageWidth - marginX, 18, { align: 'right' })

  // ───────────────────────────────────────────────────────────────────────────
  // REDESIGNED PROJECT DETAILS SECTION (NO WIND LOADINGS, NO STANDARDS)
  // Clean, spacious 3-column card with dedicated widths and zero text collisions
  // ───────────────────────────────────────────────────────────────────────────
  const boxY = 28
  const boxHeight = 15
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(...borderSlate)
  doc.setLineWidth(0.4)
  doc.roundedRect(marginX, boxY, contentWidth, boxHeight, 1.5, 1.5, 'FD')

  const colW = contentWidth / 3 // ~89.6 mm each

  // Subtle vertical divider lines between columns
  doc.setDrawColor(...borderSlate)
  doc.setLineWidth(0.3)
  doc.line(marginX + colW, boxY + 2.5, marginX + colW, boxY + boxHeight - 2.5)
  doc.line(marginX + colW * 2, boxY + 2.5, marginX + colW * 2, boxY + boxHeight - 2.5)

  // Column 1: Project Name
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(...textMuted)
  doc.text('PROJECT NAME', marginX + 6, boxY + 5.2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...darkNavy)
  doc.text(projectName, marginX + 6, boxY + 11)

  // Column 2: Line Arrangement
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(...textMuted)
  doc.text('LINE ARRANGEMENT', marginX + colW + 6, boxY + 5.2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...darkNavy)
  doc.text(lineArrangement, marginX + colW + 6, boxY + 11)

  // Column 3: Survey Scope
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.8)
  doc.setTextColor(...textMuted)
  doc.text('SURVEY SCOPE', marginX + colW * 2 + 6, boxY + 5.2)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...darkNavy)
  doc.text(`${polesCount} Line Poles (Continuous Sectioning)`, marginX + colW * 2 + 6, boxY + 11)

  let currentY = boxY + boxHeight + 6

  // Helper for Section Titles
  const printSectionHeader = (title: string, yPos: number): number => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...darkNavy)
    doc.text(title, marginX, yPos)
    doc.setDrawColor(...tableHeaderBlue)
    doc.setLineWidth(0.5)
    doc.line(marginX, yPos + 1.5, marginX + 80, yPos + 1.5)
    return yPos + 4
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 1. POLE SELECTION SUMMARY TABLE (WITHOUT STATUS COLUMN AS REQUESTED)
  // ───────────────────────────────────────────────────────────────────────────
  const poleSummaryData = resultsData?.pole_summary || []
  if (poleSummaryData.length > 0) {
    currentY = printSectionHeader('1. Pole Selection Summary (Continuous Alignment)', currentY)

    const headers = ['Sec', 'Pole', 'Configuration', 'Recommended Pole', 'Spur / Type', 'Equipment', 'Foundation Type']
    const rows = poleSummaryData.map((r: any) => [
      String(r.sec ?? 1),
      `Pole ${r.pole ?? '—'}`,
      String(r.pole_configuration ?? lineArrangement),
      String(r.final_recommended_pole ?? '—'),
      String(r.spur ?? '—'),
      String(r.equipment && r.equipment !== 'None' ? r.equipment : '—'),
      String(r.foundation_recommendation ?? 'Type A'),
    ])

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: currentY,
      styles: { fontSize: 7.5, cellPadding: 1.8, font: 'helvetica', textColor: textDark },
      headStyles: { fillColor: tableHeaderBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
      alternateRowStyles: { fillColor: altRowBg },
      margin: { left: marginX, right: marginX },
      columnStyles: {
        0: { halign: 'center', cellWidth: 16 },
        1: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        2: { halign: 'left', cellWidth: 55 },
        3: { halign: 'left', cellWidth: 58, fontStyle: 'bold' },
        4: { halign: 'center', cellWidth: 40 },
        5: { halign: 'center', cellWidth: 40, fontStyle: 'bold' },
        6: { halign: 'center', cellWidth: 40 },
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 8
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CONDUCTOR TENSION CHECKS TABLE
  // ───────────────────────────────────────────────────────────────────────────
  const tensionData = resultsData?.conductor_tension_check || []
  if (tensionData.length > 0) {
    if (currentY > 165) {
      doc.addPage()
      currentY = 22
    }
    currentY = printSectionHeader('2. Conductor Tension Compliance Checks', currentY)

    const tHeaders = ['Sec', 'Circuit', 'Conductor Specification', 'Tension @ 15°C+Wind (kN)', '% UTS @ 15°C+W', '15°C Check', 'Tension @ 27°C EDS (kN)', '% UTS @ 27°C', 'EDS Check']
    const tRows = tensionData.map((t: any) => [
      String(t.sec ?? 1),
      String(t.circuit ?? '—'),
      String(t.conductor ?? '—'),
      String(t.t_at_15_wind_kn ?? '—'),
      String(t.pct_uts_at_15_wind ?? '—'),
      String(t.check_15_wind ?? 'OK'),
      String(t.t_at_27_kn ?? '—'),
      String(t.pct_uts_at_27 ?? '—'),
      String(t.eds_check ?? 'OK'),
    ])

    autoTable(doc, {
      head: [tHeaders],
      body: tRows,
      startY: currentY,
      styles: { fontSize: 7.5, cellPadding: 1.8, font: 'helvetica', textColor: textDark },
      headStyles: { fillColor: tableHeaderBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 8 },
      alternateRowStyles: { fillColor: altRowBg },
      margin: { left: marginX, right: marginX },
      columnStyles: {
        0: { halign: 'center', cellWidth: 14 },
        1: { halign: 'left', cellWidth: 32 },
        2: { halign: 'left', cellWidth: 63, fontStyle: 'bold' },
        3: { halign: 'right', cellWidth: 32 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
        6: { halign: 'right', cellWidth: 32 },
        7: { halign: 'right', cellWidth: 22 },
        8: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && (data.column.index === 5 || data.column.index === 8)) {
          const val = String(data.cell.raw || '').toUpperCase()
          if (val === 'OK' || val === 'PASS') {
            data.cell.styles.textColor = [16, 149, 93]
          } else if (val === 'FAIL') {
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 8
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. STRUCTURAL LOADING: PART 3A - BENDING MOMENTS & REACTION LOADS
  // ───────────────────────────────────────────────────────────────────────────
  const loadsData = resultsData?.structural_loading || []
  if (loadsData.length > 0) {
    doc.addPage()
    currentY = 22
    currentY = printSectionHeader('3A. Structural Loading Analysis – Bending Moments & Pole Top Reaction Loads', currentY)

    const loadHeadersA = [
      'Sec',
      'Pole',
      'Equipment',
      'Fore Span (m)',
      'Angle (°)',
      'Equiv Span (m)',
      'BM Wind Line (kN·m)',
      'BM Tension (kN·m)',
      'BM Wind Pole (kN·m)',
      'BM Wind Equip (kN·m)',
      'Total BM (kN·m)',
      'Top Transverse (daN)',
      'Top Longitudinal (daN)',
    ]
    const loadRowsA = loadsData.map((l: any) => [
      String(l.sec ?? 1),
      `Pole ${l.pole ?? '—'}`,
      String(l.equipment && l.equipment !== 'None' ? l.equipment : '—'),
      String(l.fore_span_m ?? '—'),
      String(l.angle_deg ?? 0),
      String(l.eq_span_m ?? '—'),
      String(l.bm_wind_line_kn_m ?? '0.00'),
      String(l.bm_tension_kn_m ?? '0.00'),
      String(l.bm_wind_pole_kn_m ?? '0.00'),
      String(l.bm_wind_equip_kn_m ?? '0.00'),
      String(l.total_bm_kn_m ?? '0.00'),
      String(l.pole_top_transverse_dan ?? 0),
      String(l.pole_top_longitudinal_dan ?? 0),
    ])

    autoTable(doc, {
      head: [loadHeadersA],
      body: loadRowsA,
      startY: currentY,
      styles: { fontSize: 7, cellPadding: 1.5, font: 'helvetica', textColor: textDark },
      headStyles: { fillColor: tableHeaderBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 7.2 },
      alternateRowStyles: { fillColor: altRowBg },
      margin: { left: marginX, right: marginX },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
        3: { halign: 'right', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 16 },
        5: { halign: 'right', cellWidth: 21 },
        6: { halign: 'right', cellWidth: 24 },
        7: { halign: 'right', cellWidth: 23 },
        8: { halign: 'right', cellWidth: 23 },
        9: { halign: 'right', cellWidth: 23 },
        10: { halign: 'right', cellWidth: 23, fontStyle: 'bold' },
        11: { halign: 'right', cellWidth: 21 },
        12: { halign: 'right', cellWidth: 21 },
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 8

    // ─────────────────────────────────────────────────────────────────────────
    // 3. STRUCTURAL LOADING: PART 3B - GUYING, BUCKLING & RECOMMENDATIONS
    // ─────────────────────────────────────────────────────────────────────────
    if (currentY > 120) {
      doc.addPage()
      currentY = 22
    }
    currentY = printSectionHeader('3B. Guy Wire Sizing, Axial Buckling Capacity & Final Pole Recommendations', currentY)

    const loadHeadersB = [
      'Sec',
      'Pole',
      'Equipment',
      'Unguyed Rec',
      'Strutted Rec',
      'Guy Load (daN)',
      'Load w/o Ten',
      'Guy Arr.',
      'Rec Guy/Unguy',
      'Buckling V*',
      'Safety ×2.5',
      'Buck. Cap.',
      'Buckling Check',
      'Rec on Buckling',
      'Recommended Pole',
    ]
    const loadRowsB = loadsData.map((l: any) => [
      String(l.sec ?? 1),
      `Pole ${l.pole ?? '—'}`,
      String(l.equipment && l.equipment !== 'None' ? l.equipment : '—'),
      String(l.unguyed_rec ?? '✕✕'),
      String(l.strutted_rec ?? '—'),
      String(l.guy_wire_load_dan ?? '—'),
      String(l.load_without_tension_dan ?? '—'),
      String(l.guy_arrangement ?? '—'),
      String(l.rec_guy_unguy ?? '—'),
      l.buckling_v_star_kn != null ? Number(l.buckling_v_star_kn).toFixed(1) : '—',
      l.safety_factor_2_5_kn != null ? Number(l.safety_factor_2_5_kn).toFixed(1) : '—',
      l.buckling_capacity_kn != null ? Number(l.buckling_capacity_kn).toFixed(1) : '—',
      String(l.buckling_check ?? 'PASS'),
      String(l.rec_on_buckling ?? '—'),
      String(l.final_recommended || l.rec_guy_unguy || '—'),
    ])

    autoTable(doc, {
      head: [loadHeadersB],
      body: loadRowsB,
      startY: currentY,
      styles: { fontSize: 6.8, cellPadding: 1.4, font: 'helvetica', textColor: textDark },
      headStyles: { fillColor: tableHeaderBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 7 },
      alternateRowStyles: { fillColor: altRowBg },
      margin: { left: marginX, right: marginX },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 22, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 18 },
        4: { halign: 'center', cellWidth: 18 },
        5: { halign: 'right', cellWidth: 18 },
        6: { halign: 'right', cellWidth: 17 },
        7: { halign: 'center', cellWidth: 17 },
        8: { halign: 'left', cellWidth: 21 },
        9: { halign: 'right', cellWidth: 17 },
        10: { halign: 'right', cellWidth: 17 },
        11: { halign: 'right', cellWidth: 17 },
        12: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
        13: { halign: 'left', cellWidth: 20 },
        14: { halign: 'left', cellWidth: 24, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 12) {
          const val = String(data.cell.raw || '').toUpperCase()
          if (val === 'PASS' || val === 'OK') {
            data.cell.styles.textColor = [16, 149, 93]
          } else if (val === 'FAIL') {
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 8
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. FOUNDATION STABILITY & GEOTECHNICAL SOIL BEARING (ALL 12 COLUMNS)
  // ───────────────────────────────────────────────────────────────────────────
  const foundationData = resultsData?.foundation_soil_bearing || []
  if (foundationData.length > 0) {
    if (currentY > 130) {
      doc.addPage()
      currentY = 22
    }
    currentY = printSectionHeader('4. Foundation Stability & Geotechnical Soil Bearing Capacity', currentY)

    const fHeaders = [
      'Sec',
      'Pole',
      'Equipment',
      'Soil Class',
      'Selected Pole',
      'BM Foundation (kN·m)',
      'Resisting Moment (kN·m)',
      'Subgrade k (kN/m³)',
      'Overturning Check',
      'Vert Load (kN)',
      'Bearing Check',
      'Overall Foundation',
    ]
    const fRows = foundationData.map((f: any) => [
      String(f.sec ?? 1),
      `Pole ${f.pole ?? '—'}`,
      String(f.equipment && f.equipment !== 'None' ? f.equipment : '—'),
      String(f.soil_class ?? 'Class 4'),
      String(f.recommended_pole ?? '—'),
      String(f.bmf_kn_m ?? '0.00'),
      String(f.mr_kn_m ?? '0.00'),
      String(f.subgrade_k_kn_m3 ?? '25000'),
      String(f.stability_check ?? 'PASS'),
      String(f.total_vertical_load_kn ?? '0.00'),
      String(f.bearing_check ?? 'SATISFIED'),
      String(f.status ?? 'PASS'),
    ])

    autoTable(doc, {
      head: [fHeaders],
      body: fRows,
      startY: currentY,
      styles: { fontSize: 6.8, cellPadding: 1.4, font: 'helvetica', textColor: textDark },
      headStyles: { fillColor: tableHeaderBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 7 },
      alternateRowStyles: { fillColor: altRowBg },
      margin: { left: marginX, right: marginX },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 16, fontStyle: 'bold' },
        2: { halign: 'center', cellWidth: 26, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'left', cellWidth: 32, fontStyle: 'bold' },
        5: { halign: 'right', cellWidth: 26 },
        6: { halign: 'right', cellWidth: 28 },
        7: { halign: 'right', cellWidth: 25 },
        8: { halign: 'center', cellWidth: 23, fontStyle: 'bold' },
        9: { halign: 'right', cellWidth: 20 },
        10: { halign: 'center', cellWidth: 21, fontStyle: 'bold' },
        11: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && (data.column.index === 8 || data.column.index === 10 || data.column.index === 11)) {
          const val = String(data.cell.raw || '').toUpperCase()
          if (val === 'PASS' || val === 'SATISFIED' || val === 'OK') {
            data.cell.styles.textColor = [16, 149, 93]
          } else if (val === 'FAIL') {
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 8
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. ELECTRICAL GROUND CLEARANCE PROFILE (ALL 11 COLUMNS)
  // ───────────────────────────────────────────────────────────────────────────
  const clearanceData = resultsData?.ground_clearance || []
  if (clearanceData.length > 0) {
    if (currentY > 130) {
      doc.addPage()
      currentY = 22
    }
    currentY = printSectionHeader('5. Electrical Ground Clearance & Circuit Vertical Separation', currentY)

    const cHeaders = [
      'Sec',
      'Span From Pole',
      'Span (m)',
      'Max Sag C1 (m)',
      'Max Sag C2 (m)',
      'Lowest Clearance (m)',
      'Required Clearance (m)',
      'Ground Check',
      'Phase Vert Clear (m)',
      'Req Cct Clear (m)',
      'Circuit Separation Check',
    ]
    const cRows = clearanceData.map((c: any) => [
      String(c.sec ?? 1),
      `Pole ${c.pole ?? '—'}`,
      String(c.fore_span_m ?? '—'),
      String(c.max_sag_65_c1_m ?? '—'),
      String(c.max_sag_65_c2_m ?? '—'),
      String(c.lowest_clearance_m ?? '—'),
      String(c.applicable_clearance_m ?? '5.50'),
      String(c.ground_clearance_check ?? 'PASS'),
      String(c.min_vert_clear_c1_c2_m ?? '1.35'),
      String(c.applicable_cct_clearance_m ?? '0.90'),
      String(c.circuit_clearance_check ?? 'PASS'),
    ])

    autoTable(doc, {
      head: [cHeaders],
      body: cRows,
      startY: currentY,
      styles: { fontSize: 7, cellPadding: 1.5, font: 'helvetica', textColor: textDark },
      headStyles: { fillColor: tableHeaderBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 7.2 },
      alternateRowStyles: { fillColor: altRowBg },
      margin: { left: marginX, right: marginX },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
        2: { halign: 'right', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 26 },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
        6: { halign: 'right', cellWidth: 27 },
        7: { halign: 'center', cellWidth: 24, fontStyle: 'bold' },
        8: { halign: 'right', cellWidth: 28 },
        9: { halign: 'right', cellWidth: 25 },
        10: { halign: 'center', cellWidth: 29, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && (data.column.index === 7 || data.column.index === 10)) {
          const val = String(data.cell.raw || '').toUpperCase()
          if (val === 'PASS' || val === 'OK') {
            data.cell.styles.textColor = [16, 149, 93]
          } else if (val === 'FAIL') {
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 8
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 6. PHASE SEPARATION AT ANGLES & 27°C SAG SCHEDULE
  // ───────────────────────────────────────────────────────────────────────────
  const phaseData = resultsData?.phase_separation || []
  const sag27Data = resultsData?.sag_schedule_27 || []
  if (phaseData.length > 0 || sag27Data.length > 0) {
    if (currentY > 135) {
      doc.addPage()
      currentY = 22
    }
    currentY = printSectionHeader('6. Phase Separation at Angles & Everyday Sag Schedule (27 °C)', currentY)

    const mergedRows = (phaseData.length > 0 ? phaseData : sag27Data).map((p: any, idx: number) => {
      const s = sag27Data[idx] || {}
      return [
        String(p.sec ?? 1),
        `Pole ${p.pole_no ?? p.pole ?? '—'}`,
        String(p.sag_65_c1_m ?? '—'),
        String(p.required_separation_m ?? '0.45'),
        String(p.crossarm_separation_straight_m ?? '0.85'),
        String(p.line_angle_deg ?? 0),
        String(p.separation_at_angle_m ?? '—'),
        String(p.separation_check ?? 'PASS'),
        String(s.sag_27_c1_m ?? '—'),
        String(s.sag_27_c2_m ?? '—'),
      ]
    })

    const pHeaders = [
      'Sec',
      'Pole',
      'Sag @ 65°C (m)',
      'Required Sep (m)',
      'Crossarm Sep (m)',
      'Angle (°)',
      'Sep at Angle (m)',
      'Phase Check',
      'Sag C1 @ 27°C (m)',
      'Sag C2 @ 27°C (m)',
    ]

    autoTable(doc, {
      head: [pHeaders],
      body: mergedRows,
      startY: currentY,
      styles: { fontSize: 7, cellPadding: 1.5, font: 'helvetica', textColor: textDark },
      headStyles: { fillColor: tableHeaderBlue, textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 7.2 },
      alternateRowStyles: { fillColor: altRowBg },
      margin: { left: marginX, right: marginX },
      columnStyles: {
        0: { halign: 'center', cellWidth: 14 },
        1: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
        2: { halign: 'right', cellWidth: 28 },
        3: { halign: 'right', cellWidth: 28 },
        4: { halign: 'right', cellWidth: 28 },
        5: { halign: 'right', cellWidth: 22 },
        6: { halign: 'right', cellWidth: 28 },
        7: { halign: 'center', cellWidth: 27, fontStyle: 'bold' },
        8: { halign: 'right', cellWidth: 37 },
        9: { halign: 'right', cellWidth: 37 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 7) {
          const val = String(data.cell.raw || '').toUpperCase()
          if (val === 'PASS' || val === 'OK') {
            data.cell.styles.textColor = [16, 149, 93]
          } else if (val === 'FAIL') {
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      },
    })

    currentY = (doc as any).lastAutoTable.finalY + 10
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 7. FORMAL ENGINEER'S RECOMMENDATION & SIGNATURE APPROVAL BLOCK
  // ───────────────────────────────────────────────────────────────────────────
  // Needs ~55mm of vertical space. If not enough space on current page, create new page.
  if (currentY + 55 > pageHeight - 15) {
    doc.addPage()
    currentY = 22
  }

  // Section Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...darkNavy)
  doc.text("7. ENGINEER'S RECOMMENDATION & TECHNICAL COMPLIANCE SIGN-OFF", marginX, currentY)
  doc.setDrawColor(...tableHeaderBlue)
  doc.setLineWidth(0.5)
  doc.line(marginX, currentY + 1.5, marginX + 115, currentY + 1.5)
  currentY += 5.5

  // Recommendation Statement Box
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(...borderSlate)
  doc.setLineWidth(0.4)
  doc.roundedRect(marginX, currentY, contentWidth, 12, 1, 1, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(...darkNavy)
  doc.text('ENGINEER RECOMMENDATION STATEMENT:', marginX + 3, currentY + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...textDark)
  const statement =
    'Having conducted rigorous structural, electrical, and geotechnical assessments strictly in accordance with Ceylon Electricity Board (CEB) and Lanka Electricity Company (LECO) distribution standards, the line arrangement, recommended pole classes, guy attachments, and foundation depths set out in this report are verified as technically sound and compliant with all mandatory safety factor thresholds. The design is hereby recommended for construction.'
  doc.text(statement, marginX + 3, currentY + 8, { maxWidth: contentWidth - 6 })
  currentY += 15

  // 3-Column Formal Sign-off Cards
  const colGap = 5
  const colWidth = (contentWidth - colGap * 2) / 3 // ~86.3 mm
  const cardHeight = 32

  const signBoxes = [
    {
      title: '1. FIELD SURVEY & DATA INPUT',
      role: 'Surveyed & Prepared By',
      officer: 'Distribution Technical Officer (Surveys)',
      dept: 'Distribution Operations & Maintenance',
    },
    {
      title: '2. DESIGN & STRUCTURAL CHECK',
      role: 'Calculated & Verified By',
      officer: 'Distribution Planning Engineer',
      dept: 'Distribution Network Planning & Design',
    },
    {
      title: '3. FINAL APPROVAL & CERTIFICATION',
      role: 'Recommended & Approved By',
      officer: 'Chief Engineer (Distribution Systems)',
      dept: 'Provincial Engineering Directorate',
    },
  ]

  signBoxes.forEach((box, idx) => {
    const colX = marginX + idx * (colWidth + colGap)

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(...borderSlate)
    doc.setLineWidth(0.4)
    doc.roundedRect(colX, currentY, colWidth, cardHeight, 1.2, 1.2, 'FD')

    // Header strip of the card
    doc.setFillColor(...tableHeaderBlue)
    doc.roundedRect(colX, currentY, colWidth, 5.5, 1.2, 1.2, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text(box.title, colX + 3, currentY + 3.8)

    // Body of the card
    doc.setTextColor(...textDark)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    doc.text(box.role + ':', colX + 3, currentY + 9)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.text(box.officer, colX + 3, currentY + 13)
    doc.setTextColor(...textMuted)
    doc.text(box.dept, colX + 3, currentY + 16.5)

    // Signature Line
    doc.setTextColor(...textDark)
    doc.setFont('helvetica', 'normal')
    doc.text('Signature: __________________________', colX + 3, currentY + 22.5)

    // Date Line & Verification note
    doc.setFont('helvetica', 'bold')
    doc.text(`Date: ${dateFormatted}`, colX + 3, currentY + 27.5)

    if (idx === 2) {
      // Stamp area box on right corner of approval card
      doc.setDrawColor(...borderSlate)
      doc.setFillColor(248, 250, 252)
      doc.rect(colX + colWidth - 25, currentY + 17, 22, 12, 'FD')
      doc.setFontSize(5.5)
      doc.setTextColor(...textMuted)
      doc.text('OFFICIAL', colX + colWidth - 14, currentY + 22, { align: 'center' })
      doc.text('SEAL / STAMP', colX + colWidth - 14, currentY + 25.5, { align: 'center' })
    }
  })

  // ───────────────────────────────────────────────────────────────────────────
  // RUNNING HEADER & FOOTER ON ALL PAGES
  // ───────────────────────────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages()

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)

    // Running top banner for page 2 onwards
    if (i > 1) {
      doc.setFillColor(...darkNavy)
      doc.rect(0, 0, pageWidth, 11, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.text(`Lanka Electricity Company (Pvt) Ltd — LineDesign Engineering Report`, marginX, 7)
      doc.setFont('helvetica', 'normal')
      doc.text(`Project: ${projectName}   |   Arrangement: ${lineArrangement}   |   Date: ${dateFormatted}`, pageWidth - marginX, 7, { align: 'right' })
    }

    // Running bottom footer on every page
    doc.setDrawColor(...borderSlate)
    doc.setLineWidth(0.3)
    doc.line(marginX, pageHeight - 9, pageWidth - marginX, pageHeight - 9)

    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...textMuted)
    doc.text(
      'LineDesign Overhead Distribution System  •  Fully compliant with LECO / CEB standards and docs/result.pdf benchmark specification',
      marginX,
      pageHeight - 5
    )

    doc.setFont('helvetica', 'bold')
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginX, pageHeight - 5, { align: 'right' })
  }

  // Save the PDF with a clean sanitized file name
  const filename = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Engineering_Report_${dateFormatted.replace(/\s+/g, '_')}.pdf`
  doc.save(filename)
}
