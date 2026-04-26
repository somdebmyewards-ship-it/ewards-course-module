import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup',
  timeout: 300_000, // Suite 03 beforeEach (120s cold-start) + test body; needs 300s total budget
  retries: 1,
  workers: 1, // TiDB Cloud remote DB — serialise tests to avoid connection contention

  use: {
    baseURL: process.env.APP_URL || 'http://127.0.0.1:8001',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    navigationTimeout: 45_000, // TiDB Cloud API calls take 4–5s; generous headroom
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/e2e/reports' }]],
});
