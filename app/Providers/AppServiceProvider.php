<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Use custom PersonalAccessToken with lms_ table prefix
        Sanctum::usePersonalAccessTokenModel(\App\Models\PersonalAccessToken::class);

        // TiDB Cloud: disable FK checks in console (migrations). All pre-rename FK
        // constraints become dangling after 2026_04_01_000001_rename_tables_with_lms_prefix,
        // so DB-level FK enforcement is never relied upon in this codebase.
        if ($this->app->runningInConsole()) {
            try {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
            } catch (\Throwable) {
                // Ignore — DB may not be connected yet during unit tests
            }
        }

        // Default API rate limiter — required by the `api` middleware group
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}
