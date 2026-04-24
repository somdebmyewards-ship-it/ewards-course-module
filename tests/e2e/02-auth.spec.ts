/**
 * Authentication flow — login, logout, protected routes, role gates.
 */
import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

// TiDB Cloud /me API call takes ~4-5s on every page load — use 15s for post-navigation checks
const NAV_TIMEOUT = 15_000;

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

  test('already logged-in user is redirected away from /login', async ({ page }) => {
    await login(page, USERS.cashier);
    await page.goto('/login');
    // AuthContext makes /me API call (~4-5s on TiDB Cloud) before redirect fires
    await expect(page).toHaveURL(/learning-hub/, { timeout: NAV_TIMEOUT });
  });

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/learning-hub');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Role-based access', () => {
  test('cashier cannot access /users (admin only)', async ({ page }) => {
    await login(page, USERS.cashier);
    await page.goto('/users');
    // PrivateRoute waits for /me API call before evaluating role → 15s timeout
    await expect(page).toHaveURL(/learning-hub/, { timeout: NAV_TIMEOUT });
  });

  test('cashier cannot access /admin', async ({ page }) => {
    await login(page, USERS.cashier);
    await page.goto('/admin');
    await expect(page).toHaveURL(/learning-hub/, { timeout: NAV_TIMEOUT });
  });

  test('admin can access /users', async ({ page }) => {
    await login(page, USERS.admin);
    await page.goto('/users');
    await expect(page).toHaveURL(/users/);
    await expect(page.locator('table')).toBeVisible({ timeout: 20_000 });
  });
});
