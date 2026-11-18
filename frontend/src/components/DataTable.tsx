import React, { useState } from 'react'
import { ArrowUpDown, Download } from 'lucide-react'
import { StatusChip } from './StatusChip'

export interface Column<T> {
  key: keyof T | string
  header: string
  group?: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  title?: string
  csvFilename?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  title,
  csvFilename = 'data-export.csv',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0
    const valA = a[sortKey]
    const valB = b[sortKey]
    if (valA === valB) return 0
    if (valA === undefined || valA === null) return 1
    if (valB === undefined || valB === null) return -1
    const res = valA < valB ? -1 : 1
    return sortOrder === 'asc' ? res : -res
  })

  const exportCSV = () => {
    const headers = columns.map((c) => c.header).join(',')
    const rows = sortedData.map((row) =>
      columns
        .map((c) => {
          const val = row[c.key as string]
          return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : (val ?? '')
        })
        .join(',')
    )
    const csvContent = [headers, ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = csvFilename
    link.click()
  }

  const getRowHighlight = (row: T) => {
    const status = (row.status || '').toUpperCase()
    if (status === 'FAIL') return 'row-fail'
    if (status === 'CAUTION') return 'row-caution'
    if (status === 'NOT ASSESSED') return 'row-not-assessed'
    return ''
  }

  return (
    <div className="datatable-container">
      <div className="datatable-header">
        {title && <h3 className="datatable-title">{title}</h3>}
        <button
          onClick={exportCSV}
          className="btn-export-csv"
          title="Export table as CSV"
        >
          <Download size={14} style={{ marginRight: '6px' }} /> Export CSV
        </button>
      </div>

      <div className="datatable-scroll">
        <table className="datatable">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.key as string)}
                  style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {col.header}
                    <ArrowUpDown size={12} style={{ opacity: 0.6 }} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((row, rIdx) => (
                <tr key={rIdx} className={getRowHighlight(row)}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} style={{ whiteSpace: 'nowrap' }}>
                      {col.render ? (
                        col.render(row)
                      ) : col.key === 'status' ? (
                        <StatusChip status={row[col.key as string]} />
                      ) : (
                        row[col.key as string] ?? '-'
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
