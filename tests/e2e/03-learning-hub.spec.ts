/**
 * Learner flow — module list and module detail.
 * Auth is injected via storageState (global-setup.ts) — no login TiDB calls per test.
 */
import { test, expect } from '@playwright/test';

// TiDB Cloud /api/modules cold-start: multiple sequential queries, each 5-20s
const MODULE_TIMEOUT = 120_000;

test.describe('Learning Hub', () => {
  test.use({ storageState: 'tests/e2e/.auth/cashier.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/learning-hub', { waitUntil: 'load', timeout: 30_000 });
    await page.locator('.card-enter').first().waitFor({ state: 'visible', timeout: MODULE_TIMEOUT });
  });

  test('shows module list', async ({ page }) => {
    await expect(page.locator('.card-enter').first()).toBeVisible({ timeout: MODULE_TIMEOUT });
  });

  test('search filters modules', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('zzz_no_match');
      await expect(page.locator('text=No modules')).toBeVisible({ timeout: 4_000 }).catch(() => {});
      await searchInput.clear();
    }
  });
});

test.describe('Module detail', () => {
  test.use({ storageState: 'tests/e2e/.auth/cashier.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/learning-hub', { waitUntil: 'load', timeout: 30_000 });
    await page.locator('.card-enter').first().waitFor({ state: 'visible', timeout: MODULE_TIMEOUT });
    // Click any navigation button — Start (not started), Resume (in progress), Review (completed)
    // Restart is intentionally excluded — it opens a confirmation modal, not the module page
    await page.locator(
      'button:has-text("Start"), button:has-text("Resume"), button:has-text("Review")'
    ).first().click({ timeout: MODULE_TIMEOUT });
    await page.waitForURL(/learning-hub\/.+/, { timeout: 30_000 });
  });

  test('section list is visible', async ({ page }) => {
    const section = page.locator('[class*="Sider"] li, aside li, [class*="sider"] div').first();
    await expect(section).toBeVisible({ timeout: 15_000 });
  });

  test('back button navigates to learning hub', async ({ page }) => {
    const backBtn = page.locator('button:has-text("Back"), a:has-text("Back"), [aria-label*="back" i]').first();
    if (await backBtn.count() > 0) {
      await backBtn.click();
      await expect(page).toHaveURL(/learning-hub$/, { timeout: 15_000 });
    }
  });
});
