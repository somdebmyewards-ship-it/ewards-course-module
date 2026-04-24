/**
 * Content Manager — trainer/admin module management.
 * Auth via storageState (global-setup.ts) — no per-test login TiDB calls.
 */
import { test, expect } from '@playwright/test';

const DATA_TIMEOUT = 90_000; // TiDB Cloud API: cold-start takes 60-70s for complex endpoints

test.describe('Content Manager', () => {
  test.use({ storageState: 'tests/e2e/.auth/trainer.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/content-manager', { waitUntil: 'load', timeout: 30_000 });
    await page.locator('.ant-table-row').first().waitFor({ timeout: DATA_TIMEOUT });
  });

  test('module list loads', async ({ page }) => {
    await expect(
      page.locator('.ant-table-row').first()
    ).toBeVisible({ timeout: DATA_TIMEOUT });
  });

  test('create module button is present', async ({ page }) => {
    await expect(
      page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New Module")')
    ).toBeVisible({ timeout: DATA_TIMEOUT });
  });

  test('edit first module navigates to edit page', async ({ page }) => {
    await page.locator('button:has-text("Edit"), a:has-text("Edit")').first().click();
    await expect(page).toHaveURL(/content-manager\/\d+/, { timeout: DATA_TIMEOUT });
  });
});

test.describe('Content Manager — access control', () => {
  test.use({ storageState: 'tests/e2e/.auth/cashier.json' });

  test('cashier cannot access content manager', async ({ page }) => {
    await page.goto('/content-manager', { waitUntil: 'load', timeout: 30_000 });
    await expect(page).toHaveURL(/learning-hub/, { timeout: DATA_TIMEOUT });
  });
});
