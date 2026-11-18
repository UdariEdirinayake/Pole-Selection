import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusChip } from '../components/StatusChip'

describe('StatusChip Component', () => {
  it('renders PASS status with text and appropriate styling', () => {
    render(<StatusChip status="PASS" />)
    const chip = screen.getByTestId('status-chip')
    expect(chip).toHaveTextContent('PASS')
    // Greenish background for PASS
    expect(chip.style.backgroundColor).toBe('rgb(222, 247, 236)')
  })

  it('renders FAIL status with text and appropriate styling', () => {
    render(<StatusChip status="FAIL" />)
    const chip = screen.getByTestId('status-chip')
    expect(chip).toHaveTextContent('FAIL')
    // Reddish background for FAIL
    expect(chip.style.backgroundColor).toBe('rgb(253, 232, 232)')
  })

  it('renders CAUTION / WARNING status with text and appropriate styling', () => {
    render(<StatusChip status="CAUTION" />)
    const chip = screen.getByTestId('status-chip')
    expect(chip).toHaveTextContent('CAUTION')
    // Yellowish background for CAUTION
    expect(chip.style.backgroundColor).toBe('rgb(254, 240, 138)')
  })

  it('renders PENDING status with text and styling for missing PDF fields', () => {
    render(<StatusChip status="PENDING" label="Pending" />)
    const chip = screen.getByTestId('status-chip')
    expect(chip).toHaveTextContent('Pending')
    // Bluish background for PENDING
    expect(chip.style.backgroundColor).toBe('rgb(225, 239, 254)')
  })

  it('defaults to NOT ASSESSED when status is null or empty', () => {
    render(<StatusChip status="" />)
    const chip = screen.getByTestId('status-chip')
    expect(chip).toHaveTextContent('NOT ASSESSED')
  })
})
