import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { DataTable, Column } from '../components/DataTable'

interface TestRow {
  id: number
  name: string
  span: number
  status: string
}

describe('DataTable Component', () => {
  const columns: Column<TestRow>[] = [
    { key: 'name', header: 'Pole Name' },
    { key: 'span', header: 'Span (m)' },
    { key: 'status', header: 'Status' },
  ]

  const mockData: TestRow[] = [
    { id: 1, name: 'Pole 3', span: 50, status: 'PASS' },
    { id: 2, name: 'Pole 1', span: 30, status: 'CAUTION' },
    { id: 3, name: 'Pole 2', span: 40, status: 'FAIL' },
  ]

  it('renders table headers and rows correctly', () => {
    render(<DataTable columns={columns} data={mockData} title="Test Table" />)

    expect(screen.getByText('Test Table')).toBeInTheDocument()
    expect(screen.getByText('Pole Name')).toBeInTheDocument()
    expect(screen.getByText('Span (m)')).toBeInTheDocument()
    expect(screen.getByText('Pole 3')).toBeInTheDocument()
    expect(screen.getByText('Pole 1')).toBeInTheDocument()
    expect(screen.getByText('Pole 2')).toBeInTheDocument()
  })

  it('sorts columns ascending and descending when header is clicked', () => {
    render(<DataTable columns={columns} data={mockData} />)

    const spanHeader = screen.getByText('Span (m)')

    // Click once -> Sort ascending by span (30, 40, 50)
    fireEvent.click(spanHeader)
    let rows = screen.getAllByRole('row')
    // row 0 is header, row 1 should be Pole 1 (span 30)
    expect(rows[1]).toHaveTextContent('Pole 1')
    expect(rows[2]).toHaveTextContent('Pole 2')
    expect(rows[3]).toHaveTextContent('Pole 3')

    // Click again -> Sort descending by span (50, 40, 30)
    fireEvent.click(spanHeader)
    rows = screen.getAllByRole('row')
    expect(rows[1]).toHaveTextContent('Pole 3')
    expect(rows[2]).toHaveTextContent('Pole 2')
    expect(rows[3]).toHaveTextContent('Pole 1')
  })

  it('triggers CSV download with formatted data', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/mock-url')
    window.URL.createObjectURL = createObjectURLMock

    render(<DataTable columns={columns} data={mockData} csvFilename="test-export.csv" />)

    const exportBtn = screen.getByRole('button', { name: /Export CSV/i })
    fireEvent.click(exportBtn)

    expect(createObjectURLMock).toHaveBeenCalled()
  })
})
