# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-auth.spec.ts >> Login page >> cashier login redirects to learning hub
- Location: tests/e2e/02-auth.spec.ts:38:3

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
  1  | import { Page } from '@playwright/test';
  2  | 
  3  | export const USERS = {
  4  |   admin:   { email: 'admin@ewards.com',   password: 'admin123',   role: 'ADMIN'   },
  5  |   trainer: { email: 'trainer@ewards.com', password: 'trainer123', role: 'TRAINER' },
  6  |   cashier: { email: 'priya@spicegarden.com', password: 'demo123', role: 'CASHIER' },
  7  | };
  8  | 
  9  | /**
  10 |  * API-based login: bypasses the UI form entirely.
  11 |  * Injects token + user into localStorage before React boots so AuthContext
  12 |  * picks it up immediately without a second round-trip for /me.
  13 |  * Much more reliable than UI form-fill against a remote TiDB Cloud DB.
  14 |  */
  15 | export async function login(page: Page, user: { email: string; password: string }) {
  16 |   // Step 1: get token via API (bypasses UI form — reliable against slow remote DB)
> 17 |   const res = await page.request.post('/api/v1/auth/login', {
     |                                  ^ TimeoutError: apiRequestContext.post: Timeout 60000ms exceeded.
  18 |     data: { email: user.email, password: user.password },
  19 |     timeout: 60_000, // TiDB Cloud: up to 15s on cold; 60s gives headroom for server queue
  20 |   });
  21 |   const body = await res.json();
  22 | 
  23 |   // Step 2: inject token+user into localStorage BEFORE React boots on next navigation
  24 |   await page.addInitScript(({ t, u }) => {
  25 |     localStorage.setItem('token', t);
  26 |     localStorage.setItem('user', JSON.stringify(u));
  27 |   }, { t: body.token, u: body.user });
  28 | 
  29 |   // Step 3: intercept /me response before goto so we can drain it afterward
  30 |   // (PHP artisan serve has 1 worker — undrained /me blocks next test's API call)
  31 |   const meResponse = page.waitForResponse(
  32 |     r => r.url().endsWith('/api/v1/me'),
  33 |     { timeout: 60_000 },
  34 |   ).catch(() => {});
  35 | 
  36 |   // Navigate to /login — AuthContext fires /me in background, then auto-redirects
  37 |   await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  38 | 
  39 |   // Step 4: redirect fires immediately (cached user in localStorage, loading=false)
  40 |   await page.waitForURL(/learning-hub/, { timeout: 45_000 });
  41 | 
  42 |   // Drain /me so PHP worker is free before the next test makes its first API call
  43 |   await meResponse;
  44 | }
  45 | 
  46 | /**
  47 |  * Direct login: injects auth into localStorage then navigates straight to targetUrl.
  48 |  * Saves ~15-20s vs login() by skipping the /login → /learning-hub redirect round-trip.
  49 |  * Use this in beforeEach blocks where the target page is NOT /learning-hub.
  50 |  */
  51 | export async function loginDirect(
  52 |   page: Page,
  53 |   user: { email: string; password: string },
  54 |   targetUrl: string,
  55 | ) {
  56 |   const res = await page.request.post('/api/v1/auth/login', {
  57 |     data: { email: user.email, password: user.password },
  58 |     timeout: 30_000,
  59 |   });
  60 |   const body = await res.json();
  61 | 
  62 |   await page.addInitScript(({ t, u }) => {
  63 |     localStorage.setItem('token', t);
  64 |     localStorage.setItem('user', JSON.stringify(u));
  65 |   }, { t: body.token, u: body.user });
  66 | 
  67 |   // Use 'load' not 'networkidle' — TiDB API calls can keep connections open
  68 |   // beyond 60s, causing networkidle to time out. Tests do their own data waits.
  69 |   await page.goto(targetUrl, { waitUntil: 'load', timeout: 60_000 });
  70 | }
  71 | 
  72 | export async function logout(page: Page) {
  73 |   // Click avatar in sidebar bottom
  74 |   await page.locator('.ant-dropdown-trigger, [class*="UserOutlined"]').first().click();
  75 |   await page.getByText('Logout').click();
  76 |   await page.waitForURL(/login/, { timeout: 5_000 });
  77 | }
  78 | 
  79 | export async function seedViaArtisan(command: string): Promise<void> {
  80 |   const { execSync } = await import('child_process');
  81 |   const cwd = process.cwd();
  82 |   execSync(`php artisan ${command}`, { cwd, stdio: 'inherit' });
  83 | }
  84 | 
```