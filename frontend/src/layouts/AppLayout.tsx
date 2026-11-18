import React from 'react'
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
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await logout()
    navigate('/signin')
  }

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/project-circuits', label: 'Project & circuits', icon: Layers },
    { to: '/route-poles', label: 'Route & poles', icon: MapPin },
    { to: '/review-run', label: 'Review & run', icon: CheckSquare },
    { to: '/results', label: 'Results', icon: BarChart3 },
    { to: '/help', label: 'Help', icon: HelpCircle },
  ]

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <header className="app-header">
        <div className="header-left">
          <Zap size={22} color="#3b82f6" />
          <span className="app-brand-title">Pole Select</span>
          <span className="version-tag">v0.2</span>
        </div>

        <div className="header-right">
          <button
            onClick={toggleTheme}
            className="btn-theme-toggle"
            aria-label="Toggle dark mode"
            title="Toggle dark mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <div className="user-chip" data-testid="user-chip">
              <span className="user-email">{user.email}</span>
              <span className="user-role-badge">{user.role}</span>
            </div>
          )}

          <button onClick={handleSignOut} className="btn-signout" title="Sign out">
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="app-body">
        {/* Left Sidebar */}
        <aside className="app-sidebar" aria-label="Main Navigation">
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="app-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
