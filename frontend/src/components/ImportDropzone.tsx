import React, { useState, useRef } from 'react'
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, Download, ArrowRight } from 'lucide-react'
import { PoleRow } from '../pages/RoutePolesPage'
import { parseSurveyExcel, downloadSurveyTemplate } from '../utils/excelSurvey'

interface SheetInfo {
  sheet_name: string
  rows_count: number
}

interface PreviewResult {
  filename: string
  total_sheets: number
  total_rows: number
  sheets: SheetInfo[]
  validation_status: 'VALID' | 'WARNING'
  errors: string[]
  note: string
}

interface ImportDropzoneProps {
  onPolesImported?: (poles: PoleRow[], filename: string) => void
  onClose?: () => void
}

export const ImportDropzone: React.FC<ImportDropzoneProps> = ({ onPolesImported, onClose }) => {
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [parsedPoles, setParsedPoles] = useState<PoleRow[] | null>(null)
  const [importedFilename, setImportedFilename] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (file: File) => {
    setLoading(true)
    setError(null)
    setPreview(null)
    setParsedPoles(null)
    setImportedFilename(file.name)

    try {
      // 1. Parse Excel data for poles grid directly
      const poles = await parseSurveyExcel(file)
      setParsedPoles(poles)

      // 2. Also query backend preview if available
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/results/import-preview', {
          method: 'POST',
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          setPreview(data)
        }
      } catch {
        // Backend preview is secondary; local client parsing succeeded
      }

      // If callback provided, auto-apply or let user click to apply
      if (onPolesImported) {
        onPolesImported(poles, file.name)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload and parse Excel file')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0])
    }
  }

  return (
    <div className="import-dropzone-container" style={{ marginBottom: '1.5rem' }}>
      <div
        className={`dropzone-box ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <UploadCloud size={40} className="dropzone-icon" />
        <p className="dropzone-main-text">
          Drag and drop Excel survey file here, or{' '}
          <span
            className="file-browse-label"
            style={{ textDecoration: 'underline', color: 'var(--primary)', fontWeight: 600 }}
          >
            browse device
          </span>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={onFileSelect}
          style={{ display: 'none' }}
        />
        <p className="dropzone-sub-text">Supports .xlsx, .xls, and .csv (Survey data & Route schedules)</p>
        {loading && <p className="text-loading">Parsing workbook structure and extracting poles...</p>}
      </div>

      {/* Action Bar inside Dropzone: Download Template & Close */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            downloadSurveyTemplate()
          }}
          className="btn-secondary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.825rem',
            height: '34px',
            padding: '0 0.85rem',
          }}
        >
          <Download size={14} />
          <span>Download Sample Survey Excel Template</span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', height: '34px', padding: '0 0.75rem' }}
          >
            Close
          </button>
        )}
      </div>

      {error && (
        <div className="alert-box alert-error" style={{ marginTop: '0.75rem' }}>
          <AlertTriangle size={16} /> <span>{error}</span>
        </div>
      )}

      {parsedPoles && (
        <div
          className="alert-box alert-success"
          style={{
            marginTop: '0.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} color="#059669" />
            <span style={{ fontSize: '0.875rem', color: '#065f46' }}>
              Successfully imported <strong>{parsedPoles.length} poles</strong> from{' '}
              <em>{importedFilename}</em> into the Route & Poles table!
            </span>
          </div>
          {onPolesImported && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => onPolesImported(parsedPoles, importedFilename)}
              style={{
                height: '32px',
                padding: '0 0.85rem',
                fontSize: '0.8rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <span>Apply to Grid</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}

      {preview && (
        <div className="preview-results-card" style={{ marginTop: '0.75rem' }}>
          <div className="preview-title-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={20} color="#2563eb" />
              <h4>{preview.filename}</h4>
            </div>
            <span
              className={`badge ${preview.validation_status === 'VALID' ? 'badge-success' : 'badge-warning'}`}
            >
              {preview.validation_status === 'VALID' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
              {preview.validation_status}
            </span>
          </div>

          <div className="preview-stats">
            <div>
              <strong>Total Sheets:</strong> {preview.total_sheets}
            </div>
            <div>
              <strong>Total Data Rows:</strong> {preview.total_rows}
            </div>
          </div>

          {preview.sheets && (
            <div className="preview-sheets-table">
              <h5>Sheets Detected in Workbook</h5>
              <table>
                <thead>
                  <tr>
                    <th>Sheet Name</th>
                    <th>Row Count</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.sheets.map((s, idx) => (
                    <tr key={idx}>
                      <td>{s.sheet_name}</td>
                      <td>{s.rows_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
