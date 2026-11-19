import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Mail, AlertCircle, Sun, Moon, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('designer@pole-select.local')
  const [password, setPassword] = useState('DesignerPass123!')
  const [showPassword, setShowPassword] = useState(false)
  const [keepSignedIn, setKeepSignedIn] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        let errorMsg = 'Sign in failed'
        try {
          const errData = await res.json()
          errorMsg = errData.detail || errorMsg
        } catch {
          if (res.status === 504 || res.status === 502 || res.status === 503) {
            errorMsg = 'Cannot connect to backend server. Please verify the FastAPI backend is running on port 8000.'
          } else {
            errorMsg = `Server error (${res.status}): Please verify the backend is running on port 8000.`
          }
        }
        throw new Error(errorMsg)
      }

      const userData = await res.json()
      login(userData)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const fillQuick = (userEmail: string, pass: string) => {
    setEmail(userEmail)
    setPassword(pass)
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-main)',
        overflow: 'hidden',
      }}
    >
      {/* Left Column: Hero & LECO Branding */}
      <div
        style={{
          flex: '1 1 50%',
          backgroundColor: '#081022',
          backgroundImage: 'radial-gradient(ellipse at top left, #0e1e3e 0%, #081022 70%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '3rem 3.5rem',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid #1a2947',
        }}
      >
        {/* Top: Logo & App Title */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '3.5rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '7px',
                backgroundColor: '#facc15',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
                fontWeight: 900,
                fontSize: '0.65rem',
                lineHeight: 1,
                boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
                padding: '2px',
              }}
            >
              <Zap size={15} fill="#0f172a" strokeWidth={1} />
              <span style={{ fontSize: '0.58rem', fontWeight: 800, marginTop: '1px' }}>LECO</span>
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#f8fafc' }}>
              Pole Select
            </span>
          </div>

          {/* Hero Headline */}
          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              lineHeight: 1.25,
              color: '#ffffff',
              letterSpacing: '-0.025em',
              marginBottom: '1.25rem',
              maxWidth: '560px',
            }}
          >
            Overhead line design and pole selection for LECO networks
          </h1>

          <p
            style={{
              fontSize: '0.95rem',
              color: '#94a3b8',
              lineHeight: 1.55,
              marginBottom: '2rem',
              maxWidth: '520px',
            }}
          >
            Check conductors, clearances and pole foundations for 11 kV, 33 kV and LV lines in one place.
          </p>

          {/* Feature Bullets with Yellow Square Dots */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <span style={{ color: '#facc15', fontSize: '0.75rem', lineHeight: 1 }}>■</span>
              <span>Sag and tension from calibrated LECO charts</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <span style={{ color: '#facc15', fontSize: '0.75rem', lineHeight: 1 }}>■</span>
              <span>Clearance and bending-moment checks per pole</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <span style={{ color: '#facc15', fontSize: '0.75rem', lineHeight: 1 }}>■</span>
              <span>Foundation stability by soil class</span>
            </div>
          </div>
        </div>

        {/* Bottom Graphic: Catenary Pole Line Silhouette & Company Name */}
        <div style={{ marginTop: '3rem', position: 'relative' }}>
          {/* SVG Line Art of Distribution Poles and Sagging Catenary Wires */}
          <div style={{ width: '100%', height: '110px', overflow: 'hidden', opacity: 0.45 }}>
            <svg
              viewBox="0 0 700 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              {/* Ground line */}
              <line x1="0" y1="118" x2="700" y2="118" stroke="#334770" strokeWidth="2" />

              {/* Pole 1 */}
              <line x1="80" y1="30" x2="80" y2="118" stroke="#64748b" strokeWidth="4" />
              <line x1="68" y1="38" x2="92" y2="38" stroke="#94a3b8" strokeWidth="3" />
              <line x1="72" y1="52" x2="88" y2="52" stroke="#94a3b8" strokeWidth="2.5" />

              {/* Pole 2 */}
              <line x1="240" y1="20" x2="240" y2="118" stroke="#64748b" strokeWidth="4" />
              <line x1="226" y1="28" x2="254" y2="28" stroke="#94a3b8" strokeWidth="3" />
              <line x1="230" y1="44" x2="250" y2="44" stroke="#94a3b8" strokeWidth="2.5" />

              {/* Pole 3 */}
              <line x1="400" y1="25" x2="400" y2="118" stroke="#64748b" strokeWidth="4" />
              <line x1="386" y1="33" x2="414" y2="33" stroke="#94a3b8" strokeWidth="3" />
              <line x1="390" y1="48" x2="410" y2="48" stroke="#94a3b8" strokeWidth="2.5" />

              {/* Pole 4 */}
              <line x1="560" y1="18" x2="560" y2="118" stroke="#64748b" strokeWidth="4" />
              <line x1="546" y1="26" x2="574" y2="26" stroke="#94a3b8" strokeWidth="3" />
              <line x1="550" y1="42" x2="570" y2="42" stroke="#94a3b8" strokeWidth="2.5" />

              {/* Sagging Conductor 1 (Top wire catenary curves) */}
              <path d="M 0 45 Q 40 58 80 38 Q 160 62 240 28 Q 320 65 400 33 Q 480 62 560 26 Q 630 55 700 35" stroke="#3b82f6" strokeWidth="1.5" />

              {/* Sagging Conductor 2 (Second wire) */}
              <path d="M 0 58 Q 40 72 80 52 Q 160 76 240 44 Q 320 78 400 48 Q 480 75 560 42 Q 630 68 700 50" stroke="#60a5fa" strokeWidth="1.2" strokeDasharray="3 3" />

              {/* Sagging Conductor 3 (Lower LV wire) */}
              <path d="M 0 78 Q 40 92 80 72 Q 160 95 240 68 Q 320 98 400 70 Q 480 94 560 65 Q 630 88 700 72" stroke="#94a3b8" strokeWidth="1" />
            </svg>
          </div>

          <div style={{ marginTop: '0.75rem', fontSize: '0.775rem', color: '#64748b', fontWeight: 500 }}>
            Lanka Electricity Company (Pvt) Ltd
          </div>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5rem',
          position: 'relative',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {/* Top Right: Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="btn-theme-toggle"
          aria-label="Toggle dark mode"
          title="Toggle light/dark theme"
          style={{
            position: 'absolute',
            top: '1.75rem',
            right: '1.75rem',
            backgroundColor: 'var(--bg-subtle)',
            borderColor: 'var(--border-color)',
          }}
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Form Container */}
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: '0 0 0.4rem 0',
                letterSpacing: '-0.02em',
              }}
            >
              Sign in
            </h2>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Use your Pole Select account to continue.
            </p>
          </div>

          {error && (
            <div
              className="alert-box alert-error"
              data-testid="signin-error"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger-text)',
                fontSize: '0.825rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.4rem',
                }}
              >
                Email address
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pole-select.local"
                  className="form-input"
                  style={{
                    paddingLeft: '34px',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--bg-app)',
                    borderColor: 'var(--border-color)',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  marginBottom: '0.4rem',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                  style={{
                    paddingLeft: '34px',
                    paddingRight: '54px',
                    fontSize: '0.85rem',
                    backgroundColor: 'var(--bg-app)',
                    borderColor: 'var(--border-color)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--primary)',
                    fontSize: '0.775rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  style={{ borderRadius: '3px', cursor: 'pointer' }}
                />
                <span>Keep me signed in</span>
              </label>

              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault()
                  alert('Default demo credentials are prefilled below. Click Designer, Reviewer, or Admin to sign in immediately.')
                }}
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                Forgot password?
              </a>
            </div>

            {/* Sign in Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                height: '42px',
                minHeight: '42px',
                marginTop: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: 700,
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ margin: '1.75rem 0 1.25rem', borderTop: '1px solid var(--border-color)' }} />

          {/* Demo Accounts Quick Select */}
          <div>
            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Demo accounts. Select one to sign in as that role.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => fillQuick('designer@pole-select.local', 'DesignerPass123!')}
                className="btn-secondary"
                style={{
                  height: '36px',
                  minHeight: '36px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }}
              >
                Designer
              </button>

              <button
                type="button"
                onClick={() => fillQuick('reviewer@pole-select.local', 'ReviewerPass123!')}
                className="btn-secondary"
                style={{
                  height: '36px',
                  minHeight: '36px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }}
              >
                Reviewer
              </button>

              <button
                type="button"
                onClick={() => fillQuick('admin@pole-select.local', 'AdminPass123!')}
                className="btn-secondary"
                style={{
                  height: '36px',
                  minHeight: '36px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Footer Version Tag */}
          <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Pole Select v0.2
          </div>
        </div>
      </div>
    </div>
  )
}
