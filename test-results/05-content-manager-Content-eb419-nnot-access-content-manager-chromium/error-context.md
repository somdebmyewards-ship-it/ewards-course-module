# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-content-manager.spec.ts >> Content Manager — access control >> cashier cannot access content manager
- Location: tests/e2e/05-content-manager.spec.ts:39:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:8001/content-manager", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Content Manager — trainer/admin module management.
  3  |  * Auth via storageState (global-setup.ts) — no per-test login TiDB calls.
  4  |  */
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | const DATA_TIMEOUT = 90_000; // TiDB Cloud API: cold-start takes 60-70s for complex endpoints
  8  | 
  9  | test.describe('Content Manager', () => {
  10 |   test.use({ storageState: 'tests/e2e/.auth/trainer.json' });
  11 | 
  12 |   test.beforeEach(async ({ page }) => {
  13 |     await page.goto('/content-manager', { waitUntil: 'load', timeout: 30_000 });
  14 |     // ContentManager renders .ant-card (not table) — wait for first card
  15 |     await page.locator('.ant-card').first().waitFor({ state: 'visible', timeout: DATA_TIMEOUT });
  16 |   });
  17 | 
  18 |   test('module list loads', async ({ page }) => {
  19 |     await expect(
  20 |       page.locator('.ant-card').first()
  21 |     ).toBeVisible({ timeout: DATA_TIMEOUT });
  22 |   });
  23 | 
  24 |   test('create module button is present', async ({ page }) => {
  25 |     await expect(
  26 |       page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New Module")')
  27 |     ).toBeVisible({ timeout: DATA_TIMEOUT });
  28 |   });
  29 | 
  30 |   test('edit first module navigates to edit page', async ({ page }) => {
  31 |     await page.locator('button:has-text("Edit"), a:has-text("Edit")').first().click();
  32 |     await expect(page).toHaveURL(/content-manager\/\d+/, { timeout: DATA_TIMEOUT });
  33 |   });
  34 | });
  35 | 
  36 | test.describe('Content Manager — access control', () => {
  37 |   test.use({ storageState: 'tests/e2e/.auth/cashier.json' });
  38 | 
  39 |   test('cashier cannot access content manager', async ({ page }) => {
> 40 |     await page.goto('/content-manager', { waitUntil: 'load', timeout: 30_000 });
     |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  41 |     await expect(page).toHaveURL(/learning-hub/, { timeout: DATA_TIMEOUT });
  42 |   });
  43 | });
  44 | 
```