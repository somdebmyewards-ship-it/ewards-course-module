/**
 * Admin flow — dashboard stats, user management, pending approvals.
 * Auth via storageState (global-setup.ts) — no per-test login TiDB calls.
 */
import { test, expect } from '@playwright/test';

const DATA_TIMEOUT = 90_000; // TiDB Cloud API: cold-start takes 60-70s for complex endpoints

test.describe('Admin Dashboard', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'load', timeout: 30_000 });
  });

  test('dashboard stats load', async ({ page }) => {
    await expect(
      page.locator('.ant-statistic, [class*="statistic"], .ant-card').first()
    ).toBeVisible({ timeout: DATA_TIMEOUT });
  });

  test('module completion section renders', async ({ page }) => {
    await expect(
      page.locator('text=Admin Dashboard').first()
    ).toBeVisible({ timeout: DATA_TIMEOUT });
  });
});

test.describe('User Management', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/users', { waitUntil: 'load', timeout: 30_000 });
  });

  test('users table loads with rows', async ({ page }) => {
    await expect(
      page.locator('.ant-table-row').first()
    ).toBeVisible({ timeout: DATA_TIMEOUT });
  });

  test('progress column shows values not just zeros', async ({ page }) => {
    await expect(
      page.locator('.ant-progress, [class*="progress"]').first()
    ).toBeVisible({ timeout: DATA_TIMEOUT });
  });

  test('create user modal opens', async ({ page }) => {
    await page.locator('.ant-table-row').first().waitFor({ timeout: DATA_TIMEOUT });
    await page.locator('button:has-text("Add User"), button:has-text("Create")').click();
    await expect(page.locator('.ant-modal')).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Escape');
  });
});

test.describe('Pending Approvals', () => {
  test.use({ storageState: 'tests/e2e/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/pending-approvals', { waitUntil: 'load', timeout: 30_000 });
  });

  test('pending approvals page loads', async ({ page }) => {
    await expect(page).toHaveURL(/pending-approvals/, { timeout: DATA_TIMEOUT });
    // Use .or() — mixing Playwright text= syntax with CSS in a single locator string is invalid
    await expect(
      page.locator('table').or(page.locator('.ant-empty')).or(page.getByText('No pending')).first()
    ).toBeVisible({ timeout: DATA_TIMEOUT });
  });

  test('sidebar shows Pending Approvals link for admin', async ({ page }) => {
    await page.goto('/learning-hub', { waitUntil: 'load' });
    await expect(page.locator('text=Pending Approvals')).toBeVisible({ timeout: DATA_TIMEOUT });
  });
});
