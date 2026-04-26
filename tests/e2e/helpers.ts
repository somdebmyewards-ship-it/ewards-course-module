import { Page } from '@playwright/test';

export const USERS = {
  admin:   { email: 'admin@ewards.com',   password: 'admin123',   role: 'ADMIN'   },
  trainer: { email: 'trainer@ewards.com', password: 'trainer123', role: 'TRAINER' },
  cashier: { email: 'priya@spicegarden.com', password: 'demo123', role: 'CASHIER' },
};

/**
 * API-based login: bypasses the UI form entirely.
 * Injects token + user into localStorage before React boots so AuthContext
 * picks it up immediately without a second round-trip for /me.
 * Much more reliable than UI form-fill against a remote TiDB Cloud DB.
 */
export async function login(page: Page, user: { email: string; password: string }) {
  // Step 1: get token via API (bypasses UI form — reliable against slow remote DB)
  const res = await page.request.post('/api/v1/auth/login', {
    data: { email: user.email, password: user.password },
    timeout: 60_000, // TiDB Cloud: up to 15s on cold; 60s gives headroom for server queue
  });
  const body = await res.json();

  // Step 2: inject token+user into localStorage BEFORE React boots on next navigation
  await page.addInitScript(({ t, u }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, { t: body.token, u: body.user });

  // Step 3: intercept /me response before goto so we can drain it afterward
  // (PHP artisan serve has 1 worker — undrained /me blocks next test's API call)
  const meResponse = page.waitForResponse(
    r => r.url().endsWith('/api/v1/me'),
    { timeout: 60_000 },
  ).catch(() => {});

  // Navigate to /login — AuthContext fires /me in background, then auto-redirects
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Step 4: redirect fires immediately (cached user in localStorage, loading=false)
  await page.waitForURL(/learning-hub/, { timeout: 45_000 });

  // Drain /me so PHP worker is free before the next test makes its first API call
  await meResponse;
}

/**
 * Direct login: injects auth into localStorage then navigates straight to targetUrl.
 * Saves ~15-20s vs login() by skipping the /login → /learning-hub redirect round-trip.
 * Use this in beforeEach blocks where the target page is NOT /learning-hub.
 */
export async function loginDirect(
  page: Page,
  user: { email: string; password: string },
  targetUrl: string,
) {
  const res = await page.request.post('/api/v1/auth/login', {
    data: { email: user.email, password: user.password },
    timeout: 30_000,
  });
  const body = await res.json();

  await page.addInitScript(({ t, u }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, { t: body.token, u: body.user });

  // Use 'load' not 'networkidle' — TiDB API calls can keep connections open
  // beyond 60s, causing networkidle to time out. Tests do their own data waits.
  await page.goto(targetUrl, { waitUntil: 'load', timeout: 60_000 });
}

export async function logout(page: Page) {
  // Click avatar in sidebar bottom
  await page.locator('.ant-dropdown-trigger, [class*="UserOutlined"]').first().click();
  await page.getByText('Logout').click();
  await page.waitForURL(/login/, { timeout: 5_000 });
}

export async function seedViaArtisan(command: string): Promise<void> {
  const { execSync } = await import('child_process');
  const cwd = process.cwd();
  execSync(`php artisan ${command}`, { cwd, stdio: 'inherit' });
}
