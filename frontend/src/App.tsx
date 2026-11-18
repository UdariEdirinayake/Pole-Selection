import { useState, useEffect } from 'react'

interface HealthStatus {
  status: string
  database: string
  timestamp: string
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('http://localhost:8000/health')
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = await res.json()
      setHealth(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to reach backend /health endpoint')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="container">
      <header className="header">
        <h1>Pole Select</h1>
        <p className="subtitle">Structural Pole Selection and Calculation Platform</p>
      </header>

      <main className="content">
        <section className="card">
          <h2>Backend Health Status</h2>
          <div className="status-box">
            {loading && <p>Checking backend connection...</p>}
            {error && (
              <div className="status-error">
                <p><strong>Connection Warning:</strong> Backend unreachable on port 8000.</p>
                <small>{error}</small>
              </div>
            )}
            {health && (
              <div className="status-ok">
                <p><strong>API Status:</strong> <span className="badge">{health.status}</span></p>
                <p><strong>Database:</strong> {health.database}</p>
                <p><strong>Server Timestamp:</strong> {health.timestamp}</p>
              </div>
            )}
          </div>
          <button onClick={checkHealth} className="btn-refresh">
            Refresh Health
          </button>
        </section>

        <section className="card">
          <h2>Engineering Principles (AGENTS.md)</h2>
          <ul className="rules-list">
            <li><strong>No hard-coded engineering values:</strong> All constants externalized.</li>
            <li><strong>Explicit unit conversion:</strong> Clear input and output units on all calculations.</li>
            <li><strong>PASS only when valid:</strong> All required inputs must be strictly verified.</li>
            <li><strong>Formula testing:</strong> Unit tests calibrated against <code>docs/result.pdf</code>.</li>
            <li><strong>No invented formulas:</strong> Direct traceability to authorized benchmarks.</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>pole-select &copy; {new Date().getFullYear()} &bull; Monorepo Scaffold</p>
      </footer>
    </div>
  )
}
