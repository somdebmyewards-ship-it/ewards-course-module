<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Streams uploaded media (video / audio / large images) with full HTTP Range support.
 *
 * Why this exists:
 * - `php artisan serve` and some production stacks (plain PHP-FPM with a symlinked
 *   public folder) do NOT emit `Accept-Ranges: bytes` for static files, so the
 *   browser <video> tag cannot progressively stream or seek. Result: the player
 *   spins on 0:00 forever for any file bigger than a few MB.
 * - This controller implements RFC 7233 Range responses correctly.
 *
 * Cloud-hosted assets (Cloudinary / S3) bypass this entirely — their URLs are
 * absolute and served by the cloud CDN with Range support baked in.
 */
class MediaStreamController extends Controller
{
    /** Chunk size for streaming loops (1 MB). */
    private const CHUNK_SIZE = 1024 * 1024;

    public function stream(Request $request, string $path)
    {
        // Whitelist: only serve files inside the public "uploads/" folder.
        // Reject path traversal, absolute paths, and nested dot segments.
        if (str_contains($path, '..') || str_starts_with($path, '/')) {
            abort(404);
        }

        $relativePath = 'uploads/' . ltrim($path, '/');

        if (!Storage::disk('public')->exists($relativePath)) {
            abort(404, 'File not found.');
        }

        $fullPath = Storage::disk('public')->path($relativePath);
        $size     = filesize($fullPath);
        $mime     = $this->detectMime($fullPath);

        // Parse Range header — format: "bytes=START-END" or "bytes=START-"
        $rangeHeader = $request->header('Range');
        $start       = 0;
        $end         = $size - 1;
        $status      = 200;

        if ($rangeHeader && preg_match('/bytes=(\d+)-(\d*)/', $rangeHeader, $m)) {
            $start = (int) $m[1];
            $end   = ($m[2] !== '') ? (int) $m[2] : $size - 1;

            if ($start >= $size || $end >= $size || $start > $end) {
                return response('', 416, [
                    'Content-Range' => "bytes */$size",
                ]);
            }
            $status = 206;
        }

        $length = $end - $start + 1;

        $headers = [
            'Content-Type'           => $mime,
            'Content-Length'         => $length,
            'Accept-Ranges'          => 'bytes',
            'Cache-Control'          => 'public, max-age=3600',
            'X-Content-Type-Options' => 'nosniff',
        ];
        if ($status === 206) {
            $headers['Content-Range'] = "bytes {$start}-{$end}/{$size}";
        }

        return new StreamedResponse(function () use ($fullPath, $start, $length) {
            $fp = fopen($fullPath, 'rb');
            if ($fp === false) {
                return;
            }
            try {
                fseek($fp, $start);
                $remaining = $length;
                while ($remaining > 0 && !feof($fp)) {
                    $read  = min(self::CHUNK_SIZE, $remaining);
                    $chunk = fread($fp, $read);
                    if ($chunk === false) {
                        break;
                    }
                    echo $chunk;
                    flush();
                    $remaining -= strlen($chunk);
                    // Break out if the client disconnected — saves CPU on abandoned streams.
                    if (connection_aborted()) {
                        break;
                    }
                }
            } finally {
                fclose($fp);
            }
        }, $status, $headers);
    }

    private function detectMime(string $fullPath): string
    {
        $ext = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        return match ($ext) {
            'mp4', 'm4v' => 'video/mp4',
            'webm'       => 'video/webm',
            'ogg', 'ogv' => 'video/ogg',
            'mov'        => 'video/quicktime',
            'mp3'        => 'audio/mpeg',
            'wav'        => 'audio/wav',
            'png'        => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'gif'        => 'image/gif',
            'webp'       => 'image/webp',
            'pdf'        => 'application/pdf',
            default      => (mime_content_type($fullPath) ?: 'application/octet-stream'),
        };
    }
}
