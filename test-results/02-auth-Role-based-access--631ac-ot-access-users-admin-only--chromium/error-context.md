# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-auth.spec.ts >> Role-based access >> cashier role restrictions >> cashier cannot access /users (admin only)
- Location: tests/e2e/02-auth.spec.ts:66:5

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:8001/users", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - img "eWards" [ref=e8]
        - generic [ref=e9]: Learning Hub
      - generic [ref=e11]:
        - generic [ref=e12]: LEARNING
        - generic [ref=e13] [cursor=pointer]:
          - img "appstore" [ref=e15]:
            - img [ref=e16]
          - generic [ref=e18]: Learning Hub
        - generic [ref=e19] [cursor=pointer]:
          - img "check-circle" [ref=e21]:
            - img [ref=e22]
          - generic [ref=e25]: My Progress
        - generic [ref=e26] [cursor=pointer]:
          - img "bulb" [ref=e28]:
            - img [ref=e29]
          - generic [ref=e31]: Key Takeaways
        - generic [ref=e32] [cursor=pointer]:
          - img "star" [ref=e34]:
            - img [ref=e35]
          - generic [ref=e37]: Bookmarks
        - generic [ref=e38] [cursor=pointer]:
          - img "trophy" [ref=e40]:
            - img [ref=e41]
          - generic [ref=e43]: Certificate
      - generic [ref=e45] [cursor=pointer]:
        - img "user" [ref=e47]:
          - img [ref=e48]
        - generic [ref=e50]:
          - generic [ref=e51]: Priya Sharma
          - generic [ref=e52]: User
          - generic [ref=e53]: Specialist
        - img "logout" [ref=e54]:
          - img [ref=e55]
  - generic [ref=e57]:
    - generic [ref=e58]:
      - button "menu-fold" [ref=e59] [cursor=pointer]:
        - img "menu-fold" [ref=e60]:
          - img [ref=e61]
      - generic [ref=e64]: User Management
      - generic [ref=e65]:
        - generic [ref=e66]: Specialist
        - generic [ref=e67] [cursor=pointer]:
          - img "user" [ref=e69]:
            - img [ref=e70]
          - generic [ref=e72]:
            - generic [ref=e73]: Priya
            - generic [ref=e74]: User
    - main [ref=e75]
  - generic [ref=e76] [cursor=pointer]:
    - generic [ref=e78]: E
    - generic: Ask Ela
```

# Test source

```ts
  1  | /**
  2  |  * Authentication flow — login, logout, protected routes, role gates.
  3  |  *
  4  |  * Tests 1-4 use login() helper (API call) to test the actual login flow.
  5  |  * Tests 5-9 use storageState (pre-saved tokens) to avoid triggering
  6  |  * background /me calls via login() — which causes PHP worker pile-up
  7  |  * when php artisan serve only has 1 worker and TiDB cold-starts take 60s.
  8  |  */
  9  | import { test, expect } from '@playwright/test';
  10 | import { login, USERS } from './helpers';
  11 | 
  12 | // TiDB Cloud /me API call on role-check can take 25-55s — allow generous headroom
  13 | const NAV_TIMEOUT = 60_000;
  14 | 
  15 | test.describe('Login page', () => {
  16 |   test('shows login form', async ({ page }) => {
  17 |     await page.goto('/login');
  18 |     await expect(page).toHaveTitle(/eWards/i);
  19 |     await expect(page.locator('input[placeholder="you@ewards.in"]')).toBeVisible();
  20 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  21 |   });
  22 | 
  23 |   test('rejects wrong credentials', async ({ page }) => {
  24 |     await page.goto('/login');
  25 |     await page.fill('input[placeholder="you@ewards.in"]', 'wrong@email.com');
  26 |     await page.fill('input[type="password"]', 'wrongpassword');
  27 |     await page.click('button[type="submit"]');
  28 |     // TiDB Cloud API: 4–5s round-trip; message must appear within that window + headroom
  29 |     await expect(page.locator('.ant-message-error, .ant-message-notice-content').first()).toBeVisible({ timeout: 20_000 });
  30 |     await expect(page).toHaveURL(/login/);
  31 |   });
  32 | 
  33 |   test('admin login redirects to learning hub', async ({ page }) => {
  34 |     await login(page, USERS.admin);
  35 |     await expect(page).toHaveURL(/learning-hub/);
  36 |   });
  37 | 
  38 |   test('cashier login redirects to learning hub', async ({ page }) => {
  39 |     await login(page, USERS.cashier);
  40 |     await expect(page).toHaveURL(/learning-hub/);
  41 |   });
  42 | 
  43 |   test('protected route redirects unauthenticated user to login', async ({ page }) => {
  44 |     await page.goto('/learning-hub');
  45 |     // React /me API call (~4-5s on TiDB Cloud) fires before redirect; needs explicit timeout
  46 |     await expect(page).toHaveURL(/login/, { timeout: 30_000 });
  47 |   });
  48 | });
  49 | 
  50 | // Already-logged-in redirect — uses pre-saved storageState (no login API call at test time)
  51 | // Avoids triggering another background /me that would block PHP worker for next suite.
  52 | test.describe('Login redirect — already authenticated', () => {
  53 |   test.use({ storageState: 'tests/e2e/.auth/cashier.json' });
  54 | 
  55 |   test('already logged-in user is redirected away from /login', async ({ page }) => {
  56 |     await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30_000 });
  57 |     // Cached user in localStorage → React immediately redirects (no /me needed)
  58 |     await expect(page).toHaveURL(/learning-hub/, { timeout: NAV_TIMEOUT });
  59 |   });
  60 | });
  61 | 
  62 | test.describe('Role-based access', () => {
  63 |   test.describe('cashier role restrictions', () => {
  64 |     test.use({ storageState: 'tests/e2e/.auth/cashier.json' });
  65 | 
  66 |     test('cashier cannot access /users (admin only)', async ({ page }) => {
> 67 |       await page.goto('/users', { waitUntil: 'load', timeout: 30_000 });
     |                  ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  68 |       // PrivateRoute evaluates role from cached user (no /me wait) before redirecting
  69 |       await expect(page).toHaveURL(/learning-hub/, { timeout: NAV_TIMEOUT });
  70 |     });
  71 | 
  72 |     test('cashier cannot access /admin', async ({ page }) => {
  73 |       await page.goto('/admin', { waitUntil: 'load', timeout: 30_000 });
  74 |       await expect(page).toHaveURL(/learning-hub/, { timeout: NAV_TIMEOUT });
  75 |     });
  76 |   });
  77 | 
  78 |   test.describe('admin role access', () => {
  79 |     test.use({ storageState: 'tests/e2e/.auth/admin.json' });
  80 | 
  81 |     test('admin can access /users', async ({ page }) => {
  82 |       await page.goto('/users', { waitUntil: 'load', timeout: 30_000 });
  83 |       await expect(page).toHaveURL(/users/);
  84 |       await expect(page.locator('table')).toBeVisible({ timeout: 20_000 });
  85 |     });
  86 |   });
  87 | });
  88 | 
```