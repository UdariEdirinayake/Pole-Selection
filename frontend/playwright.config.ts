import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    channel: 'msedge',
    trace: 'off',
  },
  projects: [
    {
      name: 'msedge',
      use: {
        channel: 'msedge',
      },
    },
  ],
  webServer: {
    command: 'npm.cmd run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 60000,
  },
})
