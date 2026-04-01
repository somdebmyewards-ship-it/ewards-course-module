# ─── Stage 1: Composer dependencies ──────────────────────────────
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize --no-dev

# ─── Stage 2: Production image ───────────────────────────────────
FROM php:8.2-cli

# Install system deps + PHP extensions needed by Laravel
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpng-dev libjpeg-dev libfreetype6-dev libzip-dev libonig-dev \
    libxml2-dev unzip curl \
  && docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install pdo_mysql mbstring gd zip bcmath xml pcntl \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# Copy app code
COPY . .

# Copy vendor from Stage 1
COPY --from=vendor /app/vendor ./vendor

# Storage & bootstrap/cache directories must be writable
RUN mkdir -p storage/framework/{sessions,views,cache/data} \
    storage/logs storage/app/public bootstrap/cache \
  && chmod -R 775 storage bootstrap/cache \
  && chown -R www-data:www-data storage bootstrap/cache

# Create storage symlink for public file access
RUN php artisan storage:link 2>/dev/null || true

# Copy entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]
