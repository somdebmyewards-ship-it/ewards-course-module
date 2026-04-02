<?php

namespace App\Http\Controllers\ContentManager;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ModuleCrudController extends Controller
{
    public function index()
    {
        $modules = TrainingModule::orderBy('display_order')
            ->withCount(['sections', 'checklists', 'quizzes'])
            ->get();
        return response()->json($modules);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'icon' => 'nullable|string|max:50',
            'display_order' => 'nullable|integer',
            'video_url' => 'nullable|string|max:500',
            'points_reward' => 'nullable|integer|min:0',
            'is_published' => 'nullable|boolean',
            'page_route' => 'nullable|string|max:255',
        ]);

        $validated['slug'] = Str::slug($validated['title']);
        $validated['display_order'] = $validated['display_order'] ?? (TrainingModule::max('display_order') + 1);

        $module = TrainingModule::create($validated);
        Cache::forget('published_modules');
        return response()->json($module, 201);
    }

    public function show(int $id)
    {
        $module = TrainingModule::with(['sections', 'checklists', 'quizzes'])->findOrFail($id);
        return response()->json($module);
    }

    public function update(Request $request, int $id)
    {
        $module = TrainingModule::findOrFail($id);
        $validated = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'slug'                => 'sometimes|string|max:255|unique:lms_modules,slug,' . $id,
            'description'         => 'sometimes|nullable|string',
            'icon'                => 'nullable|string|max:500',
            'display_order'       => 'filled|integer|min:1',
            'video_url'           => 'nullable|string|max:500',
            'image_urls'          => 'nullable|array',
            'document_urls'       => 'nullable|array',
            'points_reward'       => 'filled|integer|min:0',
            'estimated_minutes'   => 'nullable|integer|min:1',
            'is_published'        => 'nullable|boolean',
            'quiz_enabled'        => 'nullable|boolean',
            'require_help_viewed' => 'nullable|boolean',
            'require_checklist'   => 'nullable|boolean',
            'require_quiz'        => 'nullable|boolean',
            'certificate_enabled' => 'nullable|boolean',
            'page_route'          => 'nullable|string|max:255',
        ]);

        // Auto-regenerate slug only when title changes and slug was not explicitly provided
        if (isset($validated['title']) && $validated['title'] !== $module->title && !isset($validated['slug'])) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        // Laravel's ConvertEmptyStringsToNull middleware turns '' into null.
        // For optional string fields, drop null from the update so the existing
        // DB value is preserved (keeps saved video_url, page_route, icon intact).
        foreach (['video_url', 'page_route', 'icon', 'description'] as $col) {
            if (array_key_exists($col, $validated) && $validated[$col] === null) {
                unset($validated[$col]);
            }
        }

        $module->update($validated);
        Cache::forget('published_modules');
        Cache::forget("module_{$module->slug}");
        return response()->json($module->fresh());
    }

    public function destroy(int $id)
    {
        $module = TrainingModule::findOrFail($id);
        Cache::forget('published_modules');
        Cache::forget("module_{$module->slug}");
        $module->delete();
        return response()->json(['success' => true]);
    }
}
