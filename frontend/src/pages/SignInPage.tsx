import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, Mail, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
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
        const errData = await res.json()
        throw new Error(errData.detail || 'Sign in failed')
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
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <h2>Sign In to Pole Select</h2>
          <p>Overhead line mechanical design & pole selection platform</p>
        </div>

        {error && (
          <div className="alert-box alert-error" data-testid="signin-error">
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="signin-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@pole-select.local"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary btn-submit">
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick-login helpers — only rendered in development builds */}
        {import.meta.env.DEV && (
        <div className="quick-logins">
          <p className="quick-logins-title">Quick demo logins:</p>
          <div className="quick-buttons">
            <button
              type="button"
              onClick={() => fillQuick('designer@pole-select.local', 'DesignerPass123!')}
              className="btn-quick"
            >
              Designer
            </button>
            <button
              type="button"
              onClick={() => fillQuick('reviewer@pole-select.local', 'ReviewerPass123!')}
              className="btn-quick"
            >
              Reviewer
            </button>
            <button
              type="button"
              onClick={() => fillQuick('admin@pole-select.local', 'AdminPass123!')}
              className="btn-quick"
            >
              Admin
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
