/**
 * Certificate flow — API-level check that certificate endpoint responds correctly.
 * Auth via storageState (global-setup.ts) for the page test.
 */
import { test, expect } from '@playwright/test';

test.describe('Certificate API', () => {
  test('unauthenticated request is rejected', async ({ request }) => {
    const res = await request.get('/api/v1/certificates');
    expect(res.status()).toBe(401);
  });

  test('authenticated user with no completion gets 404 or 200', async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: 'priya@spicegarden.com', password: 'demo123' },
    });
    const token = (await loginRes.json()).token;
    const res = await request.get('/api/v1/certificates', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([404, 200]).toContain(res.status());
  });
});

test.describe('Certificate page', () => {
  test.use({ storageState: 'tests/e2e/.auth/cashier.json' });

  test('certificate page renders without crash', async ({ page }) => {
    await page.goto('/certificate', { waitUntil: 'load', timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    await expect(page.locator('body')).not.toContainText('500', { timeout: 8_000 });
  });
});
