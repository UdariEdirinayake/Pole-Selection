import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Layers,
  MapPin,
  CheckSquare,
  BarChart3,
  HelpCircle,
  LogOut,
  Sun,
  Moon,
  Database,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

interface DatasetVersionInfo {
  id: number
  name: string
  imported_at: string
}

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [datasetVersion, setDatasetVersion] = useState<DatasetVersionInfo | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/master/dataset-versions?limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.items && data.items.length > 0) {
          setDatasetVersion(data.items[0])
        }
      })
      .catch(() => {})
  }, [])

  const handleSignOut = async () => {
    await logout()
    navigate('/signin')
  }

  const workflowItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, step: null },
    { to: '/project-circuits', label: 'Project & circuits', icon: Layers, step: '1' },
    { to: '/route-poles', label: 'Route & poles', icon: MapPin, step: '2' },
    { to: '/review-run', label: 'Review methodology', icon: CheckSquare, step: '3' },
    { to: '/results', label: 'Results', icon: BarChart3, step: '4' },
  ]

  const secondaryNavItems = [
    { to: '/construction-data', label: 'Construction data', icon: Database },
    { to: '/help', label: 'Help & docs', icon: HelpCircle },
  ]

  const formattedDate = datasetVersion?.imported_at
    ? datasetVersion.imported_at.split('T')[0]
    : '2026-11-18'

  return (
    <div className="app-shell">
      {/* Top Professional Header */}
      <header className="app-header">
        <div className="header-left">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Lanka Electricity Company"
          >
            <img
              src="/leco_logo.png"
              alt="LECO"
              style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <div className="app-brand-title" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
            LineDesign
          </div>
          <span className="version-tag" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>v0.2</span>
        </div>

        <div className="header-right">
          <button
            onClick={toggleTheme}
            className="btn-theme-toggle"
            aria-label="Toggle dark mode"
            title="Toggle light/dark theme"
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {user && (
            <div className="user-chip" data-testid="user-chip">
              <span className="user-avatar-dot" />
              <span className="user-email">{user.email}</span>
              <span className="user-role-badge">{user.role}</span>
            </div>
          )}

          <button onClick={handleSignOut} className="btn-signout" title="Sign out of platform">
            <LogOut size={15} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="app-body">
        {/* Left Sidebar */}
        <aside className="app-sidebar" aria-label="Main Navigation">
          <div>
            <div className="sidebar-section-title">Workflow</div>
            <nav className="sidebar-nav">
              {workflowItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={17} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {item.step && <span className="nav-step-num">{item.step}</span>}
                  </NavLink>
                )
              })}
            </nav>

            <div style={{ margin: '1.25rem 0 0.5rem', borderTop: '1px solid var(--border-light)' }} />

            <nav className="sidebar-nav">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={17} />
                    <span style={{ flex: 1 }}>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>

          <div className="sidebar-footer-card">
            <h5 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>LineDesign v0.2</h5>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              Master data: {datasetVersion ? datasetVersion.name : 'LECO Master'}.<br />
              Imported {formattedDate}. All engineering constants come from the dataset.
            </p>
          </div>
        </aside>

        {/* Content Area */}
        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
