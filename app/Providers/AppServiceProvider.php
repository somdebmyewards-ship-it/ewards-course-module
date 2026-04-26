<?php

namespace App\Providers;

use App\Services\AI\RetrievalService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
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
        // Auto-inject raw query text into RetrievalService for hybrid BM25 search.
        // This lets the service access the user's question without changing any controllers.
        $this->app->resolving(RetrievalService::class, function (RetrievalService $service) {
            $question = request()->input('question', '');
            if (is_string($question) && trim($question) !== '') {
                $service->forQuery(trim($question));
            }
        });

        // Use custom PersonalAccessToken with lms_ table prefix
        Sanctum::usePersonalAccessTokenModel(\App\Models\PersonalAccessToken::class);

        // Define the 'api' rate limiter (60 requests/min per user or IP)
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by(
                $request->user()?->id ?: $request->ip()
            );
        });
    }
}
