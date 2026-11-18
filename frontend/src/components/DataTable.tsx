import React, { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Search } from 'lucide-react'
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
  const [filterText, setFilterText] = useState('')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  // Filter across any string/number representation in the row
  const filteredData = data.filter((row) => {
    if (!filterText.trim()) return true
    const q = filterText.toLowerCase()
    return Object.values(row).some((val) => {
      if (val === null || val === undefined) return false
      return String(val).toLowerCase().includes(q)
    })
  })

  const sortedData = [...filteredData].sort((a, b) => {
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

  const hasGroups = columns.some((c) => !!c.group)

  // Build grouped structure for the top header row
  const groupHeaders: { title: string | null; colSpan: number; col?: Column<T> }[] = []
  if (hasGroups) {
    let currentGroup: string | null = null
    let currentSpan = 0

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      const grp = col.group || null
      if (grp === null) {
        if (currentGroup !== null) {
          groupHeaders.push({ title: currentGroup, colSpan: currentSpan })
          currentGroup = null
          currentSpan = 0
        }
        groupHeaders.push({ title: null, colSpan: 1, col })
      } else {
        if (currentGroup === grp) {
          currentSpan++
        } else {
          if (currentGroup !== null) {
            groupHeaders.push({ title: currentGroup, colSpan: currentSpan })
          }
          currentGroup = grp
          currentSpan = 1
        }
      }
    }
    if (currentGroup !== null) {
      groupHeaders.push({ title: currentGroup, colSpan: currentSpan })
    }
  }

  return (
    <div className="datatable-container">
      <div className="datatable-header">
        <div className="datatable-title-wrap">
          {title && <h3 className="datatable-title">{title}</h3>}
          <span className="datatable-count">
            {filteredData.length} {filteredData.length === 1 ? 'row' : 'rows'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '0.65rem',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search table..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{
                height: '32px',
                minHeight: '32px',
                padding: '0 0.65rem 0 2rem',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-main)',
                width: '160px',
              }}
            />
          </div>

          <button
            onClick={exportCSV}
            className="btn-export-csv"
            title="Export table as CSV"
          >
            <Download size={14} style={{ marginRight: '6px' }} /> Export CSV
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="datatable">
          <thead>
            {hasGroups ? (
              <>
                <tr>
                  {groupHeaders.map((gh, idx) => {
                    if (gh.title === null && gh.col) {
                      const isSorted = sortKey === gh.col.key
                      return (
                        <th
                          key={idx}
                          rowSpan={2}
                          onClick={() => handleSort(gh.col!.key as string)}
                          style={{ cursor: 'pointer', whiteSpace: 'nowrap', verticalAlign: 'middle' }}
                        >
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <span>{gh.col.header}</span>
                            {isSorted ? (
                              sortOrder === 'asc' ? (
                                <ArrowUp size={13} color="var(--primary)" />
                              ) : (
                                <ArrowDown size={13} color="var(--primary)" />
                              )
                            ) : (
                              <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                            )}
                          </div>
                        </th>
                      )
                    }
                    return (
                      <th
                        key={idx}
                        colSpan={gh.colSpan}
                        style={{
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          borderBottom: '1px solid var(--border-color)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          color: 'var(--text-secondary, #475569)',
                          backgroundColor: 'var(--bg-surface-elevated, #f8fafc)',
                          padding: '0.5rem 0.75rem',
                        }}
                      >
                        {gh.title}
                      </th>
                    )
                  })}
                </tr>
                <tr>
                  {columns
                    .filter((col) => !!col.group)
                    .map((col, idx) => {
                      const isSorted = sortKey === col.key
                      return (
                        <th
                          key={idx}
                          onClick={() => handleSort(col.key as string)}
                          style={{
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary, #475569)',
                            padding: '0.5rem 0.75rem',
                          }}
                        >
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <span>{col.header}</span>
                            {isSorted ? (
                              sortOrder === 'asc' ? (
                                <ArrowUp size={13} color="var(--primary)" />
                              ) : (
                                <ArrowDown size={13} color="var(--primary)" />
                              )
                            ) : (
                              <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                            )}
                          </div>
                        </th>
                      )
                    })}
                </tr>
              </>
            ) : (
              <tr>
                {columns.map((col, idx) => {
                  const isSorted = sortKey === col.key
                  return (
                    <th
                      key={idx}
                      onClick={() => handleSort(col.key as string)}
                      style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp size={13} color="var(--primary)" />
                          ) : (
                            <ArrowDown size={13} color="var(--primary)" />
                          )
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                        )}
                      </div>
                    </th>
                  )
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  {filterText ? 'No matching rows found for "' + filterText + '"' : 'No data available'}
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
