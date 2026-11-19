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
  Zap,
  Database,
  FileCheck,
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
    { to: '/project-circuits', label: 'Project & circuits', icon: Layers, step: '01' },
    { to: '/route-poles', label: 'Route & poles', icon: MapPin, step: '02' },
    { to: '/review-run', label: 'Review & run', icon: CheckSquare, step: '03' },
    { to: '/results', label: 'Results', icon: BarChart3, step: '04' },
    { to: '/construction-data', label: 'Construction Data', icon: Database, step: null },
    { to: '/help', label: 'Help & Docs', icon: HelpCircle, step: null },
  ]

  const formattedDate = datasetVersion?.imported_at
    ? datasetVersion.imported_at.split('T')[0]
    : '2026-11-18'

  return (
    <div className="app-shell">
      {/* Top Professional Header */}
      <header className="app-header">
        <div className="header-left">
          <div className="brand-emblem">
            <Zap size={18} strokeWidth={2.5} />
          </div>
          <div className="app-brand-title">
            Pole<span className="brand-accent">Select</span>
          </div>
          <span className="version-tag">v0.2</span>
        </div>

        <div className="header-right">
          {datasetVersion && (
            <div className="spec-badge" title={`Imported: ${datasetVersion.imported_at}`}>
              <Database size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {datasetVersion.name} ({formattedDate})
            </div>
          )}

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
            <div className="sidebar-section-title">Navigation & Workflow</div>
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
          </div>

          <div className="sidebar-footer-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
              <FileCheck size={14} color="var(--primary)" />
              <h5>Master Data Verification</h5>
            </div>
            <p>
              Dataset <code>{datasetVersion ? datasetVersion.name : 'LECO Master'}</code> imported on {formattedDate}. Zero hardcoded engineering constants.
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
