# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-learning-hub.spec.ts >> Learning Hub >> shows module list
- Location: tests/e2e/03-learning-hub.spec.ts:18:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:8001/learning-hub", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Learner flow — module list and module detail.
  3  |  * Auth is injected via storageState (global-setup.ts) — no login TiDB calls per test.
  4  |  */
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | // TiDB Cloud /api/modules cold-start: multiple sequential queries, each 5-20s
  8  | const MODULE_TIMEOUT = 120_000;
  9  | 
  10 | test.describe('Learning Hub', () => {
  11 |   test.use({ storageState: 'tests/e2e/.auth/cashier.json' });
  12 | 
  13 |   test.beforeEach(async ({ page }) => {
> 14 |     await page.goto('/learning-hub', { waitUntil: 'load', timeout: 30_000 });
     |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  15 |     await page.locator('.card-enter').first().waitFor({ state: 'visible', timeout: MODULE_TIMEOUT });
  16 |   });
  17 | 
  18 |   test('shows module list', async ({ page }) => {
  19 |     await expect(page.locator('.card-enter').first()).toBeVisible({ timeout: MODULE_TIMEOUT });
  20 |   });
  21 | 
  22 |   test('search filters modules', async ({ page }) => {
  23 |     const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i]');
  24 |     if (await searchInput.count() > 0) {
  25 |       await searchInput.fill('zzz_no_match');
  26 |       await expect(page.locator('text=No modules')).toBeVisible({ timeout: 4_000 }).catch(() => {});
  27 |       await searchInput.clear();
  28 |     }
  29 |   });
  30 | });
  31 | 
  32 | test.describe('Module detail', () => {
  33 |   test.use({ storageState: 'tests/e2e/.auth/cashier.json' });
  34 | 
  35 |   test.beforeEach(async ({ page }) => {
  36 |     await page.goto('/learning-hub', { waitUntil: 'load', timeout: 30_000 });
  37 |     await page.locator('.card-enter').first().waitFor({ state: 'visible', timeout: MODULE_TIMEOUT });
  38 |     // Click any navigation button — Start (not started), Resume (in progress), Review (completed)
  39 |     // Restart is intentionally excluded — it opens a confirmation modal, not the module page
  40 |     await page.locator(
  41 |       'button:has-text("Start"), button:has-text("Resume"), button:has-text("Review")'
  42 |     ).first().click({ timeout: MODULE_TIMEOUT });
  43 |     await page.waitForURL(/learning-hub\/.+/, { timeout: 30_000 });
  44 |   });
  45 | 
  46 |   test('section list is visible', async ({ page }) => {
  47 |     const section = page.locator('[class*="Sider"] li, aside li, [class*="sider"] div').first();
  48 |     await expect(section).toBeVisible({ timeout: 15_000 });
  49 |   });
  50 | 
  51 |   test('back button navigates to learning hub', async ({ page }) => {
  52 |     const backBtn = page.locator('button:has-text("Back"), a:has-text("Back"), [aria-label*="back" i]').first();
  53 |     if (await backBtn.count() > 0) {
  54 |       await backBtn.click();
  55 |       await expect(page).toHaveURL(/learning-hub$/, { timeout: 15_000 });
  56 |     }
  57 |   });
  58 | });
  59 | 
```