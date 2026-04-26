/**
 * Pre-generates Playwright storageState auth files by calling the login API.
 * Run this once before `npx playwright test` to avoid global-setup timeouts.
 * Usage: node tests/e2e/preauth.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const BASE = process.env.APP_URL || 'http://127.0.0.1:8001';
const AUTH_DIR = 'tests/e2e/.auth';
mkdirSync(AUTH_DIR, { recursive: true });

const USERS = {
  admin:   { email: 'admin@ewards.com',   password: 'admin123' },
  trainer: { email: 'trainer@ewards.com', password: 'trainer123' },
  cashier: { email: 'priya@spicegarden.com', password: 'demo123' },
};

for (const [role, creds] of Object.entries(USERS)) {
  process.stdout.write(`Logging in ${role}... `);
  const res = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(creds),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await res.json();
  const storageState = {
    cookies: [],
    origins: [{
      origin: BASE,
      localStorage: [
        { name: 'token', value: body.token },
        { name: 'user', value: JSON.stringify(body.user) },
      ],
    }],
  };
  writeFileSync(`${AUTH_DIR}/${role}.json`, JSON.stringify(storageState));
  console.log(`OK (${body.user?.name})`);
}
console.log('Auth files ready.');
