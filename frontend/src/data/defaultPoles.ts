export interface PoleDefaultData {
  pole_no: number
  section: number
  aft_span_m: number
  fore_span_m: number
  angle_deg: number
  equipment: string
  soil_class: string
}

export const DEFAULT_LINE_POLES: PoleDefaultData[] = [
  { pole_no: 1, section: 1, aft_span_m: 0, fore_span_m: 29, angle_deg: 0, equipment: 'None', soil_class: '4' },
  { pole_no: 2, section: 1, aft_span_m: 29, fore_span_m: 34, angle_deg: 14, equipment: 'None', soil_class: '4' },
  { pole_no: 3, section: 1, aft_span_m: 34, fore_span_m: 29, angle_deg: 4, equipment: 'None', soil_class: '4' },
  { pole_no: 4, section: 1, aft_span_m: 29, fore_span_m: 33, angle_deg: 4, equipment: 'TF - 160kVA', soil_class: '4' },
  { pole_no: 5, section: 1, aft_span_m: 33, fore_span_m: 31, angle_deg: 2, equipment: 'None', soil_class: '4' },
  { pole_no: 6, section: 1, aft_span_m: 31, fore_span_m: 38, angle_deg: 5, equipment: 'None', soil_class: '4' },
  { pole_no: 7, section: 2, aft_span_m: 38, fore_span_m: 37, angle_deg: 40, equipment: 'None', soil_class: '4' },
  { pole_no: 8, section: 2, aft_span_m: 37, fore_span_m: 30, angle_deg: 4, equipment: 'None', soil_class: '4' },
  { pole_no: 9, section: 2, aft_span_m: 30, fore_span_m: 24, angle_deg: 15, equipment: 'None', soil_class: '4' },
  { pole_no: 10, section: 2, aft_span_m: 24, fore_span_m: 35, angle_deg: 8, equipment: 'None', soil_class: '4' },
  { pole_no: 11, section: 2, aft_span_m: 35, fore_span_m: 23, angle_deg: 2, equipment: 'None', soil_class: '4' },
  { pole_no: 12, section: 2, aft_span_m: 23, fore_span_m: 25, angle_deg: 5, equipment: 'None', soil_class: '4' },
  { pole_no: 13, section: 2, aft_span_m: 25, fore_span_m: 0, angle_deg: 0, equipment: 'None', soil_class: '4' },
]
