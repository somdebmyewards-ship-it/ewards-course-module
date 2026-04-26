import { test } from '@playwright/test';

const BASE = 'http://127.0.0.1:8001';

async function loginAs(page: any, email: string, password: string) {
  const res = await page.request.post(`${BASE}/api/v1/auth/login`, {
    data: { email, password }, timeout: 60_000,
  });
  const { token, user } = await res.json();
  await page.addInitScript(({ t, u }: any) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, { t: token, u: user });
}

test('01 login page', async ({ page }) => {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-01-login.png', fullPage: true });
});

test('02 learning hub', async ({ page }) => {
  await loginAs(page, 'priya@spicegarden.com', 'demo123');
  await page.goto(`${BASE}/learning-hub`, { waitUntil: 'load', timeout: 60_000 });
  // Wait for module cards to appear (not skeleton)
  await page.waitForSelector('.ant-card-body h3, .ant-card-body .ant-typography', { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-02-learning-hub.png', fullPage: true });
});

test('03 module detail', async ({ page }) => {
  await loginAs(page, 'priya@spicegarden.com', 'demo123');
  await page.goto(`${BASE}/learning-hub`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('.ant-card-body h3, .ant-card-body .ant-typography', { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(1000);
  const firstCard = page.locator('.ant-card').first();
  if (await firstCard.isVisible()) {
    await firstCard.click();
    await page.waitForTimeout(8000);
  }
  await page.screenshot({ path: 'tests/e2e/reports/ss-03-module-detail.png', fullPage: true });
});

test('04 my progress', async ({ page }) => {
  await loginAs(page, 'priya@spicegarden.com', 'demo123');
  await page.goto(`${BASE}/my-progress`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('.ant-statistic-content-value, .ant-progress', { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-04-my-progress.png', fullPage: true });
});

test('05 profile page', async ({ page }) => {
  await loginAs(page, 'priya@spicegarden.com', 'demo123');
  await page.goto(`${BASE}/profile`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('input[placeholder="Your full name"]', { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-05-profile.png', fullPage: true });
});

test('06 admin dashboard', async ({ page }) => {
  await loginAs(page, 'admin@ewards.com', 'admin123');
  await page.goto(`${BASE}/admin`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('.ant-statistic-content-value, .ant-table-tbody tr', { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-06-admin.png', fullPage: true });
});

test('07 users page', async ({ page }) => {
  await loginAs(page, 'admin@ewards.com', 'admin123');
  await page.goto(`${BASE}/users`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('.ant-table-tbody tr', { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-07-users.png', fullPage: true });
});

test('08 content manager', async ({ page }) => {
  await loginAs(page, 'admin@ewards.com', 'admin123');
  await page.goto(`${BASE}/content-manager`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('.ant-table-tbody tr, .ant-card', { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-08-content-manager.png', fullPage: true });
});

test('09 leaderboard (my-progress scroll)', async ({ page }) => {
  await loginAs(page, 'admin@ewards.com', 'admin123');
  await page.goto(`${BASE}/my-progress`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('.ant-statistic-content-value, .ant-table-tbody tr', { timeout: 45_000 }).catch(() => {});
  await page.waitForTimeout(4000);
  // Scroll to bottom to show leaderboard
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-09-leaderboard.png', fullPage: true });
});
