import React, { useState, useEffect } from 'react'
import {
  Database,
  Search,
  Edit2,
  Check,
  X,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'

interface TableMeta {
  id: string
  label: string
  category: string
  description: string
  editableFields: { key: string; label: string; type: 'number' | 'text' | 'boolean' }[]
}

const MASTER_TABLES: TableMeta[] = [
  {
    id: 'conductors',
    label: 'Conductors & Cables',
    category: 'Conductor Specifications',
    description: 'Conductor sizes, ultimate tensile strength, weights, and thermal coefficients.',
    editableFields: [
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'diameter_mm', label: 'Diameter (mm)', type: 'number' },
      { key: 'weight_kg_per_m', label: 'Weight (kg/m)', type: 'number' },
      { key: 'ultimate_tensile_strength_kn', label: 'UTS (kN)', type: 'number' },
      { key: 'modulus_elasticity_kg_per_mm2', label: 'Elastic Modulus (kg/mm²)', type: 'number' },
      { key: 'thermal_expansion_coeff_per_c', label: 'Thermal Coeff (/°C)', type: 'number' },
      { key: 'lookup_table', label: 'Sag-Tension Table ID', type: 'text' },
    ],
  },
  {
    id: 'span-tension-points',
    label: 'Sag-Tension Chart Lookup Points',
    category: 'Conductor Specifications',
    description: 'Calibration points for ruling span interpolation: tensions and sags across 15°C+wind, 27°C, and 65°C.',
    editableFields: [
      { key: 'span_m', label: 'Span (m)', type: 'number' },
      { key: 'tension_kn', label: 'Tension 15°C+Wind (kN)', type: 'number' },
      { key: 'tension_27_kn', label: 'Tension 27°C (kN)', type: 'number' },
      { key: 'sag_15_m', label: 'Sag 15°C (m)', type: 'number' },
      { key: 'sag_27_m', label: 'Sag 27°C (m)', type: 'number' },
      { key: 'sag_65_m', label: 'Sag 65°C (m)', type: 'number' },
    ],
  },
  {
    id: 'pole-capacities',
    label: 'Pole Structural Capacities',
    category: 'Structural Library',
    description: 'Catalog ratings: allowable transverse working loads (daN), Euler buckling capacities, and footprints.',
    editableFields: [
      { key: 'height_m', label: 'Height (m)', type: 'number' },
      { key: 'class_label', label: 'Class / Rating', type: 'text' },
      { key: 'capacity_dan', label: 'Transverse Rating (daN)', type: 'number' },
      { key: 'critical_buckling_kn', label: 'Critical Buckling (kN)', type: 'number' },
      { key: 'weight_kg', label: 'Pole Mass (kg)', type: 'number' },
      { key: 'footprint_mm', label: 'Footprint (e.g. 500x300)', type: 'text' },
    ],
  },
  {
    id: 'guy-wires',
    label: 'Guy Wire / Stay Ratings',
    category: 'Structural Library',
    description: 'Allowable working load capacity for light, heavy, and strut arrangements.',
    editableFields: [
      { key: 'code', label: 'Stay Code / Class', type: 'text' },
      { key: 'working_load_dan', label: 'Working Load (daN)', type: 'number' },
    ],
  },
  {
    id: 'soil-classes',
    label: 'Geotechnical Soil Classes',
    category: 'Geotechnical',
    description: 'Subgrade reaction modulus (kN/m³) and allowable bearing capacities (kN/m²) per soil classification.',
    editableFields: [
      { key: 'soil_class_num', label: 'Soil Class Number', type: 'number' },
      { key: 'subgrade_kn_per_m3', label: 'Subgrade Modulus (kN/m³)', type: 'number' },
      { key: 'bearing_min_kn_per_m2', label: 'Bearing Min (kN/m²)', type: 'number' },
      { key: 'bearing_max_kn_per_m2', label: 'Bearing Max (kN/m²)', type: 'number' },
    ],
  },
  {
    id: 'insulators',
    label: 'Insulators & Cantilever Strengths',
    category: 'Fittings & Clearances',
    description: 'Insulator ratings: nominal height, cantilever pin strength (kN), and tie angle limits.',
    editableFields: [
      { key: 'description', label: 'Description', type: 'text' },
      { key: 'voltage_level_kv', label: 'Voltage Level (kV)', type: 'number' },
      { key: 'nominal_height_m', label: 'Nominal Height (m)', type: 'number' },
      { key: 'cantilever_strength_kn', label: 'Cantilever Pin Strength (kN)', type: 'number' },
    ],
  },
  {
    id: 'ground-clearances',
    label: 'Statutory Ground Clearances',
    category: 'Fittings & Clearances',
    description: 'Minimum required conductor height above ground across road environments (5.5m across, 5.2m along, 4.6m open).',
    editableFields: [
      { key: 'voltage_band', label: 'Voltage Band', type: 'text' },
      { key: 'environment', label: 'Environment', type: 'text' },
      { key: 'min_clearance_m', label: 'Min Required Clearance (m)', type: 'number' },
    ],
  },
  {
    id: 'design-parameters',
    label: 'Governing Design Parameters',
    category: 'Engineering Standards',
    description: 'Global constants: conductor wind pressure (575 N/m²), pole wind pressure (865 N/m²), and guy angle.',
    editableFields: [
      { key: 'parameter_name', label: 'Parameter Name', type: 'text' },
      { key: 'value', label: 'Value', type: 'number' },
      { key: 'unit', label: 'Unit', type: 'text' },
      { key: 'source_note', label: 'Engineering Citation / Authority', type: 'text' },
    ],
  },
]

export const ConstructionDataPage: React.FC = () => {
  const [selectedTableId, setSelectedTableId] = useState<string>('conductors')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [editingRow, setEditingRow] = useState<any | null>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const activeTableMeta = MASTER_TABLES.find((t) => t.id === selectedTableId) || MASTER_TABLES[0]

  const loadTableData = async (tableId: string) => {
    setLoading(true)
    setSaveSuccess(null)
    setSaveError(null)
    setEditingRow(null)
    try {
      const res = await fetch(`/api/master/${tableId}?limit=300`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      } else {
        setItems([])
      }
    } catch (e) {
      console.error('Failed to load master table:', e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTableData(selectedTableId)
  }, [selectedTableId])

  const handleEditClick = (row: any) => {
    setEditingRow({ ...row })
    setSaveSuccess(null)
    setSaveError(null)
  }

  const handleFieldChange = (key: string, val: any) => {
    if (!editingRow) return
    setEditingRow({
      ...editingRow,
      [key]: val,
    })
  }

  const handleSave = async () => {
    if (!editingRow || !editingRow.id) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(null)

    try {
      const res = await fetch(`/api/master/${selectedTableId}/${editingRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRow),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Save failed with status ${res.status}`)
      }

      setSaveSuccess(`Successfully updated row ID ${editingRow.id}.`)
      await loadTableData(selectedTableId)
      setEditingRow(null)
    } catch (e: any) {
      console.error('Save error:', e)
      setSaveError(e.message || 'Failed to update record.')
    } finally {
      setSaving(false)
    }
  }

  // Filter items by search term
  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    return Object.values(item).some((val) => String(val).toLowerCase().includes(term))
  })

  // Group tables by category for the sidebar pill list
  const categories = Array.from(new Set(MASTER_TABLES.map((t) => t.category)))

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h2>Construction Data Library</h2>
          <p className="page-subtitle">
            Inspect, audit, and calibrate the active engineering catalogs, structural ratings, and sag-tension tables used by the calculation engine.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadTableData(selectedTableId)}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh Table</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="alert-box alert-success" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="alert-box alert-error" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle size={18} />
          <span>{saveError}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Table Selector Sidebar */}
        <div className="card" style={{ padding: '0.75rem' }}>
          <div style={{ padding: '0.5rem 0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Master Catalogs
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categories.map((cat) => (
              <div key={cat}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.2rem 0.5rem', textTransform: 'uppercase' }}>
                  {cat}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {MASTER_TABLES.filter((t) => t.category === cat).map((table) => {
                    const isSelected = table.id === selectedTableId
                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => setSelectedTableId(table.id)}
                        style={{
                          textAlign: 'left',
                          padding: '0.55rem 0.75rem',
                          borderRadius: '6px',
                          border: isSelected ? '1px solid var(--primary-border)' : '1px solid transparent',
                          backgroundColor: isSelected ? 'var(--primary-subtle)' : 'transparent',
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Database size={14} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} />
                        <span>{table.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Data View Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Active Catalog Description Bar */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 700 }}>
                  {activeTableMeta.label}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {activeTableMeta.description}
                </p>
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter table rows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem 0.45rem 2rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--bg-main)',
                    color: 'var(--text-main)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Edit Modal / Drawer if a row is selected for editing */}
          {editingRow && (
            <div className="card" style={{ border: '2px solid var(--primary)', padding: '1.25rem', backgroundColor: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                  <Edit2 size={16} color="var(--primary)" />
                  <span>Edit Record (ID: {editingRow.id})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                {activeTableMeta.editableFields.map((field) => (
                  <div key={field.key}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      step={field.type === 'number' ? 'any' : undefined}
                      value={editingRow[field.key] ?? ''}
                      onChange={(e) => {
                        const v = field.type === 'number' ? (e.target.value === '' ? '' : parseFloat(e.target.value)) : e.target.value
                        handleFieldChange(field.key, v)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.45rem 0.65rem',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-main)',
                        color: 'var(--text-main)',
                        fontSize: '0.85rem',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingRow(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Check size={16} />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Records Table */}
          <div className="card">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Loading construction catalog data...
              </div>
            ) : filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No records found matching current query.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>ID</th>
                      {activeTableMeta.editableFields.map((f) => (
                        <th key={f.key}>{f.label}</th>
                      ))}
                      <th style={{ width: '80px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.id}</td>
                        {activeTableMeta.editableFields.map((f) => {
                          const val = row[f.key]
                          return (
                            <td key={f.key} style={{ whiteSpace: 'nowrap' }}>
                              {val != null ? String(val) : '—'}
                            </td>
                          )
                        })}
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => handleEditClick(row)}
                            style={{
                              padding: '0.2rem 0.5rem',
                              fontSize: '0.75rem',
                              height: '26px',
                              minHeight: '26px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
