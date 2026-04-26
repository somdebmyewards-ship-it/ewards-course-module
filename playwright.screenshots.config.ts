import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['screenshot.spec.ts'],
  timeout: 120_000,
  retries: 0,
  workers: 1,

  use: {
    baseURL: process.env.APP_URL || 'http://127.0.0.1:8001',
    headless: true,
    screenshot: 'on',
    navigationTimeout: 60_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  reporter: [['list']],
});
