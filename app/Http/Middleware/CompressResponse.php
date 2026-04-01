<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CompressResponse
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($this->shouldCompress($request, $response)) {
            $content = $response->getContent();

            if (strlen($content) > 1024) { // Only compress if > 1KB
                $compressed = gzencode($content, 6);
                $response->setContent($compressed);
                $response->headers->set('Content-Encoding', 'gzip');
                $response->headers->set('Content-Length', strlen($compressed));
                $response->headers->remove('Transfer-Encoding');
            }
        }

        return $response;
    }

    private function shouldCompress(Request $request, $response): bool
    {
        if (!str_contains($request->header('Accept-Encoding', ''), 'gzip')) return false;
        if (!$response->isSuccessful()) return false;

        $contentType = $response->headers->get('Content-Type', '');
        return str_contains($contentType, 'json') || str_contains($contentType, 'text');
    }
}
