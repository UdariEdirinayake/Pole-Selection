import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chromium } from '@playwright/test'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const distDir = path.resolve(__dirname, '../dist')
const outputDir = path.resolve(__dirname, '../../docs/ui-after')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
}

// 1. Create simple local static HTTP server for SPA
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost:4173')
  let filePath = path.join(distDir, parsedUrl.pathname)

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html')
  }

  if (!fs.existsSync(filePath) || !path.extname(filePath)) {
    filePath = path.join(distDir, 'index.html')
  }

  const ext = path.extname(filePath).toLowerCase()
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500)
      res.end('Server Error')
    } else {
      res.writeHead(200, { 'Content-Type': contentType })
      res.end(content)
    }
  })
})

const PORT = 4173

server.listen(PORT, async () => {
  console.log(`Static server running on http://localhost:${PORT}`)

  try {
    const browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
    })

    const context = await browser.newContext()
    const page = await context.newPage()

    // Mock API endpoints
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
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

    await page.route('**/api/master/dataset-versions*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          table: 'dataset-versions',
          total: 1,
          items: [
            {
              id: 1,
              name: 'LECO_Import_20261118_082835',
              imported_at: '2026-11-18T08:28:35.650729',
            },
          ],
        }),
      })
    })

    await page.route('**/api/projects/', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
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
        ]),
      })
    })

    await page.route('**/api/master/conductors*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          table: 'conductors',
          total: 4,
          items: [
            { code: 1, description: '3/4/2.74 mm (UD-2.74)', lookup_table: 'UD-2.74', needs_confirmation: false },
            { code: 2, description: '70+16+N50 bundled', lookup_table: 'UQ', needs_confirmation: true, confirmation_note: 'Confirm everyday tension limit' },
            { code: 3, description: 'Racoon ACSR 7/4.09', lookup_table: 'Racoon', needs_confirmation: false },
            { code: 4, description: 'Weasel ACSR 7/2.59', lookup_table: 'Weasel', needs_confirmation: false },
          ],
        }),
      })
    })

    const viewports = [
      { name: '1440px', width: 1440, height: 900 },
      { name: '390px', width: 390, height: 844 },
    ]

    const themes = ['light', 'dark']

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height })

      for (const theme of themes) {
        // --- Dashboard Screenshot ---
        await page.goto(`http://localhost:${PORT}/dashboard`, { waitUntil: 'networkidle' })
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

        await page.waitForTimeout(400)
        const dashFile = `dashboard-${vp.name}-${theme}.png`
        await page.screenshot({
          path: path.join(outputDir, dashFile),
          fullPage: true,
        })
        console.log(`Captured: ${dashFile} (${vp.width}x${vp.height}, ${theme})`)

        // --- Project & Circuits Screenshot ---
        await page.goto(`http://localhost:${PORT}/project-circuits`, { waitUntil: 'networkidle' })
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

        await page.waitForTimeout(400)
        const projFile = `project-circuits-${vp.name}-${theme}.png`
        await page.screenshot({
          path: path.join(outputDir, projFile),
          fullPage: true,
        })
        console.log(`Captured: ${projFile} (${vp.width}x${vp.height}, ${theme})`)
      }
    }

    await browser.close()
    console.log('All 8 screenshots successfully captured!')
  } catch (err) {
    console.error('Screenshot capture failed:', err)
  } finally {
    server.close()
  }
})
