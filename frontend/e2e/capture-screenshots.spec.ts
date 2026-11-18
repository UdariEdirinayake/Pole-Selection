import { test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outputDir = path.resolve(__dirname, '../../docs/ui-after')

const mockUser = {
  id: 1,
  email: 'designer@pole-select.local',
  role: 'designer',
  active: true,
}

const mockProjects = [
  {
    id: 1,
    name: 'Kelaniya Distribution Feeder',
    description: 'Standard 11 kV + LV common pole line section (Poles 1 to 13)',
    line_arrangement: '11 kV + LV',
    status: 'PASS',
    updated_at: '2026-11-18T10:30:00Z',
    pole_count: 13,
    circuit_count: 2,
  },
  {
    id: 2,
    name: 'Biyagama 11kV Radial Spur',
    description: 'Medium voltage spur feeder with transformer branch',
    line_arrangement: '11 kV',
    status: 'CAUTION',
    updated_at: '2026-11-18T11:15:00Z',
    pole_count: 8,
    circuit_count: 1,
  },
  {
    id: 3,
    name: 'Sapugaskanda LV ABC Network',
    description: 'Low-voltage aerial bundled rehabilitation section',
    line_arrangement: 'LV',
    status: 'ready',
    updated_at: '2026-11-18T12:00:00Z',
    pole_count: 6,
    circuit_count: 1,
  },
]

const mockDatasetVersion = {
  table: 'dataset-versions',
  total: 1,
  items: [
    {
      id: 1,
      name: 'LECO_Import_20261118_082835',
      imported_at: '2026-11-18T08:28:35.650729',
    },
  ],
}

const mockConductors = {
  table: 'conductors',
  total: 4,
  items: [
    { code: 1, description: '3/4/2.74 mm (UD-2.74)', lookup_table: 'UD-2.74', needs_confirmation: false },
    { code: 2, description: '70+16+N50 bundled', lookup_table: 'UQ', needs_confirmation: true, confirmation_note: 'Confirm everyday tension limit' },
    { code: 3, description: 'Racoon ACSR 7/4.09', lookup_table: 'Racoon', needs_confirmation: false },
    { code: 4, description: 'Weasel ACSR 7/2.59', lookup_table: 'Weasel', needs_confirmation: false },
  ],
}

test('capture screenshots for dashboard and project-circuits', async ({ page }) => {
  // Setup API route interception
  await page.route('/api/auth/me', (route) => route.fulfill({ json: mockUser }))
  await page.route('/api/master/dataset-versions*', (route) => route.fulfill({ json: mockDatasetVersion }))
  await page.route('/api/projects/', (route) => route.fulfill({ json: mockProjects }))
  await page.route('/api/master/conductors*', (route) => route.fulfill({ json: mockConductors }))

  const viewports = [
    { name: '1440px', width: 1440, height: 900 },
    { name: '390px', width: 390, height: 844 },
  ]

  const themes = ['light', 'dark']

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height })

    for (const theme of themes) {
      // 1. Dashboard Page
      await page.goto('/dashboard')
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark')
          document.documentElement.setAttribute('data-theme', 'dark')
          localStorage.setItem('pole_select_theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          document.documentElement.removeAttribute('data-theme')
          localStorage.setItem('pole_select_theme', 'light')
        }
      }, theme)

      await page.waitForTimeout(500)
      await page.screenshot({
        path: path.join(outputDir, `dashboard-${vp.name}-${theme}.png`),
        fullPage: true,
      })

      // 2. Project & Circuits Page
      await page.goto('/project-circuits')
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark')
          document.documentElement.setAttribute('data-theme', 'dark')
          localStorage.setItem('pole_select_theme', 'dark')
        } else {
          document.documentElement.classList.remove('dark')
          document.documentElement.removeAttribute('data-theme')
          localStorage.setItem('pole_select_theme', 'light')
        }
      }, theme)

      await page.waitForTimeout(500)
      await page.screenshot({
        path: path.join(outputDir, `project-circuits-${vp.name}-${theme}.png`),
        fullPage: true,
      })
    }
  }
})
