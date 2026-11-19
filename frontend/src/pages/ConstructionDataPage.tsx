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
  Table as TableIcon,
} from 'lucide-react'

export interface TableMeta {
  id: string
  label: string
  fullName: string
  category: string
  description: string
  spanTensionTableId?: string
  editableFields: { key: string; label: string; type: 'number' | 'text' | 'boolean' }[]
}

const SPAN_TENSION_FIELDS = [
  { key: 'span_m', label: 'Span Length (m)', type: 'number' as const },
  { key: 'tension_kn', label: 'Max Tension @ 15°C + Wind (kN)', type: 'number' as const },
  { key: 'tension_27_kn', label: 'Everyday Tension @ 27°C (kN)', type: 'number' as const },
  { key: 'sag_15_m', label: 'Sag @ 15°C (m)', type: 'number' as const },
  { key: 'sag_27_m', label: 'Sag @ 27°C Everyday (m)', type: 'number' as const },
  { key: 'sag_65_m', label: 'Max Sag @ 65°C Operating (m)', type: 'number' as const },
]

export const MASTER_TABLES: TableMeta[] = [
  // 1. CONDUCTORS
  {
    id: 'conductors',
    label: 'Conductor Master Specifications',
    fullName: 'Conductors & Overhead Cables Library',
    category: 'Conductor Specifications',
    description: 'Catalog sizes, breaking loads, ultimate tensile strengths, weights, and lookup table mappings.',
    editableFields: [
      { key: 'description', label: 'Conductor Description', type: 'text' },
      { key: 'diameter_mm', label: 'Diameter (mm)', type: 'number' },
      { key: 'weight_kg_per_m', label: 'Weight (kg/m)', type: 'number' },
      { key: 'ultimate_tensile_strength_kn', label: 'UTS (kN)', type: 'number' },
      { key: 'modulus_elasticity_kg_per_mm2', label: 'Modulus of Elasticity (kg/mm²)', type: 'number' },
      { key: 'thermal_expansion_coeff_per_c', label: 'Thermal Expansion Coeff (/°C)', type: 'number' },
      { key: 'lookup_table', label: 'Mapped Sag-Tension Table ID', type: 'text' },
    ],
  },

  // 2. SEPARATE SPAN-TENSION TABLES WITH DESCRIPTIVE FULL NAMES
  {
    id: 'span-tension-uq',
    label: '70+16+N50 Bundled (LV with Streetlight)',
    fullName: 'Sag-Tension Chart: 70+16+N50 mm² Bundled Conductor (LV + Streetlight)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UQ',
    description: '12 calibrated span points (10 m to 65 m) for 70+16+N50 bundled aerial cable.',
    editableFields: SPAN_TENSION_FIELDS,
  },
  {
    id: 'span-tension-up',
    label: '70+N50 Bundled (LV Standard)',
    fullName: 'Sag-Tension Chart: 70+N50 mm² Bundled Conductor (LV Standard)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UP',
    description: '12 calibrated span points (10 m to 65 m) for 70+N50 bundled aerial cable.',
    editableFields: SPAN_TENSION_FIELDS,
  },
  {
    id: 'span-tension-ur',
    label: '50+N35 Bundled (LV Light)',
    fullName: 'Sag-Tension Chart: 50+N35 mm² Bundled Conductor (LV Light)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UR',
    description: '12 calibrated span points (10 m to 65 m) for 50+N35 bundled aerial cable.',
    editableFields: SPAN_TENSION_FIELDS,
  },
  {
    id: 'span-tension-ua-790',
    label: '60 mm² AAC @ 7.9 N/mm² (with LV)',
    fullName: 'Sag-Tension Chart: 60 mm² AAC Conductor @ 7.9 N/mm² Everyday Stress (with LV)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UA-7.90',
    description: '12 calibrated span points (10 m to 65 m) for 60 mm² all-aluminum conductor with LV underbuilt.',
    editableFields: SPAN_TENSION_FIELDS,
  },
  {
    id: 'span-tension-ub-790',
    label: '100 mm² AAC @ 7.9 N/mm² (with LV)',
    fullName: 'Sag-Tension Chart: 100 mm² AAC Conductor @ 7.9 N/mm² Everyday Stress (with LV)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UB-7.90',
    description: '12 calibrated span points (10 m to 65 m) for 100 mm² all-aluminum conductor with LV underbuilt.',
    editableFields: SPAN_TENSION_FIELDS,
  },
  {
    id: 'span-tension-uc-790',
    label: '150 mm² AAC @ 7.9 N/mm² (with LV)',
    fullName: 'Sag-Tension Chart: 150 mm² AAC Conductor @ 7.9 N/mm² Everyday Stress (with LV)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UC-7.90',
    description: '12 calibrated span points (10 m to 65 m) for 150 mm² all-aluminum conductor with LV underbuilt.',
    editableFields: SPAN_TENSION_FIELDS,
  },
  {
    id: 'span-tension-uc-223',
    label: '150 mm² AAC @ 22.3 N/mm²',
    fullName: 'Sag-Tension Chart: 150 mm² AAC Conductor @ 22.3 N/mm² Everyday Stress (Standalone)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UC-22.3',
    description: '17 calibrated span points (40 m to 120 m) for 150 mm² all-aluminum conductor.',
    editableFields: SPAN_TENSION_FIELDS,
  },
  {
    id: 'span-tension-ud-274',
    label: '175 mm² ACSR @ 2.744 kN EDT (with LV)',
    fullName: 'Sag-Tension Chart: 175 mm² ACSR Conductor @ 2.744 kN Everyday Tension (with LV)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UD-2.74',
    description: '12 calibrated span points (10 m to 65 m) for 175 mm² aluminum conductor steel reinforced with LV underbuilt.',
    editableFields: SPAN_TENSION_FIELDS,
  },
  {
    id: 'span-tension-ud-785',
    label: '175 mm² ACSR @ 7.857 kN EDT',
    fullName: 'Sag-Tension Chart: 175 mm² ACSR Conductor @ 7.857 kN Everyday Tension (Standalone)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UD-7.85',
    description: '17 calibrated span points (40 m to 120 m) for 175 mm² ACSR conductor.',
    editableFields: SPAN_TENSION_FIELDS,
  },
  {
    id: 'span-tension-ue-790',
    label: '250 mm² AAC @ 7.9 N/mm² (with LV)',
    fullName: 'Sag-Tension Chart: 250 mm² AAC Conductor @ 7.9 N/mm² Everyday Stress (with LV)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UE-7.90',
    description: '12 calibrated span points (10 m to 65 m) for 250 mm² all-aluminum conductor with LV underbuilt.',
    editableFields: SPAN_TENSION_FIELDS,
  },
  {
    id: 'span-tension-ue-223',
    label: '250 mm² AAC @ 22.3 N/mm²',
    fullName: 'Sag-Tension Chart: 250 mm² AAC Conductor @ 22.3 N/mm² Everyday Stress (Standalone)',
    category: 'Sag-Tension Calibration Charts',
    spanTensionTableId: 'UE-22.3',
    description: '17 calibrated span points (40 m to 120 m) for 250 mm² all-aluminum conductor.',
    editableFields: SPAN_TENSION_FIELDS,
  },

  // 3. STRUCTURAL, FOUNDATION & CLEARANCES
  {
    id: 'pole-capacities',
    label: 'Pole Structural Ratings & Dimensions',
    fullName: 'Prestressed Concrete Pole Catalog & Critical Buckling Strengths',
    category: 'Structural Library',
    description: 'Allowable transverse working loads (daN), Euler buckling capacities, weights, and below-ground dimensions.',
    editableFields: [
      { key: 'height_m', label: 'Pole Height (m)', type: 'number' },
      { key: 'class_label', label: 'Class / Rating Label', type: 'text' },
      { key: 'capacity_dan', label: 'Transverse Working Rating (daN)', type: 'number' },
      { key: 'critical_buckling_kn', label: 'Critical Buckling Strength (kN)', type: 'number' },
      { key: 'weight_kg', label: 'Pole Mass (kg)', type: 'number' },
      { key: 'footprint_mm', label: 'Base Footprint (e.g. 500x300)', type: 'text' },
      { key: 'below_gl_breadth_m', label: 'Below-GL Breadth (m)', type: 'number' },
    ],
  },
  {
    id: 'guy-wires',
    label: 'Guy Wire / Stay Ratings',
    fullName: 'Guy Wire Permissible Working Loads & Stay Hardware',
    category: 'Structural Library',
    description: 'Permissible working load capacities for light (2,000 daN) and heavy (3,500 daN) stay wire configurations.',
    editableFields: [
      { key: 'code', label: 'Stay Code / Class', type: 'text' },
      { key: 'working_load_dan', label: 'Allowable Working Load (daN)', type: 'number' },
    ],
  },
  {
    id: 'soil-classes',
    label: 'Geotechnical Soil Properties',
    fullName: 'Soil Subgrade Reaction Modulus & Bearing Capacities',
    category: 'Geotechnical & Foundations',
    description: 'Subgrade reaction modulus (kN/m³) and allowable bearing capacities (kN/m²) for Soil Classes 1 through 5.',
    editableFields: [
      { key: 'soil_class_num', label: 'Soil Class Number (1–5)', type: 'number' },
      { key: 'subgrade_kn_per_m3', label: 'Subgrade Modulus (kN/m³)', type: 'number' },
      { key: 'bearing_min_kn_per_m2', label: 'Bearing Min (kN/m²)', type: 'number' },
      { key: 'bearing_max_kn_per_m2', label: 'Bearing Max (kN/m²)', type: 'number' },
    ],
  },
  {
    id: 'insulators',
    label: 'Insulators & Cantilever Strengths',
    fullName: 'Insulator Hardware, Pin Strengths & Tie Selection Limits',
    category: 'Fittings & Clearances',
    description: 'Cantilever strengths, nominal mounting heights, and deflection tie limits (TTIE ≤ 10°, STIE ≤ 20°, clamps > 20°).',
    editableFields: [
      { key: 'description', label: 'Insulator Description', type: 'text' },
      { key: 'voltage_level_kv', label: 'Voltage Level (kV)', type: 'number' },
      { key: 'nominal_height_m', label: 'Nominal Height (m)', type: 'number' },
      { key: 'cantilever_strength_kn', label: 'Cantilever Pin Strength (kN)', type: 'number' },
    ],
  },
  {
    id: 'ground-clearances',
    label: 'Statutory Ground Clearances',
    fullName: 'Statutory Conductor Ground Clearance Standards',
    category: 'Fittings & Clearances',
    description: 'Mandatory minimum clearances at 65°C operating condition (5.5 m across roads, 5.2 m along roads, 4.6 m open ground).',
    editableFields: [
      { key: 'voltage_band', label: 'Voltage Band', type: 'text' },
      { key: 'environment', label: 'Environment', type: 'text' },
      { key: 'min_clearance_m', label: 'Minimum Required Clearance (m)', type: 'number' },
    ],
  },
  {
    id: 'design-parameters',
    label: 'Governing Design Parameters',
    fullName: 'Master Engineering Constants & Environmental Pressures',
    category: 'Engineering Standards',
    description: 'Global design constants: conductor wind pressure (575 N/m²), pole wind pressure (865 N/m²), guy angle (30°).',
    editableFields: [
      { key: 'parameter_name', label: 'Parameter Key', type: 'text' },
      { key: 'value', label: 'Design Value', type: 'number' },
      { key: 'unit', label: 'Physical Unit', type: 'text' },
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

  const loadTableData = async (tableMeta: TableMeta) => {
    setLoading(true)
    setSaveSuccess(null)
    setSaveError(null)
    setEditingRow(null)

    try {
      let url = ''
      if (tableMeta.spanTensionTableId) {
        url = `/api/master/span-tension-points?table_id=${encodeURIComponent(tableMeta.spanTensionTableId)}&limit=100`
      } else {
        url = `/api/master/${tableMeta.id}?limit=300`
      }

      const res = await fetch(url)
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
    loadTableData(activeTableMeta)
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
      const endpointTable = activeTableMeta.spanTensionTableId ? 'span-tension-points' : activeTableMeta.id
      const res = await fetch(`/api/master/${endpointTable}/${editingRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRow),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Save failed with status ${res.status}`)
      }

      setSaveSuccess(`Successfully updated row ID ${editingRow.id}.`)
      await loadTableData(activeTableMeta)
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

  // Group tables by category for the sidebar list
  const categories = Array.from(new Set(MASTER_TABLES.map((t) => t.category)))

  return (
    <div className="page-wrapper">
      <div className="page-header-row">
        <div>
          <h2>Construction Data Library</h2>
          <p className="page-subtitle">
            Inspect, calibrate, and edit all underlying construction catalogs, conductor sag-tension charts, and structural rating tables.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadTableData(activeTableMeta)}
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

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Table Selector Sidebar */}
        <div className="card" style={{ padding: '0.75rem', maxHeight: '82vh', overflowY: 'auto' }}>
          <div style={{ padding: '0.5rem 0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              Construction Tables & Charts
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {categories.map((cat) => (
              <div key={cat}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0.2rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {cat}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                          fontSize: '0.825rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.55rem',
                          transition: 'all 0.15s ease',
                          lineHeight: 1.35,
                        }}
                      >
                        {table.spanTensionTableId ? (
                          <TableIcon size={14} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                        ) : (
                          <Database size={14} color={isSelected ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                        )}
                        <span style={{ flex: 1 }}>{table.label}</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ maxWidth: '620px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  {activeTableMeta.spanTensionTableId && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        backgroundColor: 'var(--primary-subtle)',
                        color: 'var(--primary)',
                        border: '1px solid var(--primary-border)',
                      }}
                    >
                      CHART CODE: {activeTableMeta.spanTensionTableId}
                    </span>
                  )}
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                    {activeTableMeta.fullName}
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  {activeTableMeta.description}
                </p>
              </div>

              {/* Search input */}
              <div style={{ position: 'relative', minWidth: '220px' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter rows..."
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

          {/* Edit Modal / Box if a row is selected for editing */}
          {editingRow && (
            <div className="card" style={{ border: '2px solid var(--primary)', padding: '1.25rem', backgroundColor: 'var(--bg-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
                  <Edit2 size={16} color="var(--primary)" />
                  <span>Edit Record (ID: {editingRow.id} {activeTableMeta.spanTensionTableId ? `• Span: ${editingRow.span_m} m` : ''})</span>
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
                Loading table data...
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
