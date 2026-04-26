/**
 * Playwright global setup — runs once before all tests.
 * Logs in each user type via API, writes storageState JSON directly
 * (no browser navigation → no /me calls → PHP server stays free for tests).
 * This cuts TiDB login calls from ~20 (one per beforeEach) to just 3.
 */
import { request, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const USERS = {
  admin:   { email: 'admin@ewards.com',   password: 'admin123' },
  trainer: { email: 'trainer@ewards.com', password: 'trainer123' },
  cashier: { email: 'priya@spicegarden.com', password: 'demo123' },
};

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://127.0.0.1:8001';
  const authDir = 'tests/e2e/.auth';
  fs.mkdirSync(authDir, { recursive: true });

  // Single shared API request context — no browser, no /me calls, no PHP blocking
  const apiContext = await request.newContext({ baseURL });

  for (const [role, creds] of Object.entries(USERS)) {
    const res = await apiContext.post('/api/v1/auth/login', {
      data: creds,
      timeout: 45_000, // TiDB Cloud cold-start can spike to 15–20s
    });
    const body = await res.json();
    const token: string = body.token;
    const user: unknown = body.user;

    // Write Playwright storageState format directly — identical to what context.storageState() produces
    const storageState = {
      cookies: [],
      origins: [{
        origin: baseURL,
        localStorage: [
          { name: 'token', value: token },
          { name: 'user', value: JSON.stringify(user) },
        ],
      }],
    };
    fs.writeFileSync(
      path.join(authDir, `${role}.json`),
      JSON.stringify(storageState),
    );
  }

  await apiContext.dispose();
}

export default globalSetup;
