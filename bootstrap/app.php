<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api/v1',
        web: __DIR__ . '/../routes/web.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Trust proxies (Render, Cloudflare, etc.)
        $middleware->trustProxies(at: '*');

        // API middleware stack
        $middleware->api(prepend: [
            \App\Http\Middleware\ForceJsonResponse::class,
            \Illuminate\Routing\Middleware\ThrottleRequests::class . ':api',
        ]);

        // Custom middleware aliases
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'approved' => \App\Http\Middleware\ApprovedMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
