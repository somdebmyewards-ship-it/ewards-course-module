# eWards Learning Hub — Deployment Guide

**Stack:** Laravel 13 (Docker / Render) + React/Vite (Vercel) + TiDB Cloud (MySQL-compatible)
**Last updated:** 2026-04-25 | Session 9

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

### 1.2 Environment variables to set manually in Render Dashboard

> Go to: Service → Environment → Add Environment Variable

These are **not** in `render.yaml` (secrets — never commit):

| Key | Value | Notes |
|---|---|---|
| `DB_USERNAME` | `<TiDB username>` | TiDB Cloud → Connect → Username |
| `DB_PASSWORD` | `<TiDB password>` | TiDB Cloud → Connect → Password |
| `MAIL_MAILER` | `smtp` | |
| `MAIL_HOST` | `smtp.gmail.com` | |
| `MAIL_PORT` | `587` | |
| `MAIL_USERNAME` | `your-gmail@gmail.com` | Must be the Gmail account |
| `MAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` | Gmail App Password (16 chars, spaces OK) — NOT your Gmail login password. Generate at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) |
| `MAIL_ENCRYPTION` | `tls` | |
| `MAIL_FROM_ADDRESS` | `your-gmail@gmail.com` | Same as MAIL_USERNAME |
| `MAIL_FROM_NAME` | `eWards Learning Hub` | |
| `ADMIN_NOTIFICATION_EMAIL` | `admin@ewards.in` | Receives new signup alerts |
| `CLOUDINARY_URL` | `cloudinary://API_KEY:SECRET@cloud-name` | From Cloudinary Dashboard → API Keys |
| `HUGGINGFACE_API_TOKEN` | `hf_xxxxxxxxxxxx` | [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) — free |
| `GROQ_API_KEY` | `gsk_xxxxxxxxxxxx` | [console.groq.com](https://console.groq.com) → API Keys — free |
| `CERTIFICATE_COMPANY_NAME` | `eWards` | Appears on PDF certificates |
| `CERTIFICATE_SIGNATORY` | `eWards Training Team` | Appears on PDF certificates |

> **Already set by render.yaml** (do not override unless changing):
> `APP_NAME`, `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` (auto-generated),
> `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_CONNECTION`, `QUEUE_CONNECTION=sync`,
> `CACHE_DRIVER=file`, `SESSION_DRIVER=file`, `CORS_ALLOWED_ORIGINS`

### 1.3 What happens on first deploy

The `docker-entrypoint.sh` runs automatically on every deploy:
1. Clears and re-caches config, routes, views
2. Runs `php artisan migrate --force` — applies any new migrations
3. If the users table is empty → runs `php artisan db:seed --force` (creates admin account)
4. Starts Laravel on `PORT` (Render sets this automatically)

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
