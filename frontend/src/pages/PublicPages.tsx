import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, BookOpen, Layers, ArrowRight } from 'lucide-react'

export const HomePage: React.FC = () => {
  return (
    <div className="public-page-container">
      <header className="public-hero">
        <h1>Pole Select Platform</h1>
        <p className="hero-lead">
          Structural Pole Selection and Overhead Distribution Line Mechanical Design
        </p>
        <div className="hero-cta">
          <Link to="/signin" className="btn-primary btn-large">
            Access Application <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </Link>
          <Link to="/about" className="btn-secondary btn-large">
            Learn More
          </Link>
        </div>
      </header>

      <section className="features-grid">
        <div className="feature-card">
          <ShieldCheck size={32} color="#2563eb" />
          <h3>Strict Engineering Rules</h3>
          <p>
            No hardcoded constants. All parameters externalized from validated master databases. PASS only when inputs strictly valid.
          </p>
        </div>
        <div className="feature-card">
          <Layers size={32} color="#059669" />
          <h3>Multi-Circuit Configurations</h3>
          <p>
            Configurable for 11 kV only, LV only, or combined 11 kV + LV common poles with circuit-specific sag and load combination.
          </p>
        </div>
        <div className="feature-card">
          <BookOpen size={32} color="#7c3aed" />
          <h3>Authoritative Benchmark</h3>
          <p>
            Calibration against approved standard result tables in <code>docs/result.pdf</code> and LECO master data specifications.
          </p>
        </div>
      </section>
    </div>
  )
}

export const AboutPage: React.FC = () => {
  return (
    <div className="public-page-container">
      <h2>About Pole Select</h2>
      <p>
        Pole Select is an engineering software platform for automated structural and clearance analysis of distribution lines.
      </p>
      <h3>Core Constraints (AGENTS.md)</h3>
      <ol style={{ lineHeight: 1.8 }}>
        <li><strong>No hard-coded engineering values:</strong> All physical constants and catalog dimensions externalized.</li>
        <li><strong>Explicit unit conversion:</strong> Clear conversion rules (daN to kN, kg to N, mm to m).</li>
        <li><strong>PASS only when valid:</strong> Fail-closed verification on missing or out-of-range inputs.</li>
        <li><strong>Formula verification:</strong> Unit-tested against benchmark standard <code>docs/result.pdf</code>.</li>
        <li><strong>No invented formulas:</strong> Zero extrapolation without standards citation.</li>
      </ol>
      <Link to="/" className="btn-secondary">Back to Home</Link>
    </div>
  )
}

export const HelpPage: React.FC = () => {
  return (
    <div className="public-page-container">
      <h2>Help & Guidance</h2>
      <p>Need assistance navigating the application? Review the workflow stages below:</p>
      <div className="help-steps">
        <div className="help-step">
          <h4>1. Project & Circuits</h4>
          <p>Select line arrangement (11 kV, LV, or combined) and choose conductor specifications from the verified master catalog.</p>
        </div>
        <div className="help-step">
          <h4>2. Route & Poles</h4>
          <p>Configure after/fore spans, deviation angles, and equipment. Review route continuity warnings.</p>
        </div>
        <div className="help-step">
          <h4>3. Review & Run</h4>
          <p>Audit blocking errors and warnings before running mechanical and clearance calculations.</p>
        </div>
        <div className="help-step">
          <h4>4. Results</h4>
          <p>Inspect Summary, Loads & Foundation, and Clearances & Sag schedules with CSV export capabilities.</p>
        </div>
      </div>
      <Link to="/signin" className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
        Go to Sign In
      </Link>
    </div>
  )
}
