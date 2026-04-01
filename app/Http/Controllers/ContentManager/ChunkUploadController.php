<?php

namespace App\Http\Controllers\ContentManager;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChunkUploadController extends Controller
{
    /**
     * Receive a single chunk and write it to a temp directory.
     */
    public function storeChunk(Request $request)
    {
        $request->validate([
            'chunk'        => 'required|file',
            'upload_id'    => 'required|string|max:100',
            'chunk_index'  => 'required|integer|min:0',
            'total_chunks' => 'required|integer|min:1',
            'filename'     => 'required|string|max:255',
        ]);

        $uploadId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $request->input('upload_id'));
        $index    = (int) $request->input('chunk_index');

        // Store chunk via Laravel so it works on any disk/OS
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

        // Build final file path
        $ext       = strtolower(pathinfo($filename, PATHINFO_EXTENSION)) ?: 'mp4';
        $finalName = uniqid('vid_', true) . '.' . $ext;
        $finalPath = 'uploads/' . $finalName;          // relative to public disk
        $disk      = config('filesystems.default', 'public');

        // Merge chunks into a temp file first, then push to the target disk
        $tmpPath = storage_path('app/chunks/' . $uploadId . '/merged.' . $ext);
        $out = fopen($tmpPath, 'wb');
        for ($i = 0; $i < $totalChunks; $i++) {
            $chunkData = Storage::disk('local')->get("chunks/{$uploadId}/chunk_{$i}");
            fwrite($out, $chunkData);
        }
        fclose($out);

        // Move merged file to target disk
        if ($disk === 's3') {
            Storage::disk('s3')->put($finalPath, fopen($tmpPath, 'rb'));
            $url = Storage::disk('s3')->url($finalPath);
        } else {
            Storage::disk('public')->put($finalPath, fopen($tmpPath, 'rb'));
            $url = '/storage/' . $finalPath;
        }

        $fileSize = filesize($tmpPath);
        $mimeType = mime_content_type($tmpPath) ?: 'video/mp4';

        // B4: Validate allowed file types
        $allowedTypes = config('lms.upload_allowed_types', ['mp4','webm','mov','avi','pdf','png','jpg','jpeg','gif']);
        if (!in_array($ext, $allowedTypes)) {
            @unlink($tmpPath);
            Storage::disk('local')->deleteDirectory("chunks/{$uploadId}");
            return response()->json(['message' => "File type .{$ext} is not allowed."], 422);
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
