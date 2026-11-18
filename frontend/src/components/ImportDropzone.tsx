import React, { useState } from 'react'
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react'

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

export const ImportDropzone: React.FC = () => {
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File) => {
    setLoading(true)
    setError(null)
    setPreview(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/results/import-preview', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Upload failed')
      }
      const data = await res.json()
      setPreview(data)
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
    <div className="import-dropzone-container">
      <div
        className={`dropzone-box ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <UploadCloud size={40} className="dropzone-icon" />
        <p className="dropzone-main-text">
          Drag and drop Excel survey file here, or{' '}
          <label className="file-browse-label">
            browse
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={onFileSelect}
              style={{ display: 'none' }}
            />
          </label>
        </p>
        <p className="dropzone-sub-text">Supports .xlsx and .xls (Survey data & Route schedules)</p>
        {loading && <p className="text-loading">Parsing workbook structure (no calculations)...</p>}
      </div>

      {error && (
        <div className="alert-box alert-error">
          <AlertTriangle size={16} /> <span>{error}</span>
        </div>
      )}

      {preview && (
        <div className="preview-results-card">
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

          <p className="preview-note">{preview.note}</p>

          <div className="preview-stats">
            <div>
              <strong>Total Sheets:</strong> {preview.total_sheets}
            </div>
            <div>
              <strong>Total Data Rows:</strong> {preview.total_rows}
            </div>
          </div>

          {preview.errors.length > 0 && (
            <div className="preview-errors">
              <h5>Warnings & Gaps Detected:</h5>
              <ul>
                {preview.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="preview-sheets-table">
            <h5>Sheets Summary</h5>
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
        </div>
      )}
    </div>
  )
}
