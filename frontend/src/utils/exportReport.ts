/**
 * LineDesign – Engineering Report Export Utilities
 * Exports all result tables to multi-sheet Excel (.xlsx) or multi-section PDF.
 */
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── helpers ────────────────────────────────────────────────────────────────

function sheetFromArray(data: Record<string, any>[], title: string): XLSX.WorkSheet {
  if (!data || data.length === 0) {
    return XLSX.utils.aoa_to_sheet([[title], ['No data available']])
  }
  const headers = Object.keys(data[0])
  const rows = data.map((r) => headers.map((h) => r[h] ?? ''))
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Column widths
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 12) }))
  return ws
}

// ─── EXCEL EXPORT ────────────────────────────────────────────────────────────

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

// ─── PDF EXPORT ──────────────────────────────────────────────────────────────

function addTableToPDF(
  doc: jsPDF,
  title: string,
  data: Record<string, any>[],
  startY: number,
): number {
  if (!data || data.length === 0) return startY

  const headers = Object.keys(data[0])
  const rows = data.map((r) => headers.map((h) => String(r[h] ?? '—')))

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 14, startY)

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: startY + 4,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
  })

  return (doc as any).lastAutoTable.finalY + 10
}

export function exportToPDF(resultsData: any, projectName = 'LineDesign') {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const now = new Date().toLocaleString('en-GB')

  // ── Cover header ──
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, pageWidth, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('LineDesign – Engineering Report', 14, 10)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Project: ${projectName}   |   Generated: ${now}   |   Lanka Electricity Company (Pvt) Ltd`, 14, 17)
  doc.setTextColor(0, 0, 0)

  let y = 30

  const sections: Array<{ title: string; key: string }> = [
    { title: '1. Pole Selection Summary', key: 'pole_summary' },
    { title: '2. Conductor Tension Checks', key: 'conductor_tension_check' },
    { title: '3. Structural Loading', key: 'structural_loading' },
    { title: '4. Foundation & Soil Bearing', key: 'foundation_soil_bearing' },
    { title: '5. Ground Clearance Profile', key: 'ground_clearance' },
    { title: '6. Phase Separation', key: 'phase_separation' },
    { title: '7. Sag Schedule (27 °C Everyday)', key: 'sag_schedule_27' },
    { title: '8. Design Parameters', key: 'design_parameters' },
  ]

  for (const { title, key } of sections) {
    const data = resultsData?.[key] || []
    if (!data || data.length === 0) continue
    if (y > 170) {
      doc.addPage()
      y = 15
    }
    y = addTableToPDF(doc, title, data, y)
  }

  // Page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, doc.internal.pageSize.getHeight() - 5)
  }

  const filename = `${projectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_engineering_report.pdf`
  doc.save(filename)
}
