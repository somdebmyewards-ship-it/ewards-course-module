# eWards Learning Hub — Wave Execution Plan

> Generated: 2026-04-24
> Status: LOCKED (all 5 decisions locked in Session 3)
> Multi-agent: each wave uses Code Agent + Test Agent in sequence; Seed Agent runs in parallel with Code Agent before testing

---

## How Waves Work

```
Wave N starts
  ├── [Seed Agent]   → php artisan migrate:fresh --seed --force (parallel, upfront)
  ├── [Code Agent]   → implements all items in the wave
  └── [Test Agent]   → after code complete:
                          1. php artisan test (PHPUnit)
                          2. npm run test:e2e (Playwright)
                          3. Reports pass/fail, raises blockers
                       → wave is DONE only when Test Agent gives green
```

Wave N+1 does not start until Wave N Test Agent is green (or blockers explicitly deferred with written reason).

---

## Wave 0 — Stabilise (Current Wave)

**Goal:** Fix all known bugs, lock all decisions into code, fix Playwright test suite.

**Scope:**

| Item | Type | File(s) | Owner | Est. |
|------|------|---------|-------|------|
| D5: Expert cert threshold → 500 pts | Bug fix | `app/Services/CompletionService.php:82` + `CertificateController.php:123` | Code Agent | 5 min |
| D4: Add `points_awarded` to `training_progress`, check before awarding | Feature flag | New migration + `CompletionService.php` + `ProgressController.php` (reset) | Code Agent | 30 min |
| B2: AdminDashboard `.catch()` | Bug fix | `resources/js/pages/AdminDashboard.tsx:14` | Code Agent | 5 min |
| B3: Merchant/outlet `with()` in users | Bug fix | `app/Http/Controllers/Admin/UserManagementController.php` | Code Agent | 5 min |
| D2: Standardise API prefix → `/api/v1` | Refactor | `resources/js/lib/api.ts` baseURL | Code Agent | 10 min |
| D1: Document auto-approve as intentional | Docs | `app/Http/Controllers/Auth/RegisterController.php` (inline comment) | Code Agent | 2 min |
| D3: Document queue strategy | Docs | `.env.example` | Code Agent | 5 min |
| B4: Fix Playwright login helper (suites 02–05 failing) | Test fix | `tests/e2e/helpers.ts`, `tests/e2e/02-auth.spec.ts` | Code Agent | 45 min |

**Seed Agent:** `php artisan migrate:fresh --seed --force` before Test Agent runs.

**Test Agent checklist (Wave 0 done when ALL green):**
- [ ] `php artisan test` — all PHPUnit pass
- [ ] `npx playwright test` — 0 failures (suites 01–06)
- [ ] Manual spot-check: Admin dashboard loads without spinner on page; Users table shows merchant names
- [ ] Manual spot-check: Complete a module → points awarded once; restart module → no second points award

---

## Wave 1 — Flow & UX Polish

**Goal:** Close all flow gaps and quick UX wins identified in audit.

**Prerequisites:** Wave 0 Test Agent green.

**Scope:**

| Item | Type | File(s) | Est. |
|------|------|---------|------|
| F2: Restart modal — show exactly what is lost ("progress, quiz score — points NOT refunded") | UX | `resources/js/pages/LearningHub.tsx` (confirmId modal text) | 10 min |
| F3: 404 page component + route | Feature | `resources/js/pages/NotFound.tsx` (new), `App.tsx:58` | 20 min |
| F1: Register success message (auto-approve → "You're in! Logging you in..." then auto-redirect) | UX | `resources/js/pages/Register.tsx` + `AuthContext` | 15 min |
| U3: Sidebar user card — show level name (Beginner / Practitioner / Specialist / Expert) | UX | `resources/js/layouts/AppLayout.tsx` | 15 min |
| U4: First-time onboarding banner in LearningHub (show when 0 modules started) | UX | `resources/js/pages/LearningHub.tsx` | 20 min |
| U6: Sort select label in LearningHub toolbar | UX | `resources/js/pages/LearningHub.tsx` | 5 min |

**Seed Agent:** No schema changes — seed not required. Use existing seeded DB.

**Test Agent checklist:**
- [ ] `php artisan test` — still green
- [ ] `npx playwright test` — still green (new tests added for 404, onboarding banner)
- [ ] Manual: Register as new user → auto-login → see onboarding banner
- [ ] Manual: Hit `/some-garbage-url` → see 404 page (not silent redirect)
- [ ] Manual: Sidebar shows "Beginner" / level name next to user avatar

---

## Wave 2 — Feature Depth

**Goal:** Add profile edit, points history, and ContentManager learner preview.

**Prerequisites:** Wave 1 green.

**Scope:**

| Item | Type | File(s) | Est. |
|------|------|---------|------|
| F4: User profile page | Feature | `resources/js/pages/Profile.tsx` (new), `App.tsx` (route), `AppLayout.tsx` (menu), `app/Http/Controllers/Auth/ProfileController.php` (new), `routes/api.php` | 2 hrs |
| U2: Points ledger in My Progress | Feature | `resources/js/pages/MyProgress.tsx` (new section), `app/Http/Controllers/Training/PointsController.php` (new), `routes/api.php` | 1.5 hrs |
| U5: ContentManager learner preview button | UX | `resources/js/pages/ContentManagerEdit.tsx` (add "Preview" button → open `/learning-hub/:slug` in new tab) | 15 min |

**Schema changes:**
- Profile update: no new tables. `users` already has `name`, `mobile`, `designation`. Add `password` update endpoint (authenticated, requires current password).
- Points ledger: `points_ledger` table already exists — just expose it via API.

**Seed Agent:** `php artisan migrate:fresh --seed --force` (in case Wave 0 added `points_awarded` migration).

**Test Agent checklist:**
- [ ] `php artisan test` — green
- [ ] `npx playwright test` — green (new tests: profile save, points ledger visible)
- [ ] Manual: Edit profile → name/mobile saved → reflected in sidebar
- [ ] Manual: Complete module → My Progress → points ledger shows entry
- [ ] Manual: ContentManager → Edit module → Preview → opens learner view in new tab

---

## Wave 3 — Admin Power

**Goal:** Upgrade Admin Dashboard with real analytics; write PHPUnit real tests for core services.

**Prerequisites:** Wave 2 green.

**Scope:**

| Item | Type | File(s) | Est. |
|------|------|---------|------|
| U1a: Admin Dashboard — time filter (7d / 30d / all) | Feature | `AdminDashboard.tsx`, `AnalyticsController.php` | 1 hr |
| U1b: Admin Dashboard — leaderboard (top 10 users by points) | Feature | `AdminDashboard.tsx`, `AnalyticsController.php` | 45 min |
| U1c: Admin Dashboard — recent activity feed (last 10 completions) | Feature | `AdminDashboard.tsx`, `AnalyticsController.php` | 45 min |
| PHPUnit: `CompletionService` — test points award, no double-award, expert cert issuance | Tests | `tests/Feature/CompletionServiceTest.php` (new) | 1.5 hrs |
| PHPUnit: `QuizController` — pass/fail, bonus points, answer review | Tests | `tests/Feature/QuizControllerTest.php` (new) | 1 hr |
| PHPUnit: `CertificateController` — module cert, path cert, expert cert | Tests | `tests/Feature/CertificateControllerTest.php` (new) | 1 hr |

**Seed Agent:** No schema changes needed. Use existing seeded DB.

**Test Agent checklist:**
- [ ] `php artisan test` — ALL green including new Feature tests (CompletionService, Quiz, Certificate)
- [ ] `npx playwright test` — green
- [ ] Manual: Admin Dashboard → switch time filter → stat cards update
- [ ] Manual: Admin Dashboard → leaderboard shows top users with points
- [ ] Manual: Admin Dashboard → recent activity shows last 10 completions

---

## Wave 4 — Deploy & Production Readiness

**Goal:** Prepare for test server deployment, clean up tech debt, verify eWards integration points.

**Prerequisites:** Wave 3 green.

**Scope:**

| Item | Type | Notes |
|------|------|-------|
| `.env.example` cleanup | Docs | Remove Windows paths, annotate every key, mark required vs optional |
| Remove `database/run_sql.php` | Cleanup | Orphaned utility script |
| `QUEUE_CONNECTION=database` in production guide | Docs | Document `queue:work` in INSTALLATION_GUIDE.md |
| Cloudinary `.env` guide | Docs | Document how to set `CLOUDINARY_URL` (currently empty = local disk fallback) |
| API prefix final cleanup | Refactor | Remove the `/api` alias from `bootstrap/app.php` once frontend is confirmed on `/api/v1` |
| Password reset flow (forgot password email) | Feature | Optional — not required for V1 internal use |
| Test server deployment | Deploy | Render / manual — follow `render.yaml` |
| Final full E2E run on test server | Validation | Playwright `APP_URL=https://test-server-url` |

**Test Agent checklist:**
- [ ] All 6 Playwright suites green on test server URL
- [ ] `php artisan test` green
- [ ] Seed runs clean on test server DB
- [ ] AI assistant indexes a module, queued job completes within 30s
- [ ] Certificate PDF downloads successfully on test server

---

## Agent Execution Protocol

### Per-wave roles

| Agent | Responsibility | Runs |
|-------|---------------|------|
| Code Agent | Implements all items in the wave, one item at a time | First |
| Seed Agent | `migrate:fresh --seed --force`, confirms row counts | Parallel with Code Agent |
| Test Agent | Runs PHPUnit + Playwright, reports results, raises blockers | After Code Agent done |

### Multi-agent rules
- Code Agent and Seed Agent start simultaneously at wave kickoff
- Test Agent starts only after Code Agent reports all items done
- If Test Agent finds a failure: Code Agent gets one fix cycle, then Test Agent re-runs
- Wave is NOT marked done until Test Agent gives full green
- Blocking failures (>2 fix cycles): escalate to human before continuing

### Commands reference

```bash
# Seed Agent
php artisan migrate:fresh --seed --force

# Test Agent — PHPUnit
php artisan test

# Test Agent — Playwright
APP_URL=http://127.0.0.1:8001 npx playwright test --reporter=list

# Server (must be running for Playwright)
php artisan serve --port=8001 --host=127.0.0.1

# Queue worker (for cert/AI tests)
php artisan queue:work --queue=default
```

---

## Decisions Reference (all LOCKED)

| ID | Decision |
|----|----------|
| D1 | Auto-approve on register = ON (intentional, internal tool) |
| D2 | API prefix = `/api/v1` only (frontend baseURL updated in Wave 0) |
| D3 | Queue = `database` in prod, `sync` in local |
| D4 | Restart does NOT re-award points (`points_awarded` flag on progress) |
| D5 | Expert cert threshold = 500 pts (aligned with Expert level) |
