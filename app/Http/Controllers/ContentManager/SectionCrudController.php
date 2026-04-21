<?php

namespace App\Http\Controllers\ContentManager;

use App\Http\Controllers\Controller;
use App\Models\TrainingSection;
use Illuminate\Http\Request;

class SectionCrudController extends Controller
{
    public function store(Request $request, int $moduleId)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'nullable|string',
            'content_type' => 'nullable|in:text,video,image,document',
            'media_url' => 'nullable|string|max:500',
            'display_order' => 'nullable|integer',
            'key_takeaway' => 'nullable|string',
            'try_this_action' => 'nullable|string',
            'is_required' => 'nullable|boolean',
            'video_url' => 'nullable|string|max:500',
            'status' => 'nullable|in:published,draft',
        ]);

        $validated['module_id'] = $moduleId;
        $validated['display_order'] = $validated['display_order'] ?? (TrainingSection::where('module_id', $moduleId)->max('display_order') + 1);
        $validated['body'] = $validated['body'] ?? '';

        $section = TrainingSection::create($validated);
        return response()->json($section, 201);
    }

    public function update(Request $request, int $id)
    {
        $section = TrainingSection::findOrFail($id);
        $data = array_filter(
            $request->only(['title', 'body', 'content_type', 'media_url', 'video_url', 'display_order', 'key_takeaway', 'try_this_action', 'is_required', 'status']),
            fn($v) => $v !== null
        );
        $section->update($data);
        return response()->json($section->fresh());
    }

    public function destroy(int $id)
    {
        TrainingSection::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
