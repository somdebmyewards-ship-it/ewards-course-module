#!/bin/bash
set -e

echo "==> Caching config, routes, views..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache 2>/dev/null || true

echo "==> Running migrations..."
php artisan migrate --force

# Seed only on first deploy (when users table is empty)
USER_COUNT=$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null || echo "0")
if [ "$USER_COUNT" = "0" ]; then
    echo "==> First deploy detected — seeding database..."
    php artisan db:seed --force
fi

echo "==> Ensuring storage link..."
php artisan storage:link 2>/dev/null || true

echo "==> Starting Laravel server on port ${PORT:-8000}..."
php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
