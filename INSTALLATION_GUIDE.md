# eWards Learning Hub - Installation Guide

## Quick Start (5 minutes)

### Prerequisites
- **PHP 8.1+** (with extensions: mbstring, xml, curl, mysql, gd, zip, opcache)
- **Composer 2.x** (PHP dependency manager)
- **Node.js 18+** and **npm 9+**
- **MySQL 8.0+** or **MariaDB 10.6+**
- **Git** (optional, for cloning)

### Step 1: Clone / Extract the Project
```bash
# If from ZIP file:
unzip ewards-learning-hub.zip
cd ewards-learning-hub

# If from Git:
git clone <repository-url> ewards-learning-hub
cd ewards-learning-hub
```

### Step 2: Install PHP Dependencies
```bash
composer install
```

### Step 3: Install Node.js Dependencies
```bash
npm install
```

### Step 4: Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Generate application key
php artisan key:generate
```

### Step 5: Configure `.env` File
Open `.env` and update these values:

```env
# App Settings
APP_NAME="eWards Learning Hub"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database - CREATE THIS DATABASE FIRST
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ewards_learning
DB_USERNAME=root
DB_PASSWORD=

# Email (Gmail SMTP) - Optional
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD="your-app-password"
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="your-email@gmail.com"
MAIL_FROM_NAME="eWards Learning Hub"

# Admin notification email
ADMIN_NOTIFICATION_EMAIL=admin@yourcompany.com

# AI Assistant (Optional - for Ask Ela chatbot)
HUGGINGFACE_API_TOKEN=hf_your_token_here
GROQ_API_KEY=your_groq_key_here
```

### Step 6: Create Database
```sql
-- In MySQL console:
CREATE DATABASE ewards_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 7: Run Migrations & Seed Data
```bash
# Run all database migrations
php artisan migrate

# Seed sample data (merchants, users, training modules)
php artisan db:seed

# Link storage for file uploads
php artisan storage:link
```

### Step 8: Build Frontend
```bash
npm run build
```

### Step 9: Start the Server
```bash
php artisan serve
```

Visit **http://localhost:8000** in your browser.

### Default Login Credentials (from seeder)
| Role    | Email              | Password   |
|---------|--------------------|------------|
| Admin   | admin@ewards.com   | password   |
| Trainer | trainer@ewards.com | password   |
| User    | user@ewards.com    | password   |

> **Note:** Check `database/seeders/UserSeeder.php` for exact credentials.

---

## Development Mode

For hot-reload during development, run two terminals:

```bash
# Terminal 1: PHP Server
php artisan serve

# Terminal 2: Vite Dev Server (hot reload)
npm run dev
```

---

## Production Deployment

### 1. Optimize Laravel
```bash
APP_DEBUG=false        # in .env
APP_ENV=production     # in .env
LOG_LEVEL=warning      # in .env

php artisan optimize   # Cache config + routes
php artisan view:cache # Cache blade views
```

### 2. Enable PHP OPcache
In your `php.ini`:
```ini
zend_extension=opcache
opcache.enable=1
opcache.enable_cli=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=1
opcache.revalidate_freq=2
```

### 3. Build for Production
```bash
npm run build
```

### 4. Queue Worker (for background jobs)

The queue handles two job types: certificate PDF generation and Ask Ela AI indexing.
Without a running worker, these will silently stall.

```bash
# Update .env
QUEUE_CONNECTION=database

# Run migrations to create the jobs table (if not already done)
php artisan queue:table
php artisan migrate

# Start the worker — keep this process running in the background
php artisan queue:work --queue=default --tries=3 --timeout=60
```

For production, use a process manager (Supervisor, systemd, or Render's background worker):

```ini
# Supervisor example (/etc/supervisor/conf.d/ewards-worker.conf)
[program:ewards-worker]
command=php /path/to/artisan queue:work --queue=default --tries=3 --timeout=60
autostart=true
autorestart=true
```

### 5. Cloudinary (persistent file storage)

Without Cloudinary, uploaded files are stored on local disk and will be lost on Render/serverless deploys.

```env
# Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
CLOUDINARY_URL=cloudinary://123456789:abcdefghij@mycloudname
```

Steps:
1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier: 25 GB)
2. Dashboard → Settings → API Keys → copy the **API Environment Variable** (starts with `cloudinary://`)
3. Paste into `.env` as `CLOUDINARY_URL`

If `CLOUDINARY_URL` is empty, the app falls back to local disk storage — fine for development.

### 5. Recommended Server
Use **Nginx + PHP-FPM** or **Apache + mod_php** instead of `php artisan serve` for production.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 500 Error | Check `storage/logs/laravel.log` |
| Permission denied | `chmod -R 775 storage bootstrap/cache` |
| CSS not loading | Run `npm run build` |
| Database error | Check `.env` DB credentials, run `php artisan migrate` |
| Blank page | Clear cache: `php artisan cache:clear && php artisan config:clear` |
| Slow performance | Enable OPcache (see Production section above) |
