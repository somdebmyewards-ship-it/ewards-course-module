# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-admin.spec.ts >> User Management >> progress column shows values not just zeros
- Location: tests/e2e/04-admin.spec.ts:42:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:8001/users", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Admin flow — dashboard stats, user management, pending approvals.
  3  |  * Auth via storageState (global-setup.ts) — no per-test login TiDB calls.
  4  |  */
  5  | import { test, expect } from '@playwright/test';
  6  | 
  7  | const DATA_TIMEOUT = 90_000; // TiDB Cloud API: cold-start takes 60-70s for complex endpoints
  8  | 
  9  | test.describe('Admin Dashboard', () => {
  10 |   test.use({ storageState: 'tests/e2e/.auth/admin.json' });
  11 | 
  12 |   test.beforeEach(async ({ page }) => {
  13 |     await page.goto('/admin', { waitUntil: 'load', timeout: 30_000 });
  14 |   });
  15 | 
  16 |   test('dashboard stats load', async ({ page }) => {
  17 |     await expect(
  18 |       page.locator('.ant-statistic, [class*="statistic"], .ant-card').first()
  19 |     ).toBeVisible({ timeout: DATA_TIMEOUT });
  20 |   });
  21 | 
  22 |   test('module completion section renders', async ({ page }) => {
  23 |     await expect(
  24 |       page.locator('text=Admin Dashboard').first()
  25 |     ).toBeVisible({ timeout: DATA_TIMEOUT });
  26 |   });
  27 | });
  28 | 
  29 | test.describe('User Management', () => {
  30 |   test.use({ storageState: 'tests/e2e/.auth/admin.json' });
  31 | 
  32 |   test.beforeEach(async ({ page }) => {
> 33 |     await page.goto('/users', { waitUntil: 'load', timeout: 30_000 });
     |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  34 |   });
  35 | 
  36 |   test('users table loads with rows', async ({ page }) => {
  37 |     await expect(
  38 |       page.locator('.ant-table-row').first()
  39 |     ).toBeVisible({ timeout: DATA_TIMEOUT });
  40 |   });
  41 | 
  42 |   test('progress column shows values not just zeros', async ({ page }) => {
  43 |     await expect(
  44 |       page.locator('.ant-progress, [class*="progress"]').first()
  45 |     ).toBeVisible({ timeout: DATA_TIMEOUT });
  46 |   });
  47 | 
  48 |   test('create user modal opens', async ({ page }) => {
  49 |     await page.locator('.ant-table-row').first().waitFor({ timeout: DATA_TIMEOUT });
  50 |     await page.locator('button:has-text("Add User"), button:has-text("Create")').click();
  51 |     await expect(page.locator('.ant-modal')).toBeVisible({ timeout: 5_000 });
  52 |     await page.keyboard.press('Escape');
  53 |   });
  54 | });
  55 | 
  56 | test.describe('Pending Approvals', () => {
  57 |   test.use({ storageState: 'tests/e2e/.auth/admin.json' });
  58 | 
  59 |   test.beforeEach(async ({ page }) => {
  60 |     await page.goto('/pending-approvals', { waitUntil: 'load', timeout: 30_000 });
  61 |   });
  62 | 
  63 |   test('pending approvals page loads', async ({ page }) => {
  64 |     await expect(page).toHaveURL(/pending-approvals/, { timeout: DATA_TIMEOUT });
  65 |     // Use .or() — mixing Playwright text= syntax with CSS in a single locator string is invalid
  66 |     await expect(
  67 |       page.locator('table').or(page.locator('.ant-empty')).or(page.getByText('No pending')).first()
  68 |     ).toBeVisible({ timeout: DATA_TIMEOUT });
  69 |   });
  70 | 
  71 |   test('sidebar shows Pending Approvals link for admin', async ({ page }) => {
  72 |     await page.goto('/learning-hub', { waitUntil: 'load' });
  73 |     await expect(page.locator('text=Pending Approvals')).toBeVisible({ timeout: DATA_TIMEOUT });
  74 |   });
  75 | });
  76 | 
```