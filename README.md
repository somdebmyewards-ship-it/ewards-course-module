# eWards Learning Hub

Learning management module for the eWards ecosystem. Built with Laravel 13, React 18, Ant Design 5, and MySQL 8.

## Requirements

- PHP 8.3+
- MySQL 8.0+
- Redis 6+ (mandatory for production)
- Node.js 18+
- Composer 2+

## Local Development Setup

```bash
# 1. Install dependencies
composer install
npm install

# 2. Configure environment
cp .env.example .env
php artisan key:generate

# 3. Edit .env — set DB credentials
#    For local dev, override these:
#    CACHE_DRIVER=file
#    QUEUE_CONNECTION=sync
#    SESSION_DRIVER=file

# 4. Run migrations and seed demo data
php artisan migrate --seed

# 5. Build frontend assets
npm run dev     # dev server with HMR
npm run build   # production build

# 6. Start the server
php artisan serve
```

### Demo Accounts (Seeder)

| Email                | Password    | Role    |
|----------------------|-------------|---------|
| admin@ewards.com     | admin123    | ADMIN   |
| trainer@ewards.com   | trainer123  | TRAINER |
| cashier@demo.com     | demo123     | CASHIER |
| client@demo.com      | demo123     | CLIENT  |
| pending@demo.com     | demo123     | CASHIER (not approved) |

## Production Setup

### Required Environment Variables

These **must** be set before going live:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
LOG_LEVEL=warning

# Redis — mandatory for production
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=<your-redis-host>
REDIS_PASSWORD=<your-redis-password>
REDIS_PORT=6379

# Database
DB_CONNECTION=mysql
DB_HOST=<your-db-host>
DB_DATABASE=ewards_learning
DB_USERNAME=<your-db-user>
DB_PASSWORD=<your-db-password>

# File storage (Cloudinary recommended)
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# Email (SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=<email>
MAIL_PASSWORD=<app-password>
MAIL_ENCRYPTION=tls

# AI Assistant (optional)
HUGGINGFACE_API_TOKEN=hf_xxx
GROQ_API_KEY=gsk_xxx
```

### Production Deployment Steps

```bash
# 1. Install production dependencies
composer install --no-dev --optimize-autoloader
npm ci && npm run build

# 2. Run migrations
php artisan migrate --force

# 3. Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Start queue worker (required for async jobs)
php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600

# 5. Set correct storage permissions
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```

### Security Notes

- All certificate codes are fully random (non-guessable)
- ADMIN user creation requires password re-confirmation
- Chunk uploads are restricted to video files only (mp4, webm, mov, avi)
- Certificate issuance only happens during module completion flow (never on read endpoints)
- All admin actions are audit-logged in `lms_audit_logs`

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Backend   | Laravel 13 (PHP 8.3)                    |
| Frontend  | React 18 + TypeScript + Ant Design 5    |
| Database  | MySQL 8                                 |
| Auth      | Laravel Sanctum (SPA token-based)       |
| Cache     | Redis                                   |
| PDF       | barryvdh/laravel-dompdf                 |
| Storage   | Cloudinary / Local / S3                 |
| Build     | Vite                                    |
