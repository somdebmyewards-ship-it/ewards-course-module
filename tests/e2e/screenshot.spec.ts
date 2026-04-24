import { test } from '@playwright/test';

const BASE = 'http://127.0.0.1:8001';

async function loginAs(page: any, email: string, password: string) {
  const res = await page.request.post(`${BASE}/api/v1/auth/login`, {
    data: { email, password }, timeout: 30_000,
  });
  const { token, user } = await res.json();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.evaluate(({ t, u }: any) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, { t: token, u: user });
}

test('01 landing page (unauthenticated)', async ({ page }) => {
  await page.goto(BASE, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.screenshot({ path: 'tests/e2e/reports/ss-01-landing.png', fullPage: true });
});

test('02 learning hub with stats', async ({ page }) => {
  await loginAs(page, 'priya@spicegarden.com', 'demo123');
  await page.goto(`${BASE}/learning-hub`, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-02-learning-hub.png', fullPage: true });
});

test('03 admin dashboard', async ({ page }) => {
  await loginAs(page, 'admin@ewards.com', 'admin123');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-03-admin-dashboard.png', fullPage: true });
});

test('04 my progress page', async ({ page }) => {
  await loginAs(page, 'priya@spicegarden.com', 'demo123');
  await page.goto(`${BASE}/my-progress`, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-04-my-progress.png', fullPage: true });
});
