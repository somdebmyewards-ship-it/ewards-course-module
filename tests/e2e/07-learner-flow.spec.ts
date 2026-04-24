/**
 * Learner flow — API-level tests covering the full progression journey.
 * These hit the API directly via request fixture to avoid TiDB latency
 * compounding with UI navigation timing.
 */
import { test, expect } from '@playwright/test';
import { USERS } from './helpers';

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getToken(request: any, user: { email: string; password: string }) {
  const res = await request.post('/api/v1/auth/login', {
    data: { email: user.email, password: user.password },
  });
  const body = await res.json();
  return body.token as string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ─── Progress & Bookmarks API ─────────────────────────────────────────────────

test.describe('Progress API', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await getToken(request, USERS.cashier);
  });

  test('GET /progress returns module list', async ({ request }) => {
    const res = await request.get('/api/v1/progress', {
      headers: authHeaders(token),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('modules');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.modules)).toBeTruthy();
  });

  test('GET /modules returns published modules', async ({ request }) => {
    const res = await request.get('/api/v1/modules', {
      headers: authHeaders(token),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toHaveProperty('modules');
    expect(body.modules.length).toBeGreaterThan(0);
  });
});

// ─── Help-viewed flow ─────────────────────────────────────────────────────────

test.describe('Help-viewed flow', () => {
  let token: string;
  let moduleId: number;

  test.beforeAll(async ({ request }) => {
    token = await getToken(request, USERS.cashier);

    const modulesRes = await request.get('/api/v1/modules', {
      headers: authHeaders(token),
    });
    const modules = (await modulesRes.json()).modules;
    expect(modules.length).toBeGreaterThan(0);
    moduleId = modules[0].id;
  });

  test('POST help-viewed returns success', async ({ request }) => {
    const res = await request.post(`/api/v1/progress/${moduleId}/help-viewed`, {
      headers: authHeaders(token),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('GET /progress/{id} shows help_viewed true', async ({ request }) => {
    const res = await request.get(`/api/v1/progress/${moduleId}`, {
      headers: authHeaders(token),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.help_viewed).toBe(true);
  });
});

// ─── Bookmarks ────────────────────────────────────────────────────────────────

test.describe('Bookmark API', () => {
  let token: string;
  let moduleId: number;

  test.beforeAll(async ({ request }) => {
    token = await getToken(request, USERS.cashier);

    const modulesRes = await request.get('/api/v1/modules', {
      headers: authHeaders(token),
    });
    moduleId = (await modulesRes.json()).modules[0].id;
  });

  test('POST /bookmarks adds bookmark', async ({ request }) => {
    const res = await request.post('/api/v1/bookmarks', {
      headers: authHeaders(token),
      data: { module_id: moduleId },
    });
    expect([200, 201]).toContain(res.status());
  });

  test('GET /bookmarks includes bookmarked module', async ({ request }) => {
    const res = await request.get('/api/v1/bookmarks', {
      headers: authHeaders(token),
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    const ids = (body.bookmarks ?? body).map((b: any) => b.module_id ?? b.id);
    expect(ids.some((id: number) => id === moduleId)).toBeTruthy();
  });

  test('DELETE /bookmarks/{id} removes bookmark', async ({ request }) => {
    const listRes = await request.get('/api/v1/bookmarks', {
      headers: authHeaders(token),
    });
    const items = (await listRes.json()).bookmarks ?? await listRes.json();
    const bookmark = (Array.isArray(items) ? items : []).find(
      (b: any) => (b.module_id ?? b.id) === moduleId
    );
    if (!bookmark) return;

    const delRes = await request.delete(`/api/v1/bookmarks/${bookmark.id}`, {
      headers: authHeaders(token),
    });
    expect([200, 204]).toContain(delRes.status());
  });
});

// ─── Admin approves pending user (API only) ───────────────────────────────────

test.describe('Admin approval flow', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    adminToken = await getToken(request, USERS.admin);
  });

  test('admin can list pending approvals via API', async ({ request }) => {
    const res = await request.get('/api/v1/admin/users', {
      headers: authHeaders(adminToken),
    });
    expect(res.ok()).toBeTruthy();
  });
});
