import * as XLSX from 'xlsx'
import { PoleRow } from '../pages/RoutePolesPage'

export function downloadSurveyTemplate(filename = 'Route_Survey_Template.xlsx') {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Route Survey Data
  const headers = [
    'Section',
    'Pole No',
    'Aft Span (m)',
    'Fore Span (m)',
    'Deviation Angle (deg)',
    'Equipment',
    'Soil Class (1-5)',
  ]

  const sampleRows = [
    [1, 1, 0, 29, 0, 'None', 4],
    [1, 2, 29, 34, 14, 'None', 4],
    [1, 3, 34, 29, 4, 'None', 4],
    [1, 4, 29, 33, 4, 'TF - 160kVA', 4],
    [1, 5, 33, 31, 2, 'None', 4],
    [1, 6, 31, 38, 5, 'None', 4],
    [2, 7, 38, 37, 40, 'None', 4],
    [2, 8, 37, 30, 4, 'None', 4],
    [2, 9, 30, 24, 15, 'None', 4],
    [2, 10, 24, 35, 8, 'None', 4],
    [2, 11, 35, 23, 2, 'None', 4],
    [2, 12, 23, 25, 5, 'None', 4],
    [2, 13, 25, 0, 0, 'None', 4],
  ]

  const wsSurvey = XLSX.utils.aoa_to_sheet([headers, ...sampleRows])

  // Set column widths
  wsSurvey['!cols'] = [
    { wch: 10 }, // Section
    { wch: 10 }, // Pole No
    { wch: 15 }, // Aft Span
    { wch: 15 }, // Fore Span
    { wch: 22 }, // Deviation Angle
    { wch: 18 }, // Equipment
    { wch: 18 }, // Soil Class
  ]

  XLSX.utils.book_append_sheet(wb, wsSurvey, 'Route Survey')

  // Sheet 2: Equipment & Soil Reference Guide
  const guidanceHeaders = ['Parameter', 'Allowed Values / Format', 'Description / Weight']
  const guidanceRows = [
    ['Equipment', 'None', 'Standard pole with no mounted equipment'],
    ['Equipment', 'TF - 50kVA', '50 kVA Distribution Transformer (415 kg)'],
    ['Equipment', 'TF - 100kVA', '100 kVA Distribution Transformer (580 kg)'],
    ['Equipment', 'TF - 160kVA', '160 kVA Distribution Transformer (750 kg)'],
    ['Equipment', 'TF - 250kVA', '250 kVA Distribution Transformer (900 kg)'],
    ['Equipment', 'TF - 400kVA', '400 kVA Distribution Transformer (1310 kg)'],
    ['Equipment', 'TF - 630kVA', '630 kVA Distribution Transformer (1950 kg)'],
    ['Equipment', 'LBS', 'Load Break Switch (100 kg)'],
    ['Equipment', 'AR', 'Auto Recloser (100 kg)'],
    ['Soil Class', '1', 'Soft clay / silt'],
    ['Soil Class', '2', 'Firm clay'],
    ['Soil Class', '3', 'Stiff clay'],
    ['Soil Class', '4', 'Very stiff clay / dense sand (Default)'],
    ['Soil Class', '5', 'Hard clay / rock'],
    ['Continuity Rule', 'Fore(n) = Aft(n+1)', 'The fore span of pole n must equal the aft span of pole n+1'],
  ]

  const wsGuidance = XLSX.utils.aoa_to_sheet([guidanceHeaders, ...guidanceRows])
  wsGuidance['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 55 }]
  XLSX.utils.book_append_sheet(wb, wsGuidance, 'Equipment & Guidance')

  XLSX.writeFile(wb, filename)
}

export async function parseSurveyExcel(file: File): Promise<PoleRow[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('The selected Excel workbook contains no sheets.')
  }

  // Find preferred sheet: 'Route Survey', 'Survey', 'Poles', or first sheet
  const targetSheetName =
    wb.SheetNames.find((name) =>
      /survey|route|pole/i.test(name.trim()) && !/guidance|instruction/i.test(name.trim())
    ) || wb.SheetNames[0]

  const ws = wb.Sheets[targetSheetName]
  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  if (!rawRows || rawRows.length === 0) {
    throw new Error(`Sheet "${targetSheetName}" is empty.`)
  }

  // Find header row index
  let headerIdx = -1
  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const rowStr = rawRows[i].map((c) => String(c).toLowerCase()).join(' ')
    if (rowStr.includes('pole') || (rowStr.includes('span') && rowStr.includes('angle'))) {
      headerIdx = i
      break
    }
  }

  if (headerIdx === -1) {
    throw new Error(
      'Could not detect survey table headers. Expected columns: Section, Pole No, Aft Span, Fore Span, Deviation Angle, Equipment, Soil Class.'
    )
  }

  const headerRow = rawRows[headerIdx].map((c) => String(c).trim().toLowerCase())

  // Locate column indices
  const getCol = (patterns: RegExp[]): number => {
    return headerRow.findIndex((h) => patterns.some((p) => p.test(h)))
  }

  const colSec = getCol([/^sec/i, /section/i])
  const colPole = getCol([/^pole/i, /pole\s*no/i, /pole\s*#/i])
  const colAft = getCol([/aft/i, /back/i, /after/i, /prev.*span/i])
  const colFore = getCol([/fore/i, /ahead/i, /forward/i, /next.*span/i])
  const colAngle = getCol([/angle/i, /deg/i, /dev/i])
  const colEquip = getCol([/equip/i, /tf/i, /transformer/i])
  const colSoil = getCol([/soil/i, /geotech/i, /ground/i])

  const parsedPoles: PoleRow[] = []

  for (let r = headerIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r]
    if (!row || row.every((c) => c === '' || c == null)) continue

    const poleRaw = colPole !== -1 ? row[colPole] : parsedPoles.length + 1
    const poleNo = parseInt(String(poleRaw).replace(/[^0-9]/g, ''), 10)
    if (isNaN(poleNo) || poleNo <= 0) continue

    const secRaw = colSec !== -1 ? parseInt(String(row[colSec]).replace(/[^0-9]/g, ''), 10) : 1
    const section = isNaN(secRaw) || secRaw <= 0 ? (parsedPoles.length > 0 ? parsedPoles[parsedPoles.length - 1].section : 1) : secRaw

    const parseNum = (col: number, def = 0): number => {
      if (col === -1) return def
      const val = parseFloat(String(row[col]))
      return isNaN(val) ? def : val
    }

    const aft = parseNum(colAft, parsedPoles.length > 0 ? parsedPoles[parsedPoles.length - 1].fore_span_m : 0)
    const fore = parseNum(colFore, 0)
    const angle = parseNum(colAngle, 0)

    let equip = 'None'
    if (colEquip !== -1 && row[colEquip]) {
      const eqRaw = String(row[colEquip]).trim()
      if (eqRaw && !['none', '—', '-', 'null', '0'].includes(eqRaw.toLowerCase())) {
        equip = eqRaw
      }
    }

    let soil = '4'
    if (colSoil !== -1 && row[colSoil]) {
      const sRaw = String(row[colSoil]).replace(/[^0-9]/g, '')
      if (['1', '2', '3', '4', '5'].includes(sRaw)) {
        soil = sRaw
      }
    }

    parsedPoles.push({
      pole_no: poleNo,
      section: section,
      aft_span_m: aft,
      fore_span_m: fore,
      angle_deg: angle,
      equipment: equip,
      soil_class: soil,
    })
  }

  if (parsedPoles.length === 0) {
    throw new Error('No valid pole rows found in the survey sheet.')
  }

  // Sort by pole_no
  parsedPoles.sort((a, b) => a.pole_no - b.pole_no)
  return parsedPoles
}
