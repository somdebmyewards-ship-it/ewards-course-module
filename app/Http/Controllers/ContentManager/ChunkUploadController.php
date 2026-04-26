<?php

namespace App\Http\Controllers\ContentManager;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Cloudinary\Cloudinary;

class ChunkUploadController extends Controller
{
    /**
     * Receive a single chunk and write it to a temp directory.
     */
    // B4: Chunk uploads are strictly for video files only
    private const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'avi'];
    private const ALLOWED_VIDEO_MIMETYPES  = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];

    public function storeChunk(Request $request)
    {
        $request->validate([
            'chunk'        => 'required|file|max:10240|mimetypes:video/mp4,video/webm,video/quicktime,video/x-msvideo,application/octet-stream',
            'upload_id'    => 'required|string|max:100',
            'chunk_index'  => 'required|integer|min:0',
            'total_chunks' => 'required|integer|min:1|max:500',
            'filename'     => 'required|string|max:255',
        ]);

        // B4: Validate filename extension — video files only for chunk uploads
        $ext = strtolower(pathinfo($request->input('filename'), PATHINFO_EXTENSION));
        if (!in_array($ext, self::ALLOWED_VIDEO_EXTENSIONS)) {
            return response()->json(['message' => "Only video files (mp4, webm, mov, avi) are allowed for chunk upload. Got: .{$ext}"], 422);
        }

        $uploadId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $request->input('upload_id'));
        $index    = (int) $request->input('chunk_index');

        $chunkPath = "chunks/{$uploadId}/chunk_{$index}";
        Storage::disk('local')->put($chunkPath, file_get_contents($request->file('chunk')->getRealPath()));

        return response()->json(['received' => true]);
    }

    /**
     * Merge all chunks, store the final file, create a Media record.
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

        $ext       = strtolower(pathinfo($filename, PATHINFO_EXTENSION)) ?: 'mp4';
        $finalName = uniqid('vid_', true) . '.' . $ext;

        // B4: Validate allowed file types — video only for chunk uploads
        if (!in_array($ext, self::ALLOWED_VIDEO_EXTENSIONS)) {
            Storage::disk('local')->deleteDirectory("chunks/{$uploadId}");
            return response()->json(['message' => "Only video files (mp4, webm, mov, avi) are allowed for chunk upload. Got: .{$ext}"], 422);
        }

        // Merge chunks into a temp file
        $tmpPath = storage_path('app/chunks/' . $uploadId . '/merged.' . $ext);
        $out = fopen($tmpPath, 'wb');
        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkData = Storage::disk('local')->get("chunks/{$uploadId}/chunk_{$i}");
            fwrite($out, $chunkData);
        }
        fclose($out);

        $fileSize = filesize($tmpPath);
        $mimeType = mime_content_type($tmpPath) ?: 'video/mp4';

        // Upload to Cloudinary if configured, otherwise fall back to local/s3
        if (config('lms.cloudinary_url')) {
            $cloudinary = new Cloudinary(config('lms.cloudinary_url'));
            $resourceType = str_starts_with($mimeType, 'video/') ? 'video' : 'auto';
            $result = $cloudinary->uploadApi()->upload($tmpPath, [
                'resource_type' => $resourceType,
                'folder'        => 'ewards-lms',
                'public_id'     => pathinfo($finalName, PATHINFO_FILENAME),
            ]);
            $url  = $result['secure_url'];
            $disk = 'cloudinary';
            $finalPath = $result['public_id'];
        } else {
            $finalPath = 'uploads/' . $finalName;
            $disk = config('filesystems.default', 'public');
            if ($disk === 's3') {
                Storage::disk('s3')->put($finalPath, fopen($tmpPath, 'rb'));
                $url = Storage::disk('s3')->url($finalPath);
            } else {
                Storage::disk('public')->put($finalPath, fopen($tmpPath, 'rb'));
                $url = rtrim(config('app.url'), '/') . '/storage/' . $finalPath;
            }
        }

        // Clean up temp chunks and merged temp file
        for ($i = 0; $i < $totalChunks; $i++) {
            Storage::disk('local')->delete("chunks/{$uploadId}/chunk_{$i}");
        }
        @unlink($tmpPath);
        Storage::disk('local')->deleteDirectory("chunks/{$uploadId}");

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
}
