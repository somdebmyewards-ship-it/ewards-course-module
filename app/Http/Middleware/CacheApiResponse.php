<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CacheApiResponse
{
    public function handle(Request $request, Closure $next, string $maxAge = '60')
    {
        $response = $next($request);

        if ($request->isMethod('GET') && $response->isSuccessful()) {
            $response->headers->set('Cache-Control', "public, max-age={$maxAge}");
            $response->headers->set('Vary', 'Authorization');
        }

        return $response;
    }
}
