import React from 'react'
import { useNavigate } from 'react-router-dom'
import { StatusChip } from '../components/StatusChip'

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
                  How to use LineDesign, what each result means, and the calculation method behind every check.
                </p>
              </div>
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
              Calculation methodology
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              LineDesign follows the order below for every pole. All limits, factors, minimum clearances and catalog values come from the LECO Master dataset. Nothing is hardcoded in the calculation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                  <span
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    M1
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Route and spans
                  </h3>
                </div>

                <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  <li>
                    <strong>Continuity:</strong> fore span of pole N must equal aft span of pole N+1. A mismatch is a blocking issue.
                  </li>
                  <li>
                    <strong>Wind span</strong> at a pole is half the aft span plus half the fore span. A terminal pole has only one span, so it uses half of that span.
                  </li>
                  <li>
                    <strong>Tension section:</strong> poles with the same section number share a conductor tension. A section pole or terminal pole ends a section.
                  </li>
                </ul>

                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1.15rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.825rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.6,
                  }}
                >
                  <div>Lw = (Laft + Lfore) / 2</div>
                  <div>Lr = √( ΣL³ / ΣL )</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                    Lr is the ruling span of a tension section, found from all its spans L.
                  </div>
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
                  <span
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    M2
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Sag and tension
                  </h3>
                </div>

                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  The engine looks up the calibrated sag-tension chart for the selected conductor. It reads the ruling span at minimum, everyday and maximum operating temperature, and uses linear interpolation between the two nearest tabulated spans. It does not extrapolate: a ruling span outside the chart range gives FAIL.
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1.15rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.825rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.6,
                  }}
                >
                  <div>T(Lr) = T1 + (T2 - T1) × [ (Lr - S1) / (S2 - S1) ]</div>
                  <div>Sspan = Sr × ( Lspan / Lr )²</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                    Linear interpolation between nearest tabulated spans; strict fail-closed boundary enforcement.
                  </div>
                </div>
              </div>

              {/* M3: Structural loads */}
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
                  <span
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    M3
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Structural loads and bending moments
                  </h3>
                </div>

                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  Bending moments at ground line are calculated for wind on conductor (BMC), wind on pole shaft (BMP), wind on equipment (BME), and line tension (BMT).
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1.15rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.825rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.6,
                  }}
                >
                  <div>BMC = 3 · ω · l · cos(α/2) · d · H</div>
                  <div>BMP = D_avg · H_gl · ω_pole · (H_gl / 2)</div>
                  <div>BMT = 2 · T · sin(α/2) · H</div>
                  <div>Ptop = ΣBM / 8.767 m</div>
                </div>
              </div>

              {/* M4: Clearances */}
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
                  <span
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    M4
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Clearances
                  </h3>
                </div>

                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  Checks ground clearance at 65°C max operating temperature against statutory minimums (e.g. 5.5 m across roads, 5.2 m along roads), and circuit-to-circuit clearance (minimum 0.9 m vertical spacing between 11 kV and LV circuits).
                </p>
              </div>

              {/* M5: Foundations */}
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
                  <span
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                    }}
                  >
                    M5
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Foundations and overturning
                  </h3>
                </div>

                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                  Foundation stability check about the fulcrum at depth Y = P / √2. Resisting moment Mg must exceed overturning moment BMF.
                </p>

                <div
                  style={{
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem 1.15rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.825rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.6,
                  }}
                >
                  <div>Y = P / √2</div>
                  <div>Mg = ( k · D_g · P³ ) / 10</div>
                  <div>Stability Check: Mg ≥ BMF</div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. WORKED EXAMPLE */}
          <section id="worked-example" style={{ marginBottom: '3rem', scrollMarginTop: '90px' }}>
            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                margin: '0 0 0.4rem 0',
              }}
            >
              Worked example
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0 0 1.25rem 0' }}>
              Reference calculations transcribed directly from the LECO specification benchmark (<em>docs/result.pdf</em>).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {/* Pole 1 */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Pole 1: Terminal (0° Angle)
                  </h4>
                  <StatusChip status="PASS" label="STABLE" />
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  • Wind span: <strong>14.5 m</strong>, Weight span: <strong>14.5 m</strong><br />
                  • Conductor wind moment BM_C: <strong>6.05 kNm</strong><br />
                  • Terminal longitudinal moment BM_TT: <strong>125.32 kNm</strong><br />
                  • Stay wire sizing: <strong>Heavy Guy (5,600 daN)</strong><br />
                  • Foundation overturning: Mg (6,211 kNm) ≫ BM_F (18.91 kNm) ➔ <strong>Type B Foundation</strong>
                </div>
              </div>

              {/* Pole 2 */}
              <div
                className="card"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Pole 2: Intermediate Angle (14°)
                  </h4>
                  <StatusChip status="PASS" label="STABLE" />
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  • Wind span: <strong>31.5 m</strong>, Spans: 29m / 34m<br />
                  • Conductor wind moment BM_C: <strong>13.05 kNm</strong><br />
                  • Transverse tension moment BM_T: <strong>30.56 kNm</strong><br />
                  • Pole top working load: <strong>614 daN</strong><br />
                  • Selected: <strong>11/850 Unguyed</strong>, Foundation: <strong>Type A</strong>
                </div>
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
