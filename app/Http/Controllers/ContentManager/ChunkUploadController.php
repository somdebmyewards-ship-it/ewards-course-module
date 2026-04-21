<?php

namespace App\Http\Controllers\ContentManager;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Cloudinary\Cloudinary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ChunkUploadController extends Controller
{
    /**
     * Receive a single chunk and write it to a temp directory.
     */
    public function storeChunk(Request $request)
    {
        $request->validate([
            'chunk'        => 'required|file|max:10240', // 10MB per chunk max
            'upload_id'    => 'required|string|max:100',
            'chunk_index'  => 'required|integer|min:0',
            'total_chunks' => 'required|integer|min:1|max:500',
            'filename'     => 'required|string|max:255',
        ]);

        $ext          = strtolower(pathinfo($request->input('filename'), PATHINFO_EXTENSION));
        $allowedTypes = config('lms.upload_allowed_types', ['mp4','webm','mov','avi','pdf','png','jpg','jpeg','gif']);
        if (!in_array($ext, $allowedTypes)) {
            return response()->json(['message' => "File type .{$ext} is not allowed."], 422);
        }

        $uploadId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $request->input('upload_id'));
        $index    = (int) $request->input('chunk_index');

        $chunkPath = "chunks/{$uploadId}/chunk_{$index}";
        $ok        = Storage::disk('local')->put($chunkPath, file_get_contents($request->file('chunk')->getRealPath()));

        if ($ok === false) {
            Log::error('Chunk upload write failed.', ['upload_id' => $uploadId, 'chunk_index' => $index]);
            return response()->json(['message' => "Failed to write chunk {$index} to local storage."], 500);
        }

        return response()->json(['received' => true]);
    }

    /**
     * Merge all chunks, store the final file, create a Media record.
     * Fails loudly on any storage / cloud error — never returns a broken Media row.
     */
    public function finalize(Request $request)
    {
        $request->validate([
            'upload_id'    => 'required|string|max:100',
            'total_chunks' => 'required|integer|min:1',
            'filename'     => 'required|string|max:255',
        ]);

        $uploadId    = preg_replace('/[^a-zA-Z0-9_\-]/', '', $request->input('upload_id'));
        $totalChunks = (int) $request->input('total_chunks');
        $filename    = $request->input('filename');

        // Verify every chunk arrived
        for ($i = 0; $i < $totalChunks; $i++) {
            if (!Storage::disk('local')->exists("chunks/{$uploadId}/chunk_{$i}")) {
                return response()->json(['message' => "Missing chunk {$i}. Please retry the upload."], 422);
            }
        }

        $ext          = strtolower(pathinfo($filename, PATHINFO_EXTENSION)) ?: 'mp4';
        $allowedTypes = config('lms.upload_allowed_types', ['mp4','webm','mov','avi','pdf','png','jpg','jpeg','gif']);
        if (!in_array($ext, $allowedTypes)) {
            Storage::disk('local')->deleteDirectory("chunks/{$uploadId}");
            return response()->json(['message' => "File type .{$ext} is not allowed."], 422);
        }

        $finalName = uniqid('vid_', true) . '.' . $ext;

        // Merge chunks into a temp file
        $tmpPath = storage_path('app/chunks/' . $uploadId . '/merged.' . $ext);
        $out     = fopen($tmpPath, 'wb');
        if ($out === false) {
            return response()->json(['message' => 'Failed to open temp file for merging chunks.'], 500);
        }
        try {
            for ($i = 0; $i < $totalChunks; $i++) {
                $chunkData = Storage::disk('local')->get("chunks/{$uploadId}/chunk_{$i}");
                fwrite($out, $chunkData);
            }
        } finally {
            fclose($out);
        }

        $fileSize = filesize($tmpPath);
        $mimeType = mime_content_type($tmpPath) ?: 'video/mp4';

        $url       = null;
        $disk      = null;
        $finalPath = null;

        // ── STEP 1: Try Cloudinary (preferred for production — CDN + Range support) ──
        if (config('lms.cloudinary_url')) {
            try {
                $cloudinary   = new Cloudinary(config('lms.cloudinary_url'));
                $resourceType = str_starts_with($mimeType, 'video/') ? 'video' : 'auto';
                $result       = $cloudinary->uploadApi()->upload($tmpPath, [
                    'resource_type' => $resourceType,
                    'folder'        => 'ewards-lms',
                    'public_id'     => pathinfo($finalName, PATHINFO_FILENAME),
                ]);
                $url       = $result['secure_url'];
                $disk      = 'cloudinary';
                $finalPath = $result['public_id'];
            } catch (\Throwable $e) {
                Log::warning('Cloudinary upload failed, attempting local fallback.', [
                    'error' => $e->getMessage(),
                    'file'  => $filename,
                ]);
            }
        }

        // ── STEP 2: Try S3 (if configured as default) ──
        if (!$url && config('filesystems.default') === 's3') {
            try {
                $finalPath = 'uploads/' . $finalName;
                $put       = Storage::disk('s3')->put($finalPath, fopen($tmpPath, 'rb'));
                if ($put === false) {
                    throw new \RuntimeException('Storage::disk(s3)->put returned false.');
                }
                $url  = Storage::disk('s3')->url($finalPath);
                $disk = 's3';
            } catch (\Throwable $e) {
                Log::error('S3 upload failed.', ['error' => $e->getMessage(), 'file' => $filename]);
                $this->cleanupTemp($uploadId, $totalChunks, $tmpPath);
                return response()->json([
                    'message' => 'Upload to cloud storage failed: ' . $e->getMessage(),
                ], 500);
            }
        }

        // ── STEP 3: Local public disk (dev / single-server deploys) ──
        if (!$url) {
            $finalPath = 'uploads/' . $finalName;

            // Ensure public/storage symlink exists — idempotent; silently succeeds if already linked.
            $this->ensurePublicStorageLink();

            try {
                $stream = fopen($tmpPath, 'rb');
                if ($stream === false) {
                    throw new \RuntimeException('Could not open merged file for reading.');
                }
                $put = Storage::disk('public')->put($finalPath, $stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }
                if ($put === false) {
                    throw new \RuntimeException('Storage::disk(public)->put returned false — check disk space and permissions on storage/app/public/uploads.');
                }
                // Verify the file actually landed.
                if (!Storage::disk('public')->exists($finalPath)) {
                    throw new \RuntimeException('File reported as saved but not found on disk: ' . $finalPath);
                }
            } catch (\Throwable $e) {
                Log::error('Local public storage write failed.', [
                    'error' => $e->getMessage(),
                    'path'  => $finalPath,
                ]);
                $this->cleanupTemp($uploadId, $totalChunks, $tmpPath);
                return response()->json([
                    'message' => 'Failed to save file to local storage: ' . $e->getMessage(),
                ], 500);
            }

            // For local uploads, hand out the Range-enabled /media/ URL so the
            // browser can progressively stream (esp. videos). This works in both
            // `php artisan serve` and production PHP-FPM.
            $url  = rtrim(config('app.url'), '/') . '/media/' . $finalName;
            $disk = 'public';
        }

        // Success — clean up chunks and create the Media row.
        $this->cleanupTemp($uploadId, $totalChunks, $tmpPath);

        $media = Media::create([
            'filename'      => $finalName,
            'original_name' => $filename,
            'mime_type'     => $mimeType,
            'size'          => $fileSize,
            'disk'          => $disk,
            'path'          => $finalPath,
            'url'           => $url,
            'uploaded_by'   => $request->user()->id,
        ]);

        return response()->json($media, 201);
    }

    /**
     * Remove the temp merged file + all chunks. Safe to call after success or failure.
     */
    private function cleanupTemp(string $uploadId, int $totalChunks, string $tmpPath): void
    {
        for ($i = 0; $i < $totalChunks; $i++) {
            Storage::disk('local')->delete("chunks/{$uploadId}/chunk_{$i}");
        }
        @unlink($tmpPath);
        Storage::disk('local')->deleteDirectory("chunks/{$uploadId}");
    }

    /**
     * Make sure public/storage → storage/app/public exists. Required for local
     * uploads to be served as static files. Idempotent; no-op if already linked.
     *
     * Fixes the "Video unavailable — file may have been removed after deploy"
     * class of bugs where deploys forget to run `php artisan storage:link`.
     */
    private function ensurePublicStorageLink(): void
    {
        $link   = public_path('storage');
        $target = storage_path('app/public');

        if (file_exists($link)) {
            return;
        }

        try {
            if (function_exists('symlink')) {
                @symlink($target, $link);
            }
        } catch (\Throwable $e) {
            Log::warning('Could not auto-create public/storage symlink.', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
