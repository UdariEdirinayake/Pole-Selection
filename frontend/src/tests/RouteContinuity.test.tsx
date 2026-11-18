import { describe, it, expect } from 'vitest'
import { validateRouteContinuity, PoleRow } from '../pages/RoutePolesPage'

describe('Route Continuity Validator', () => {
  it('passes when all consecutive spans match (fore span of pole n = aft span of pole n+1)', () => {
    const validPoles: PoleRow[] = [
      { pole_no: 1, section: 1, aft_span_m: 0, fore_span_m: 45, angle_deg: 0, soil_class: '3' },
      { pole_no: 2, section: 1, aft_span_m: 45, fore_span_m: 50, angle_deg: 5, soil_class: '3' },
      { pole_no: 3, section: 1, aft_span_m: 50, fore_span_m: 35, angle_deg: 0, soil_class: '3' },
      { pole_no: 4, section: 1, aft_span_m: 35, fore_span_m: 0, angle_deg: 0, soil_class: '3' },
    ]

    const result = validateRouteContinuity(validPoles)
    expect(result.valid).toBe(true)
    expect(result.brokenIndices).toHaveLength(0)
  })

  it('fails and identifies broken indices when fore span != next aft span', () => {
    const brokenPoles: PoleRow[] = [
      { pole_no: 1, section: 1, aft_span_m: 0, fore_span_m: 45, angle_deg: 0, soil_class: '3' },
      { pole_no: 2, section: 1, aft_span_m: 40, fore_span_m: 50, angle_deg: 5, soil_class: '3' }, // 45 != 40
      { pole_no: 3, section: 1, aft_span_m: 50, fore_span_m: 35, angle_deg: 0, soil_class: '3' },
    ]

    const result = validateRouteContinuity(brokenPoles)
    expect(result.valid).toBe(false)
    expect(result.brokenIndices).toContain(0) // Between pole 1 and pole 2
    expect(result.message).toContain('Pole 1 (fore: 45m) ➔ Pole 2 (aft: 40m)')
  })

  it('handles floating point tolerance correctly within 0.05m', () => {
    const closePoles: PoleRow[] = [
      { pole_no: 1, section: 1, aft_span_m: 0, fore_span_m: 30.01, angle_deg: 0, soil_class: '3' },
      { pole_no: 2, section: 1, aft_span_m: 30.02, fore_span_m: 0, angle_deg: 0, soil_class: '3' },
    ]

    const result = validateRouteContinuity(closePoles)
    expect(result.valid).toBe(true)
  })
})
