/**
 * Playwright global setup — runs once before all tests.
 * Logs in each user type via API, injects token into localStorage,
 * and saves storageState so tests never call /api/v1/auth/login directly.
 * This cuts TiDB login calls from ~20 (one per beforeEach) to just 3.
 */
import { chromium, FullConfig } from '@playwright/test';

const USERS = {
  admin:   { email: 'admin@ewards.com',   password: 'admin123' },
  trainer: { email: 'trainer@ewards.com', password: 'trainer123' },
  cashier: { email: 'priya@spicegarden.com', password: 'demo123' },
};

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://127.0.0.1:8001';
  const browser = await chromium.launch();

  for (const [role, creds] of Object.entries(USERS)) {
    const context = await browser.newContext();
    const page = await context.newPage();

    const res = await page.request.post(`${baseURL}/api/v1/auth/login`, {
      data: creds,
      timeout: 30_000,
    });
    const body = await res.json();
    const token: string = body.token;
    const user: unknown = body.user;

    // Write token directly into localStorage — storageState captures this
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.evaluate(({ t, u }) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    }, { t: token, u: user });

    await context.storageState({ path: `tests/e2e/.auth/${role}.json` });
    await context.close();
  }

  await browser.close();
}

export default globalSetup;
