# Setup Guide

## Prerequisites
- PHP 8.3+
- Composer 2.x
- Node.js 18+ (tested with 25.x)
- MySQL 8.0+

## Local Setup

### 1. Clone and install
```bash
cd ewards-learning-hub
composer install
npm install
```

### 2. Environment
```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` — minimum required:
```
DB_DATABASE=ewards_learning
DB_USERNAME=root
DB_PASSWORD=

# Optional but needed for AI features:
HUGGINGFACE_API_TOKEN=hf_...
GROQ_API_KEY=gsk_...

# Optional for email notifications on signup:
MAIL_USERNAME=your@gmail.com
MAIL_PASSWORD=app-password
ADMIN_NOTIFICATION_EMAIL=admin@yourcompany.com
```

Create the database:
```sql
CREATE DATABASE ewards_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Migrate and seed
```bash
php artisan migrate
php artisan db:seed
```

This creates:
- 3 merchants (Spice Garden, Urban Style, Glow Beauty)
- 9 users (1 admin, 1 trainer, 3 cashiers, 3 clients, 2 pending)
- 6 training modules with prototype configs

### 4. Storage link
```bash
php artisan storage:link
```

### 5. Build frontend
```bash
npm run build
# or for dev with HMR:
npm run dev
```

### 6. Start the server
```bash
php artisan serve
# Visit: http://localhost:8000
```

### 7. (Optional) Queue worker for PDF/AI jobs
```bash
php artisan queue:work --queue=default
```

## Default Login Credentials

| Email                      | Password    | Role    |
|----------------------------|-------------|---------|
| admin@ewards.com           | admin123    | ADMIN   |
| trainer@ewards.com         | trainer123  | TRAINER |
| priya@spicegarden.com      | demo123     | CASHIER |
| rahul@spicegarden.com      | demo123     | CLIENT  |
| arjun@newbrand.com         | demo123     | CASHIER (pending) |

## Running E2E Tests (Playwright)

```bash
# Install browsers (first time only)
npx playwright install chromium

# Run all tests (requires running Laravel server at localhost:8000)
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# View last report
npm run test:e2e:report
```

Note: Tests include a seeding step (`01-seed-and-setup.spec.ts`) that runs `migrate:fresh --seed`.
Run against a **test database** — not production.

## Key Artisan Commands

```bash
php artisan route:list          # List all routes
php artisan migrate:status      # Check migration state
php artisan db:seed             # Re-seed (additive — may duplicate users)
php artisan migrate:fresh --seed  # Full reset + seed (destructive)
php artisan cache:clear         # Clear module/config cache
php artisan config:cache        # Cache config for production
php artisan route:cache         # Cache routes for production
```
