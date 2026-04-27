# eWards Learning Hub — Deployment Guide

**Stack:** Laravel 13 (Docker / Render) + React/Vite (Vercel) + TiDB Cloud (MySQL-compatible)
**Last updated:** 2026-04-27 | Session 10

---

## Architecture Overview

```
Browser
  │
  ├─▶ Vercel (React SPA — static)          VITE_API_URL → backend
  │
  └─▶ Render (Laravel API — Docker)
         │
         ├─▶ TiDB Cloud (MySQL 8.0-compatible, hosted)
         ├─▶ Gmail SMTP (email — password reset, signup alerts)
         ├─▶ Cloudinary (file/video storage)
         ├─▶ HuggingFace API (embeddings for Ask Ela)
         └─▶ Groq API (LLM responses for Ask Ela)
```

---

## PART 1 — Backend (Render)

### 1.1 First-time Render setup

1. Go to [render.com](https://render.com) → New → Blueprint
2. Connect the GitHub repo: `somdebmyewards-ship-it/ewards-course-module`
3. Render auto-reads `render.yaml` from the `main` branch
4. The service `ewards-learning-hub-api` is created automatically

### 1.2 Environment variables — what to set and what to leave alone

#### Table A — Already handled by `render.yaml` (do NOT re-enter in the dashboard)

`render.yaml` ships with explicit values for all of these. Entering them again in the dashboard creates duplicates that override the file.

| Group | Keys set by render.yaml |
|---|---|
| App | `APP_NAME`, `APP_ENV`, `APP_KEY`*, `APP_DEBUG`, `APP_URL` (auto from service host), `LOG_CHANNEL`, `LOG_LEVEL` |
| Database | `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`, `MYSQL_ATTR_SSL_CA`, `MYSQL_ATTR_SSL_VERIFY` |
| Cache / Session | `CACHE_DRIVER`, `QUEUE_CONNECTION`, `SESSION_DRIVER`, `SESSION_LIFETIME`, `FILESYSTEM_DISK` |
| Auth / CORS | `CORS_ALLOWED_ORIGINS`, `SANCTUM_TOKEN_EXPIRATION` |
| Email | `MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_ENCRYPTION`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`, `ADMIN_NOTIFICATION_EMAIL` |
| File storage | `CLOUDINARY_URL` |
| AI services | `GROQ_CHAT_MODEL`, `LLM_BASE_URL`, `AI_CHUNK_SIZE`, `AI_CHUNK_OVERLAP`, `AI_MAX_CONTEXT_CHUNKS`, `AI_RATE_LIMIT_PER_MINUTE`, `AI_MIN_SIMILARITY_SCORE` |

> *`APP_KEY` is hardcoded in `render.yaml` as a fixed base64 string — it is **not** auto-generated. Before going to production on AWS or any new environment, generate a fresh key with `php artisan key:generate --show` and update it.

#### Table B — Must be set manually in Render Dashboard

These 4 variables are **not** present as values in `render.yaml` and Render will not inject them automatically.

> Go to: Service → Environment → Add Environment Variable

| Key | Where to get it | Notes |
|---|---|---|
| `HUGGINGFACE_API_TOKEN` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) — free tier | Powers embedding search in Ask Ela |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys — free tier | Powers LLM responses in Ask Ela |
| `CERTIFICATE_COMPANY_NAME` | Your value, e.g. `eWards` | Printed on every PDF certificate |
| `CERTIFICATE_SIGNATORY` | Your value, e.g. `eWards Training Team` | Printed on every PDF certificate |

> **If Ask Ela is not needed**, you can leave `HUGGINGFACE_API_TOKEN` and `GROQ_API_KEY` blank — all other features work without them.

### 1.3 What happens on first deploy

The `docker-entrypoint.sh` runs automatically on every deploy:
1. Clears and re-caches config, routes, views, events
2. Runs `php artisan migrate --force` — applies any new migrations
3. If the users table is empty → runs `php artisan db:seed --force` (creates admin account)
4. Runs `php artisan storage:link` — links `storage/app/public` to `public/storage` for local file access
5. Starts Laravel on `PORT` (Render sets this automatically)

> **Note:** The seed creates a default admin user. Check `database/seeders/DatabaseSeeder.php` for the credentials and **change the password immediately after first login**.

### 1.4 Subsequent deploys (code changes)

Push to `main` branch → Render auto-redeploys. No manual steps needed.

Migration is always re-run but `--force` is safe — already-applied migrations are skipped.

### 1.5 Verify backend is up

Hit the health endpoint:
```
GET https://<your-render-url>/api/v1/health
Expected: {"status":"ok","ts":"2026-..."}
```

---

## PART 2 — Frontend (Vercel)

### 2.1 First-time Vercel setup

1. Go to [vercel.com](https://vercel.com) → New Project → Import Git repo
2. Framework Preset: **Other** (not Vite — Vercel uses a custom standalone config)
3. Build command: `npm run build:vercel`
4. Output directory: `dist`
5. Root directory: `/` (repo root)

### 2.2 Environment variables in Vercel

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://<your-render-url>/api/v1` |
| `VITE_APP_NAME` | `eWards Learning Hub` |

> All other `VITE_*` vars in `.env.example` (Pusher) are optional — leave blank unless you add real-time features.

### 2.3 Update CORS on Render after Vercel deploy

Once Vercel assigns a URL (e.g. `https://ewards-learning-hub.vercel.app`), set this on Render:

| Key | Value |
|---|---|
| `CORS_ALLOWED_ORIGINS` | `https://ewards-learning-hub.vercel.app` |

This is already pre-set in `render.yaml` — only update if Vercel assigns a different URL.

### 2.4 Verify frontend

Open the Vercel URL in a browser. You should see the Landing page. Click "Sign In" — the login form should load and hit the Render backend without CORS errors.

---

## PART 3 — TiDB Cloud (Database)

### 3.1 Database is already provisioned

TiDB Cloud cluster: `gateway01.us-east-1.prod.aws.tidbcloud.com:4000`
Database: `ewards_lms`

Migrations and seed are handled automatically by the entrypoint script.

### 3.2 Tables created manually (not via migrations)

Two tables were created directly via Tinker because their migrations were already recorded but the tables were missing:

| Table | Created | Reason |
|---|---|---|
| `failed_jobs` | Session 8 | Migration was recorded, table was absent |
| `password_reset_tokens` | Session 9 | Migration was recorded, table was absent |

If you ever reset the TiDB database and re-run `php artisan migrate`, these will be created normally by their existing migrations.

### 3.3 TiDB SSL

TiDB Cloud requires SSL. The Dockerfile uses the system CA bundle at `/etc/ssl/certs/ca-certificates.crt` — this is set in `render.yaml` as `MYSQL_ATTR_SSL_CA`.

---

## PART 4 — Post-Deploy Checklist

Run these checks immediately after every fresh deploy:

- [ ] `GET /api/v1/health` returns `{"status":"ok"}`
- [ ] Login page loads on Vercel URL
- [ ] Login with admin account works
- [ ] Admin can approve a test user
- [ ] A published module loads in Learning Hub
- [ ] Password reset email arrives (send a test reset)
- [ ] File upload works (upload a cover image in Content Manager)
- [ ] Ask Ela chatbot responds (confirm HuggingFace + Groq keys are valid)
- [ ] Certificate PDF downloads for a completed module

---

## PART 5 — Known Constraints (Free Tier)

| Constraint | Impact | Workaround |
|---|---|---|
| Render free tier spins down after 15 min idle | First request after idle takes 20–30s | Acceptable for testing; upgrade to paid for production |
| `QUEUE_CONNECTION=sync` | Emails sent synchronously — no background queue worker needed | If volume grows, switch to `database` queue and add a second Render worker service |
| TiDB Cloud free tier: 5GB storage, 250M RUs/month | Fine for testing and early users | Upgrade plan if data grows |
| Cloudinary free tier: 25GB storage | Fine for V1 | Monitor usage in Cloudinary dashboard |

---

## PART 6 — Rollback Procedure

If a deploy breaks the app:

1. In Render Dashboard → Service → Events → click the previous successful deploy → **Redeploy**
2. Migrations are additive-only — rollback is safe as long as no migration dropped a column
3. No data loss risk unless a migration ran a destructive `dropColumn` (none exist in this project)

---

## PART 7 — Seeder Details

`DatabaseSeeder.php` creates on first deploy (empty DB only):
- 1 admin user — check the seeder for credentials
- Default merchants (if `MerchantSeeder` is included)

After first login, immediately:
1. Change admin password via Profile page
2. Add real merchant data via Admin panel
3. Create the first training module via Content Manager
