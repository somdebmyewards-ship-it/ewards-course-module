# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: screenshot.spec.ts >> 03 module detail
- Location: tests/e2e/screenshot.spec.ts:31:1

# Error details

```
TimeoutError: apiRequestContext.post: Timeout 60000ms exceeded.
Call log:
  - → POST http://127.0.0.1:8001/api/v1/auth/login
    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.7727.15 Safari/537.36
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 54

```

# Test source

```ts
  1  | import { test } from '@playwright/test';
  2  | 
  3  | const BASE = 'http://127.0.0.1:8001';
  4  | 
  5  | async function loginAs(page: any, email: string, password: string) {
> 6  |   const res = await page.request.post(`${BASE}/api/v1/auth/login`, {
     |                                  ^ TimeoutError: apiRequestContext.post: Timeout 60000ms exceeded.
  7  |     data: { email, password }, timeout: 60_000,
  8  |   });
  9  |   const { token, user } = await res.json();
  10 |   await page.addInitScript(({ t, u }: any) => {
  11 |     localStorage.setItem('token', t);
  12 |     localStorage.setItem('user', JSON.stringify(u));
  13 |   }, { t: token, u: user });
  14 | }
  15 | 
  16 | test('01 login page', async ({ page }) => {
  17 |   await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  18 |   await page.waitForTimeout(1000);
  19 |   await page.screenshot({ path: 'tests/e2e/reports/ss-01-login.png', fullPage: true });
  20 | });
  21 | 
  22 | test('02 learning hub', async ({ page }) => {
  23 |   await loginAs(page, 'priya@spicegarden.com', 'demo123');
  24 |   await page.goto(`${BASE}/learning-hub`, { waitUntil: 'load', timeout: 60_000 });
  25 |   // Wait for module cards to appear (not skeleton)
  26 |   await page.waitForSelector('.ant-card-body h3, .ant-card-body .ant-typography', { timeout: 45_000 }).catch(() => {});
  27 |   await page.waitForTimeout(2000);
  28 |   await page.screenshot({ path: 'tests/e2e/reports/ss-02-learning-hub.png', fullPage: true });
  29 | });
  30 | 
  31 | test('03 module detail', async ({ page }) => {
  32 |   await loginAs(page, 'priya@spicegarden.com', 'demo123');
  33 |   await page.goto(`${BASE}/learning-hub`, { waitUntil: 'load', timeout: 60_000 });
  34 |   await page.waitForSelector('.ant-card-body h3, .ant-card-body .ant-typography', { timeout: 45_000 }).catch(() => {});
  35 |   await page.waitForTimeout(1000);
  36 |   const firstCard = page.locator('.ant-card').first();
  37 |   if (await firstCard.isVisible()) {
  38 |     await firstCard.click();
  39 |     await page.waitForTimeout(8000);
  40 |   }
  41 |   await page.screenshot({ path: 'tests/e2e/reports/ss-03-module-detail.png', fullPage: true });
  42 | });
  43 | 
  44 | test('04 my progress', async ({ page }) => {
  45 |   await loginAs(page, 'priya@spicegarden.com', 'demo123');
  46 |   await page.goto(`${BASE}/my-progress`, { waitUntil: 'load', timeout: 60_000 });
  47 |   await page.waitForSelector('.ant-statistic-content-value, .ant-progress', { timeout: 45_000 }).catch(() => {});
  48 |   await page.waitForTimeout(3000);
  49 |   await page.screenshot({ path: 'tests/e2e/reports/ss-04-my-progress.png', fullPage: true });
  50 | });
  51 | 
  52 | test('05 profile page', async ({ page }) => {
  53 |   await loginAs(page, 'priya@spicegarden.com', 'demo123');
  54 |   await page.goto(`${BASE}/profile`, { waitUntil: 'load', timeout: 60_000 });
  55 |   await page.waitForSelector('input[placeholder="Your full name"]', { timeout: 30_000 }).catch(() => {});
  56 |   await page.waitForTimeout(3000);
  57 |   await page.screenshot({ path: 'tests/e2e/reports/ss-05-profile.png', fullPage: true });
  58 | });
  59 | 
  60 | test('06 admin dashboard', async ({ page }) => {
  61 |   await loginAs(page, 'admin@ewards.com', 'admin123');
  62 |   await page.goto(`${BASE}/admin`, { waitUntil: 'load', timeout: 60_000 });
  63 |   await page.waitForSelector('.ant-statistic-content-value, .ant-table-tbody tr', { timeout: 45_000 }).catch(() => {});
  64 |   await page.waitForTimeout(3000);
  65 |   await page.screenshot({ path: 'tests/e2e/reports/ss-06-admin.png', fullPage: true });
  66 | });
  67 | 
  68 | test('07 users page', async ({ page }) => {
  69 |   await loginAs(page, 'admin@ewards.com', 'admin123');
  70 |   await page.goto(`${BASE}/users`, { waitUntil: 'load', timeout: 60_000 });
  71 |   await page.waitForSelector('.ant-table-tbody tr', { timeout: 45_000 }).catch(() => {});
  72 |   await page.waitForTimeout(2000);
  73 |   await page.screenshot({ path: 'tests/e2e/reports/ss-07-users.png', fullPage: true });
  74 | });
  75 | 
  76 | test('08 content manager', async ({ page }) => {
  77 |   await loginAs(page, 'admin@ewards.com', 'admin123');
  78 |   await page.goto(`${BASE}/content-manager`, { waitUntil: 'load', timeout: 60_000 });
  79 |   await page.waitForSelector('.ant-table-tbody tr, .ant-card', { timeout: 45_000 }).catch(() => {});
  80 |   await page.waitForTimeout(2000);
  81 |   await page.screenshot({ path: 'tests/e2e/reports/ss-08-content-manager.png', fullPage: true });
  82 | });
  83 | 
  84 | test('09 leaderboard (my-progress scroll)', async ({ page }) => {
  85 |   await loginAs(page, 'admin@ewards.com', 'admin123');
  86 |   await page.goto(`${BASE}/my-progress`, { waitUntil: 'load', timeout: 60_000 });
  87 |   await page.waitForSelector('.ant-statistic-content-value, .ant-table-tbody tr', { timeout: 45_000 }).catch(() => {});
  88 |   await page.waitForTimeout(4000);
  89 |   // Scroll to bottom to show leaderboard
  90 |   await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  91 |   await page.waitForTimeout(3000);
  92 |   await page.screenshot({ path: 'tests/e2e/reports/ss-09-leaderboard.png', fullPage: true });
  93 | });
  94 | 
```