<?php

namespace App\Http\Controllers\ContentManager;

use App\Http\Controllers\Controller;
use App\Models\Media;
use Illuminate\Http\Request;
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
            'file' => 'required|file|max:102400', // 100MB max
        ]);

        $file = $request->file('file');
        $disk = config('filesystems.default', 'public');
        $path = $file->store('uploads', $disk);
        $url = $disk === 's3'
            ? Storage::disk('s3')->url($path)
            : rtrim(config('app.url'), '/') . '/storage/' . $path;

        $media = Media::create([
            'filename' => basename($path),
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'disk' => $disk,
            'path' => $path,
            'url' => $url,
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json($media, 201);
    }

    public function destroy(int $id)
    {
        $media = Media::findOrFail($id);
        Storage::disk($media->disk)->delete($media->path);
        $media->delete();
        return response()->json(['success' => true]);
    }
}
