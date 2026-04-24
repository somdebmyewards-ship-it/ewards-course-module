/**
 * Seed & Setup — ensures test fixtures (users, merchants) exist before other suites run.
 *
 * NOTE: Does NOT run migrate:fresh — that is too slow against TiDB Cloud (~5+ min).
 * All seeders used here are idempotent (firstOrCreate / updateOrCreate).
 * For a full clean reset, run manually: php artisan migrate:fresh --seed --force
 *
 * Run order: npm run test:e2e (see package.json)
 */
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const APP_DIR = '/Volumes/Abhishek SSD/ewards-learning-hub';

function artisan(cmd: string) {
  return execSync(`php artisan ${cmd}`, {
    cwd: APP_DIR,
    encoding: 'utf8',
    timeout: 120_000, // 2 min: seed = ~10 users × 5s TiDB round-trips
    maxBuffer: 10 * 1024 * 1024,
  });
}

test.describe('Database seed', () => {
  test('seed users and merchants (idempotent)', () => {
    test.setTimeout(180_000); // generous: TiDB Cloud ~5s per query
    const out = artisan('db:seed --class=MerchantSeeder --force');
    const out2 = artisan('db:seed --class=UserSeeder --force');
    const combined = out + out2;
    expect(combined).not.toContain('SQLSTATE');
    expect(combined).not.toMatch(/Fatal error|Uncaught Error/i);
  });

  test('health endpoint responds ok', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('admin login returns token', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'admin@ewards.com', password: 'admin123' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('token');
    expect(body.user.role).toBe('ADMIN');
  });

  test('trainer login returns token', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'trainer@ewards.com', password: 'trainer123' },
      timeout: 30_000,
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.user.role).toBe('TRAINER');
  });

  test('cashier login returns token', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'priya@spicegarden.com', password: 'demo123' },
      timeout: 30_000,
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.user.role).toBe('CASHIER');
    expect(body.user.approved).toBeTruthy();
  });

  test('unapproved user cannot access modules', async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: 'arjun@newbrand.com', password: 'demo123' },
      timeout: 30_000,
    });
    const token = (await loginRes.json()).token;

    const res = await request.get('/api/v1/modules', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 30_000,
    });
    expect(res.status()).toBe(403);
  });
});
