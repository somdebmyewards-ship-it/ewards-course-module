#!/bin/bash
set -e

echo "==> Caching config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "==> Running migrations..."
php artisan migrate --force

echo "==> Ensuring storage link..."
php artisan storage:link 2>/dev/null || true

echo "==> Starting Laravel server on port ${PORT:-8000}..."
php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
