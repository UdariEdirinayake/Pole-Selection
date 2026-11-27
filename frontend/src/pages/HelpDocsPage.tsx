import React from 'react'
import { useNavigate } from 'react-router-dom'

export const HelpDocsPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div
      className="page-wrapper"
      style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '0 1rem 3rem',
      }}
    >
      <div>
        {/* Main Content Area */}
        <div>
          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
              <img
                src="/leco_logo.png"
                alt="LECO Official Logo"
                style={{
                  height: '46px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                }}
              />
              <div>
                <h1
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    margin: 0,
                    color: 'var(--text-main)',
                    letterSpacing: '-0.025em',
                  }}
                >
                  Help and documentation
                </h1>
                <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  How to use LineDesign, what each result means, the step-by-step calculation method, and how every pass/fail condition is checked.
                </p>
              </div>
            </div>

            {/* Quick Section Navigation */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '1rem' }}>
              {[
                { href: '#workflow', label: '1. Workflow' },
                { href: '#status-labels', label: '2. Status labels' },
                { href: '#methodology', label: '3. Full calculation methodology (M1–M8)' },
                { href: '#condition-checks', label: '4. How conditions are checked' },
                { href: '#constants-and-rules', label: '5. Constants & rules' },
                { href: '#troubleshooting', label: '6. Troubleshooting' },
                { href: '#glossary', label: '7. Glossary' },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '0.32rem 0.72rem',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* 1. WORKFLOW SECTION */}
          <section id="workflow" style={{ marginBottom: '3rem', scrollMarginTop: '90px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 0.4rem 0',
              }}
            >
              Workflow
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              Work through the four stages in order. Each stage must be complete before the next one is useful.
            </p>

            <div
              className="card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <div className="table-responsive">
                <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '18%', padding: '0.85rem 1rem' }}>Stage</th>
                      <th style={{ width: '28%', padding: '0.85rem 1rem' }}>You enter</th>
                      <th style={{ width: '28%', padding: '0.85rem 1rem' }}>The system checks</th>
                      <th style={{ width: '26%', padding: '0.85rem 1rem' }}>You get</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>
                        1. Project &amp; circuits
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Project title, survey reference, line arrangement (11 kV + LV, 11 kV only, 33 kV + LV, LV only), conductor for each circuit
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Conductor exists in the master catalog and has a sag-tension chart
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Project linked to the correct charts
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>
                        2. Route &amp; poles
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        For each pole: section number, aft and fore span, deviation angle, equipment, soil class (1–5)
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Route continuity: the fore span of pole N equals the aft span of pole N+1
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Complete route schedule
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>
                        3. Review &amp; run
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Nothing new. Review the audit.
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Blocking issues must be 0. Warnings are listed for your decision.
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        The Run calculations button becomes available
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>
                        4. Results
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Nothing. Inspect and export.
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        All structural, clearance and foundation checks
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Recommended pole height and class per pole, with PDF / Excel export of Summary, Loads &amp; Foundation, and Clearances &amp; Sag
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 2. STATUS LABELS SECTION */}
          <section id="status-labels" style={{ marginBottom: '3rem', scrollMarginTop: '90px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 0.4rem 0',
              }}
            >
              Status labels
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              Every result shows a text label as well as a colour.
            </p>

            <div
              className="card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* PASS */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '1.15rem 1.4rem',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ width: '110px', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                      }}
                    >
                      <span>●</span> PASS
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Every check is within its limit and above the caution margin.
                  </div>
                </div>

                {/* CAUTION */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '1.15rem 1.4rem',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ width: '110px', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                      }}
                    >
                      <span>◆</span> CAUTION
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    All checks pass, but at least one has a small margin left. Review it before approving.
                  </div>
                </div>

                {/* FAIL */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.5rem',
                    padding: '1.15rem 1.4rem',
                  }}
                >
                  <div style={{ width: '110px', flexShrink: 0 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                      }}
                    >
                      <span>■</span> FAIL
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    A check is not met, or a needed input is missing or outside the chart or catalog range. The system never guesses a value.
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. CALCULATION METHODOLOGY SECTION */}
          <section id="methodology" style={{ marginBottom: '3rem', scrollMarginTop: '90px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 0.4rem 0',
              }}
            >
              3. Full calculation methodology (M1–M8)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              LineDesign evaluates every pole in eight sequential engineering steps. Every physical constant, conductor chart, pole rating, clearance limit, and soil property is loaded from the LECO Master dataset — nothing is hardcoded or guessed.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* M1: Route and Spans */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    M1
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Route continuity, wind span &amp; ruling span
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <strong>In plain terms:</strong> First, the route is checked so every span connects properly from pole to pole. Then each pole is assigned its <em>wind span</em> (how much conductor length pushes wind onto it), and each tension section gets one <em>ruling span</em> that represents the whole section&apos;s sag-tension behaviour.
                </p>
                <ul style={{ margin: '0 0 0.9rem 0', paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <li><strong>Continuity:</strong> Fore span of pole N must equal aft span of pole N+1.</li>
                  <li><strong>Wind span (S<sub>w</sub>):</strong> Average of aft and fore spans. Terminal poles have only one span, so S<sub>w</sub> = S / 2.</li>
                  <li><strong>Tension section:</strong> Poles sharing the same section number share one conductor tension; terminal or section poles terminate the section.</li>
                </ul>
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.15rem', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.65 }}>
                  <div>S_w = (S_aft + S_fore) / 2</div>
                  <div>S_r = √( Σ S³ / Σ S ) &nbsp; [Ruling span of the tension section]</div>
                </div>
              </div>

              {/* M2: Sag and Tension */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    M2
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Sag &amp; tension chart lookup (linear interpolation only)
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <strong>In plain terms:</strong> Using the section&apos;s ruling span S<sub>r</sub>, the engine looks up the official LECO sag-tension chart for the chosen conductor. It interpolates linearly between the two nearest tabulated spans for both everyday temperature (27°C) and maximum wind load (15°C + wind), and scales maximum sag (65°C) to each individual span. <strong>It never extrapolates</strong> outside the table bounds.
                </p>
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.15rem', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.65 }}>
                  <div>X(S_r) = X_1 + [ (S_r − S_1) / (S_2 − S_1) ] × (X_2 − X_1)</div>
                  <div>Sag_span,65 = Sag_r,65 × (S_span / S_r)²</div>
                  <div>Stress Check: T_27°C ≤ 20% UTS (Everyday) &amp; T_15°C+wind ≤ 40% UTS (Max)</div>
                </div>
              </div>

              {/* M3: Ground-Line Bending Moments */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    M3
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Ground-line bending moments (wind &amp; line tension)
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <strong>In plain terms:</strong> Every horizontal force pushing on the pole creates a bending moment at ground level (force × height above ground). The engine sums four sources: wind on conductors, wind on the concrete pole shaft, wind on any pole-mounted transformer/switchgear, and conductor pull where the line turns an angle or dead-ends.
                </p>
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.15rem', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.65 }}>
                  <div>BM_C = Σ n_c · (q_w / 1000) · S_w · cos(α / 2) · d_c · H_c &nbsp; [q_w = 575 N/m²]</div>
                  <div>BM_P = D_avg · H_gl · (q_pole / 1000) · (H_gl / 2) &nbsp; [q_pole = 865 N/m²]</div>
                  <div>BM_E = A_e · (q_pole / 1000) · (H_mount + h_eq / 2) &nbsp; [If equipment mounted]</div>
                  <div>BM_T = Σ n_c · (T_1 + T_2) · sin(α / 2) · H_c &nbsp; [Intermediate angle pole]</div>
                  <div>BM_TT = Σ n_c · T · H_c , &nbsp; BM_PT = D_long · H_gl · (q_pole / 1000) · (H_gl / 2) &nbsp; [Terminal pole]</div>
                </div>
              </div>

              {/* M4: Pole Top Working Load, Unguyed & Stay Sizing */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    M4
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Pole top working load, pole class selection &amp; stay sizing
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <strong>In plain terms:</strong> Concrete poles are rated by the working load they can carry near the top (0.4 m below pole top, in daN). The engine converts the total bending moment into an equivalent pole-top load P<sub>top</sub> and picks the lightest pole class that meets it. If a single unguyed pole is not strong enough (or at terminal/heavy-angle poles), it sizes a stay (guy) wire or strutted pole pair.
                </p>
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.15rem', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.65 }}>
                  <div>P_top (daN) = [ ΣBM (kN·m) / (H_gl − 0.4 m) ] × 100</div>
                  <div>Unguyed selection: smallest capacity_daN ≥ P_top (200 U → 350 U → 500 U → 850 U → 2×350 U → 2×500 U → 2×850 U)</div>
                  <div>Guy tension: G (daN) = [ BM_tension / (h_g · sin(α_guy) · cos(θ)) ] × 100 &nbsp; [Light ≤ 2,000 daN, Heavy ≤ 3,500 daN]</div>
                  <div>Strutted pair rules: P ≤ 745.41 → 200/200 S | ≤ 1349.74 → 200/350 S | ≤ 1601.5 → 200/500 S | ≤ 2441.83 → 200/850 S</div>
                </div>
              </div>

              {/* M5: Euler Critical Buckling */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    M5
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Euler critical buckling check (guyed &amp; strutted poles)
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <strong>In plain terms:</strong> A stay wire pulls downward on the pole, compressing it like a column. The engine adds the vertical weight of conductors, equipment, and the downward guy component, multiplies by a <strong>2.5× safety factor</strong>, and ensures the pole&apos;s critical buckling strength exceeds that factored load (automatically upsizing 200 → 350 → 500 → 850 → 1200 if needed).
                </p>
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.15rem', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.65 }}>
                  <div>V_demand = V_conductors + V_equipment + G · cos(α_guy) / 100</div>
                  <div>Buckling Demand = |V_demand| × 2.5 &nbsp; (kN) &nbsp; ➔ Must satisfy: P_critical_buckling ≥ Buckling Demand</div>
                </div>
              </div>

              {/* M6: Foundation Overturning & Bearing */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    M6
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Foundation overturning &amp; soil bearing (Types A, B, C)
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <strong>In plain terms:</strong> Two soil checks are performed for every pole: (1) <em>Overturning</em> checks whether the surrounding soil resists tipping about the buried fulcrum δ = P / √2, and (2) <em>Bearing</em> checks whether the pole base can support the total downward weight without sinking. If the native pole footprint (Type A) is too small, a concrete pad is added (+200 mm for Type B, +400 mm for Type C).
                </p>
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.15rem', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.65 }}>
                  <div>Embedment P = H_pole / 6 , &nbsp; Fulcrum depth δ = P / √2</div>
                  <div>BM_F = BM_C,F + BM_P,F + BM_E,F [ + BM_T,F + |BM_long,F| if not guyed/strutted ]</div>
                  <div>M_g = (k · D_g · P³) / 10 &nbsp; ➔ Overturning Check: M_g &gt; BM_F</div>
                  <div>V* = W_pole + W_equip + W_cond + G_vert &nbsp; ➔ Bearing Check: (L + Δ)(W + Δ) · q_bearing ≥ V* (Δ = 0, 200, 400 mm)</div>
                </div>
              </div>

              {/* M7: Insulator Pin Load & Tie Selection */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    M7
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Insulator pin cantilever &amp; tie selection
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <strong>In plain terms:</strong> The insulator pin holding each conductor must resist both the conductor&apos;s sideways angle pull and wind force. Depending on the deviation angle α and cantilever rating, the engine chooses a top tie, side tie, double pin, or dead-end tension insulator.
                </p>
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.15rem', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.65 }}>
                  <div>R = T_1 · sin(α / 2) + T_2 · sin(α / 2) + (q_w / 1000) · d_c · S_w · cos(α / 2)</div>
                  <div>Rules: α ≤ 10° → TTIE | 10° &lt; α ≤ 20° → STIE | α &gt; 20° (or R &gt; R_cant) → 2× Pin + 2STIE | Dead-End → TEN**</div>
                </div>
              </div>

              {/* M8: Clearances */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem 1.4rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.3)', fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    M8
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Statutory ground, circuit-to-circuit &amp; crossarm clearances
                  </h3>
                </div>
                <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <strong>In plain terms:</strong> At 65°C (hot summer + full load), conductors sag lowest. The engine checks that the lowest wire stays safely above ground (for road crossings, along roads, or open ground), that upper and lower circuits stay separated vertically, and that turning an angle does not squeeze phase wires too close on the crossarm.
                </p>
                <div style={{ backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1.15rem', fontFamily: 'var(--font-mono)', fontSize: '0.825rem', color: 'var(--text-main)', lineHeight: 1.65 }}>
                  <div>Ground Clearance: H_attach,bottom − Sag_65 ≥ H_min_ground &nbsp; (e.g. 5.5 m across roads, 5.2 m along roads, 4.6 m open)</div>
                  <div>Circuit Separation: ΔH_circuits ≥ H_min_cc &nbsp; (e.g. ≥ 1.2 m between 11 kV and LV)</div>
                  <div>Crossarm Separation: D_eff = D_crossarm · cos(α / 2) ≥ D_req = 0.75 · √Sag_65 + kV² / 20000</div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. HOW EVERY CONDITION IS CHECKED */}
          <section id="condition-checks" style={{ marginBottom: '3rem', scrollMarginTop: '90px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 0.4rem 0',
              }}
            >
              4. How every condition is checked (PASS / CAUTION / FAIL rules)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              LineDesign uses a strict <strong>fail-closed</strong> rule: a pole only receives <strong>PASS</strong> when every single engineering check below meets or exceeds its required threshold with valid master data. If any value is missing or out of bounds, it immediately reports <strong>FAIL</strong> or <strong>NOT ASSESSED</strong>.
            </p>

            <div
              className="card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <div className="table-responsive">
                <table className="data-table" style={{ width: '100%', fontSize: '0.84rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '17%', padding: '0.8rem 1rem' }}>Check</th>
                      <th style={{ width: '24%', padding: '0.8rem 1rem' }}>PASS condition</th>
                      <th style={{ width: '18%', padding: '0.8rem 1rem' }}>CAUTION condition</th>
                      <th style={{ width: '21%', padding: '0.8rem 1rem' }}>FAIL / NOT ASSESSED</th>
                      <th style={{ width: '20%', padding: '0.8rem 1rem' }}>How to fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>Route continuity</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Fore span of Pole N equals Aft span of Pole N+1</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-muted)' }}>—</td>
                      <td style={{ verticalAlign: 'top', color: '#ef4444' }}>Blocking error if fore ≠ aft</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Match adjacent spans in Route &amp; poles</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>Sag-tension chart bounds</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>S_min ≤ Ruling span S_r ≤ S_max in conductor chart</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-muted)' }}>—</td>
                      <td style={{ verticalAlign: 'top', color: '#ef4444' }}>NOT ASSESSED / FAIL if S_r is outside chart range (no extrapolation)</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Split tension section or pick a conductor covering that span</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>Conductor tension limits</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>T_27°C ≤ 20% UTS and T_15°C+wind ≤ 40% UTS</td>
                      <td style={{ verticalAlign: 'top', color: '#f59e0b' }}>LV ABC reference tension exceeds 20% UTS</td>
                      <td style={{ verticalAlign: 'top', color: '#ef4444' }}>FAIL if bare/ACSR conductor exceeds 20% EDS or 40% max</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Use higher-UTS conductor or shorter ruling span</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>Pole working load</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Selected pole capacity_daN ≥ P_top (or guyed/strutted carries load)</td>
                      <td style={{ verticalAlign: 'top', color: '#f59e0b' }}>Load ≥ 90% of pole capacity</td>
                      <td style={{ verticalAlign: 'top', color: '#ef4444' }}>FAIL if P_top exceeds all catalog classes and no guy/strut fits</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Add stay wire, reduce angle, or shorten spans</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>Critical buckling (guyed/strutted)</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Critical buckling strength ≥ 2.5 × |V_total|</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-muted)' }}>—</td>
                      <td style={{ verticalAlign: 'top', color: '#ef4444' }}>FAIL if even largest class (1200) is below 2.5 × |V_total|</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Increase guy height/angle or use heavier pole class</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>Foundation overturning</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Soil resisting moment M_g &gt; Overturning moment BM_F</td>
                      <td style={{ verticalAlign: 'top', color: '#f59e0b' }}>Safety margin small (M_g / BM_F close to 1.0)</td>
                      <td style={{ verticalAlign: 'top', color: '#ef4444' }}>FAIL if M_g ≤ BM_F or soil subgrade k is missing</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Verify soil class, add stay wire, or use breast/heel block</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>Foundation soil bearing</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Footprint capacity (Type A, B, or C) ≥ Total vertical load V*</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-muted)' }}>—</td>
                      <td style={{ verticalAlign: 'top', color: '#ef4444' }}>FAIL (Type X) if Type C (+400 mm) still &lt; V*</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Enlarge concrete foundation pad beyond Type C</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>Insulator pin cantilever</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Resultant pin load R ≤ Cantilever rating (single or 2× pin)</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-muted)' }}>—</td>
                      <td style={{ verticalAlign: 'top', color: '#ef4444' }}>FAIL / Flag if R exceeds 2× pin rating</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Convert pole to a section/dead-end pole (TEN**)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, verticalAlign: 'top', color: 'var(--text-main)' }}>Ground &amp; circuit clearances</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Lowest wire (65°C) ≥ statutory minimum; circuit ΔH ≥ table min</td>
                      <td style={{ verticalAlign: 'top', color: '#f59e0b' }}>Margin ≤ 0.2 m above minimum</td>
                      <td style={{ verticalAlign: 'top', color: '#ef4444' }}>FAIL if lowest wire &lt; required minimum or circuit spacing violated</td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>Use taller pole (e.g. 13 m) or shorten the span</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 5. CONSTANTS AND RULES */}
          <section id="constants-and-rules" style={{ marginBottom: '3rem', scrollMarginTop: '90px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 0.4rem 0',
              }}
            >
              Constants and rules
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              Master engineering coefficients externalized strictly from LECO verified datasets.
            </p>

            <div
              className="card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <div className="table-responsive">
                <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.75rem 1rem' }}>Parameter</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Standard Value</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Authority / Citation</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Wind pressure on conductors</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>575 N/m²</td>
                      <td>Project Owner Confirmation / LECO Master Dataset</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Wind pressure on poles &amp; equipment</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>865 N/m²</td>
                      <td>LECO Standard Overhead Line Specification</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Everyday stress limit (EDS @ 27°C)</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>20 % of UTS</td>
                      <td>Conductor fatigue &amp; vibration limit</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Maximum stress limit (15°C + Wind)</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>40 % of UTS</td>
                      <td>Safety factor threshold (2.5× UTS)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Standard embedment depth</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>1/6 of pole length (1.833 m for 11 m pole)</td>
                      <td>LECO Foundation Standard Specification</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Standard gravity (g)</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>9.80665 m/s²</td>
                      <td>ISO / Engineering Constant for kg ➔ N conversions</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 6. TROUBLESHOOTING SECTION */}
          <section id="troubleshooting" style={{ marginBottom: '3rem', scrollMarginTop: '90px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 0.4rem 0',
              }}
            >
              Troubleshooting
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              Common validation messages and recommended engineering resolutions.
            </p>

            <div
              className="card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
              }}
            >
              <div className="table-responsive">
                <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '25%', padding: '0.85rem 1rem' }}>Message</th>
                      <th style={{ width: '38%', padding: '0.85rem 1rem' }}>Likely cause</th>
                      <th style={{ width: '37%', padding: '0.85rem 1rem' }}>What to do</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#f59e0b', verticalAlign: 'top' }}>
                        Route continuity warning
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Fore span of a pole differs from aft span of the next pole
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Correct one of the two values in Route &amp; poles
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)', verticalAlign: 'top' }}>
                        Run calculations is disabled
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Blocking issues is above 0
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Open Review &amp; run and clear each blocking item
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#ef4444', verticalAlign: 'top' }}>
                        FAIL: ruling span outside chart
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        The section is longer or shorter than the chart covers
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Split the section or choose a conductor whose chart covers the span
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#ef4444', verticalAlign: 'top' }}>
                        FAIL: working load
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Moment exceeds the largest permitted pole class
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Reduce the angle, shorten adjacent spans or add a stay pole
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#ef4444', verticalAlign: 'top' }}>
                        FAIL: ground clearance
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Maximum sag is too large for the pole height
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Shorten the span or use a taller pole
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, color: '#ef4444', verticalAlign: 'top' }}>
                        FAIL: foundation ratio
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Resisting moment is below the required factor of safety
                      </td>
                      <td style={{ verticalAlign: 'top', color: 'var(--text-secondary)' }}>
                        Confirm the soil class, then use a deeper embedment or a larger pole
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 7. GLOSSARY SECTION */}
          <section id="glossary" style={{ marginBottom: '2.5rem', scrollMarginTop: '90px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 0.4rem 0',
              }}
            >
              Glossary
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              Standard terms and abbreviations used throughout LineDesign.
            </p>

            <div
              className="card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginBottom: '1.75rem',
              }}
            >
              <div className="table-responsive">
                <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                  <tbody>
                    <tr>
                      <td style={{ width: '22%', fontWeight: 700, color: 'var(--text-main)', padding: '0.75rem 1rem' }}>
                        Aft span
                      </td>
                      <td style={{ color: 'var(--text-secondary)', padding: '0.75rem 1rem' }}>
                        Span on the back side of a pole, towards pole 1
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)', padding: '0.75rem 1rem' }}>
                        Fore span
                      </td>
                      <td style={{ color: 'var(--text-secondary)', padding: '0.75rem 1rem' }}>
                        Span on the front side, towards the last pole
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)', padding: '0.75rem 1rem' }}>
                        Ruling span
                      </td>
                      <td style={{ color: 'var(--text-secondary)', padding: '0.75rem 1rem' }}>
                        Single equivalent span used for a whole tension section
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)', padding: '0.75rem 1rem' }}>
                        Wind span
                      </td>
                      <td style={{ color: 'var(--text-secondary)', padding: '0.75rem 1rem' }}>
                        Length of conductor whose wind load a pole carries
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)', padding: '0.75rem 1rem' }}>
                        Angle pole
                      </td>
                      <td style={{ color: 'var(--text-secondary)', padding: '0.75rem 1rem' }}>
                        Pole where the line changes direction
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)', padding: '0.75rem 1rem' }}>
                        Terminal pole
                      </td>
                      <td style={{ color: 'var(--text-secondary)', padding: '0.75rem 1rem' }}>
                        Pole at the end of the line, carrying one-sided tension
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)', padding: '0.75rem 1rem' }}>
                        FoS
                      </td>
                      <td style={{ color: 'var(--text-secondary)', padding: '0.75rem 1rem' }}>
                        Factor of safety
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)', padding: '0.75rem 1rem' }}>
                        daN
                      </td>
                      <td style={{ color: 'var(--text-secondary)', padding: '0.75rem 1rem' }}>
                        Decanewton, 10 N, the unit of pole working load
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Back to dashboard button (matching image 5) */}
            <div>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="btn-primary"
                style={{
                  height: '42px',
                  minHeight: '42px',
                  padding: '0 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span>Back to dashboard</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
