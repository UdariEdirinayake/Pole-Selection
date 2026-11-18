import { test, expect } from '@playwright/test'

test.describe('Phase 2 UI Smoke Tests', () => {
  test('unauthenticated users are redirected from /dashboard to /signin', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*signin/)
    await expect(page.locator('h2')).toContainText('Sign In to Pole Select')
  })

  test('sign in, open a project, and navigate all three Results tabs', async ({ page }) => {
    // Intercept auth/me and login endpoints for reliable deterministic E2E execution
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'designer@pole-select.local',
          role: 'designer',
          active: true,
        }),
      })
    })

    await page.route('/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          email: 'designer@pole-select.local',
          role: 'designer',
          active: true,
        }),
      })
    })

    await page.route('/api/projects/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 101,
            name: 'Kelaniya Distribution Line',
            description: '11 kV + LV common line section',
            line_arrangement: '11 kV + LV',
            status: 'draft',
            updated_at: new Date().toISOString(),
            pole_count: 13,
            circuit_count: 2,
          },
        ]),
      })
    })

    await page.route('/api/results/sample', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          banner: 'Sample data – not a live calculation',
          data: {
            pole_summary: [
              {
                sec: 1,
                pole: 1,
                pole_configuration: 'Terminal',
                final_recommended_pole: '11m 350 U',
                spur: 'No',
                equipment: 'None',
                foundation_recommendation: 'Type A (Normal)',
                status: 'PASS',
              },
            ],
            conductor_tension_check: [
              {
                sec: 1,
                circuit: 'C1 (11kV)',
                conductor: '70 mm² ABC',
                t_at_15_wind_kn: 12.45,
                pct_uts_at_15_wind: 31.1,
                check_15_wind: 'PASS',
                t_at_27_kn: 6.85,
                pct_uts_at_27: 17.1,
                eds_check: 'PASS',
              },
            ],
            structural_loading: [
              {
                sec: 1,
                pole: 1,
                fore_span_m: 29.0,
                angle_deg: 0.0,
                eq_span_m: 31.5,
                bm_wind_line_kn_m: 3.42,
                bm_tension_kn_m: 28.5,
                bm_wind_pole_kn_m: 2.85,
                bm_wind_equip_kn_m: 0.0,
                total_bm_kn_m: 34.77,
                pole_top_loads: 'Pending',
                buckling_capacity: 'Pending',
                status: 'PASS',
              },
            ],
            foundation_soil_bearing: [
              {
                sec: 1,
                pole: 1,
                soil_class: 4,
                recommended_pole: '11m 350 U',
                bmf_kn_m: 34.77,
                mr_kn_m: 65.4,
                subgrade_k_kn_m3: 52500,
                stability_check: 'PASS',
                total_vertical_load_kn: 10.99,
                bearing_check: 'PASS',
                status: 'PASS',
              },
            ],
            ground_clearance: [
              {
                sec: 1,
                pole: 1,
                fore_span_m: 29.0,
                lowest_clearance_m: 6.85,
                applicable_clearance_m: 6.1,
                ground_clearance_check: 'PASS',
                min_vert_clear_c1_c2_m: 1.25,
                applicable_cct_clearance_m: 1.2,
                circuit_clearance_check: 'PASS',
                status: 'PASS',
              },
            ],
            phase_separation: [
              {
                sec: 1,
                pole_no: 1,
                sag_65_c1_m: 0.58,
                required_separation_m: 0.85,
                crossarm_separation_straight_m: 0.95,
                line_angle_deg: 0.0,
                separation_at_angle_m: 0.95,
                separation_check: 'PASS',
                status: 'PASS',
              },
            ],
            sag_schedule_27: [
              {
                sec: 1,
                pole_no: 1,
                sag_27_c1_m: 0.42,
                sag_27_c2_m: 0.39,
              },
            ],
            design_parameters: [
              {
                parameter: 'Wind pressure on conductors',
                value: '575 N/m²',
                source: 'Project owner confirmation',
              },
            ],
          },
        }),
      })
    })

    // 1. Visit sign-in page
    await page.goto('/signin')
    await page.fill('#email', 'designer@pole-select.local')
    await page.fill('#password', 'ValidPassword123!')
    await page.click('button[type="submit"]')

    // 2. Open project dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('h2')).toContainText('Dashboard')

    // 3. Navigate to Results page
    await page.goto('/results')
    await expect(page.getByTestId('sample-data-banner')).toContainText(
      'Sample data – not a live calculation'
    )

    // Tab 1: Summary & Tension
    await expect(page.getByTestId('tab-summary')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('text=Pole Selection Summary')).toBeVisible()
    await expect(page.locator('text=Conductor Tension & Stress Check')).toBeVisible()

    // Tab 2: Loads & Foundation
    await page.click('[data-testid="tab-loads"]')
    await expect(page.getByTestId('tab-loads')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('text=Structural Loading Analysis')).toBeVisible()
    await expect(page.locator('text=Foundation Stability & Soil Bearing Analysis')).toBeVisible()
    await expect(page.locator('text=Pending').first()).toBeVisible()

    // Tab 3: Clearances & Sag
    await page.click('[data-testid="tab-clearances"]')
    await expect(page.getByTestId('tab-clearances')).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('text=Ground & Circuit Clearance Profile')).toBeVisible()
    await expect(page.locator('text=Phase Separation & Swing Check')).toBeVisible()
    await expect(page.locator('text=27°C Everyday Sag Stringing Schedule')).toBeVisible()
  })
})
