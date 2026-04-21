<?php

namespace App\Http\Controllers\ContentManager;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Cloudinary\Cloudinary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class MediaUploadController extends Controller
{
    public function index(Request $request)
    {
        $media = Media::orderBy('created_at', 'desc')->limit(100)->get();
        return response()->json($media);
    }

    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:102400', // 100 MB max
        ]);

        $file     = $request->file('file');
        $mimeType = $file->getMimeType();

        $url  = null;
        $disk = null;
        $path = null;

        // ── STEP 1: Cloudinary (preferred for production) ──
        if (config('lms.cloudinary_url')) {
            try {
                $cloudinary   = new Cloudinary(config('lms.cloudinary_url'));
                $resourceType = str_starts_with($mimeType, 'video/') ? 'video'
                    : (str_starts_with($mimeType, 'image/') ? 'image' : 'auto');
                $result = $cloudinary->uploadApi()->upload($file->getRealPath(), [
                    'resource_type' => $resourceType,
                    'folder'        => 'ewards-lms',
                ]);
                $url  = $result['secure_url'];
                $disk = 'cloudinary';
                $path = $result['public_id'];
            } catch (\Throwable $e) {
                Log::warning('Cloudinary upload failed, attempting local fallback.', [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // ── STEP 2: Filesystem fallback (S3 or local public) ──
        if (!$url) {
            $defaultDisk = config('filesystems.default', 'public');

            try {
                if ($defaultDisk === 's3') {
                    $path = $file->store('uploads', 's3');
                    if (!$path) {
                        throw new \RuntimeException('S3 store returned empty path.');
                    }
                    $url  = Storage::disk('s3')->url($path);
                    $disk = 's3';
                } else {
                    $this->ensurePublicStorageLink();
                    $path = $file->store('uploads', 'public');
                    if (!$path) {
                        throw new \RuntimeException('Local store returned empty path.');
                    }
                    if (!Storage::disk('public')->exists($path)) {
                        throw new \RuntimeException('File reported as saved but not found on disk: ' . $path);
                    }
                    // Videos go through the Range-enabled streamer; everything else
                    // can use the static /storage URL.
                    $filename = basename($path);
                    $url = str_starts_with($mimeType, 'video/')
                        ? rtrim(config('app.url'), '/') . '/media/' . $filename
                        : rtrim(config('app.url'), '/') . '/storage/' . $path;
                    $disk = 'public';
                }
            } catch (\Throwable $e) {
                Log::error('Media upload failed.', [
                    'error' => $e->getMessage(),
                    'disk'  => $defaultDisk,
                ]);
                return response()->json([
                    'message' => 'Failed to save file: ' . $e->getMessage(),
                ], 500);
            }
        }

        $media = Media::create([
            'filename'      => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'mime_type'     => $mimeType,
            'size'          => $file->getSize(),
            'disk'          => $disk,
            'path'          => $path,
            'url'           => $url,
            'uploaded_by'   => $request->user()->id,
        ]);

        return response()->json($media, 201);
    }

    public function destroy(int $id)
    {
        $media = Media::findOrFail($id);
        if ($media->disk === 'cloudinary' && config('lms.cloudinary_url')) {
            $cloudinary = new Cloudinary(config('lms.cloudinary_url'));
            $cloudinary->uploadApi()->destroy($media->path);
        } else {
            Storage::disk($media->disk)->delete($media->path);
        }
        $media->delete();
        return response()->json(['success' => true]);
    }

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
