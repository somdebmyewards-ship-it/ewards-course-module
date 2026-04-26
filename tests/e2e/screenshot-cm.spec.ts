import { test } from '@playwright/test';

const BASE = 'http://127.0.0.1:8001';

async function loginAs(page: any, email: string, password: string) {
  const res = await page.request.post(`${BASE}/api/v1/auth/login`, {
    data: { email, password }, timeout: 30_000,
  });
  const { token, user } = await res.json();
  await page.addInitScript(({ t, u }: any) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, { t: token, u: user });
}

test('08 content manager', async ({ page }) => {
  await loginAs(page, 'admin@ewards.com', 'admin123');
  await page.goto(`${BASE}/content-manager`, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'tests/e2e/reports/ss-08-content-manager.png', fullPage: true });
});
