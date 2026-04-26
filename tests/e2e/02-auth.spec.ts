/**
 * Authentication flow — login, logout, protected routes, role gates.
 *
 * Tests 1-4 use login() helper (API call) to test the actual login flow.
 * Tests 5-9 use storageState (pre-saved tokens) to avoid triggering
 * background /me calls via login() — which causes PHP worker pile-up
 * when php artisan serve only has 1 worker and TiDB cold-starts take 60s.
 */
import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

// TiDB Cloud /me API call on role-check can take 25-55s — allow generous headroom
const NAV_TIMEOUT = 60_000;

test.describe('Login page', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/eWards/i);
    await expect(page.locator('input[placeholder="you@ewards.in"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('rejects wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="you@ewards.in"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // TiDB Cloud API: 4–5s round-trip; message must appear within that window + headroom
    await expect(page.locator('.ant-message-error, .ant-message-notice-content').first()).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/login/);
  });

  test('admin login redirects to learning hub', async ({ page }) => {
    await login(page, USERS.admin);
    await expect(page).toHaveURL(/learning-hub/);
  });

  test('cashier login redirects to learning hub', async ({ page }) => {
    await login(page, USERS.cashier);
    await expect(page).toHaveURL(/learning-hub/);
  });

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/learning-hub');
    // React /me API call (~4-5s on TiDB Cloud) fires before redirect; needs explicit timeout
    await expect(page).toHaveURL(/login/, { timeout: 30_000 });
  });
});

// Already-logged-in redirect — uses pre-saved storageState (no login API call at test time)
// Avoids triggering another background /me that would block PHP worker for next suite.
test.describe('Login redirect — already authenticated', () => {
  test.use({ storageState: 'tests/e2e/.auth/cashier.json' });

  test('already logged-in user is redirected away from /login', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // Cached user in localStorage → React immediately redirects (no /me needed)
    await expect(page).toHaveURL(/learning-hub/, { timeout: NAV_TIMEOUT });
  });
});

test.describe('Role-based access', () => {
  test.describe('cashier role restrictions', () => {
    test.use({ storageState: 'tests/e2e/.auth/cashier.json' });

    test('cashier cannot access /users (admin only)', async ({ page }) => {
      await page.goto('/users', { waitUntil: 'load', timeout: 30_000 });
      // PrivateRoute evaluates role from cached user (no /me wait) before redirecting
      await expect(page).toHaveURL(/learning-hub/, { timeout: NAV_TIMEOUT });
    });

    test('cashier cannot access /admin', async ({ page }) => {
      await page.goto('/admin', { waitUntil: 'load', timeout: 30_000 });
      await expect(page).toHaveURL(/learning-hub/, { timeout: NAV_TIMEOUT });
    });
  });

  test.describe('admin role access', () => {
    test.use({ storageState: 'tests/e2e/.auth/admin.json' });

    test('admin can access /users', async ({ page }) => {
      await page.goto('/users', { waitUntil: 'load', timeout: 30_000 });
      await expect(page).toHaveURL(/users/);
      await expect(page.locator('table')).toBeVisible({ timeout: 20_000 });
    });
  });
});
