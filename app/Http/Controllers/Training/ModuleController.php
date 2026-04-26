<?php
namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Models\SectionView;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ModuleController extends Controller
{
    public function index(Request $request)
    {
        // Cache the published modules list for 5 minutes (shared across all users)
        $modules = Cache::remember('published_modules', 300, function () {
            return TrainingModule::where('is_published', true)
                ->orderBy('display_order')
                ->withCount(['sections', 'checklists', 'quizzes'])
                ->get();
        });

        $user = $request->user();
        $progressMap = [];
        if ($user) {
            $progress = $user->progress()->get()->keyBy('module_id');

            $viewedCounts = SectionView::where('user_id', $user->id)
                ->selectRaw('module_id, COUNT(DISTINCT section_id) as cnt')
                ->groupBy('module_id')
                ->pluck('cnt', 'module_id');

            foreach ($progress as $p) {
                $progressMap[$p->module_id] = [
                    'help_viewed' => $p->help_viewed,
                    'checklist_state' => $p->checklist_state ?? [],
                    'checklist_completed' => $p->checklist_completed,
                    'quiz_completed' => $p->quiz_completed,
                    'quiz_score' => $p->quiz_score,
                    'module_completed' => $p->module_completed,
                    'last_section_id' => $p->last_section_id,
                    'viewed_sections_count' => (int) ($viewedCounts[$p->module_id] ?? 0),
                ];
            }
        }

        $result = $modules->map(function ($m) use ($progressMap) {
            $arr = $m->toArray();
            $arr['progress'] = $progressMap[$m->id] ?? null;
            return $arr;
        });

        $recommended = $modules->filter(function ($m) use ($progressMap) {
            return !isset($progressMap[$m->id]) || !$progressMap[$m->id]['module_completed'];
        })->take(3)->values();

        return response()->json([
            'modules' => $result,
            'recommended' => $recommended,
        ]);
    }

    public function show(Request $request, string $slug)
    {
        // Cache each module's static data for 5 minutes
        $module = Cache::remember("module_{$slug}", 300, function () use ($slug) {
            return TrainingModule::where('slug', $slug)
                ->where('is_published', true)
                ->with(['sections', 'checklists', 'quizzes', 'quizMetadata'])
                ->first();
        });

        if (!$module) {
            return response()->json(['message' => 'Module not found'], 404);
        }

        $user = $request->user();
        $progress = null;
        if ($user) {
            $progress = $user->progress()->where('module_id', $module->id)->first();
        }

        $result = $module->toArray();
        $result['progress'] = $progress ? [
            'help_viewed' => $progress->help_viewed,
            'checklist_state' => $progress->checklist_state ?? [],
            'checklist_completed' => $progress->checklist_completed,
            'quiz_completed' => $progress->quiz_completed,
            'quiz_score' => $progress->quiz_score,
            'module_completed' => $progress->module_completed,
            'last_section_id' => $progress->last_section_id,
        ] : null;

        // Bundle bookmarks, feedback, assistant status to avoid 4 separate API calls
        $userId = $user?->id;
        $result['_bookmarks'] = $userId
            ? \App\Models\Bookmark::where('user_id', $userId)->pluck('section_id')
            : [];

        $result['_feedback'] = $userId
            ? \App\Models\ModuleFeedback::where('user_id', $userId)->where('module_id', $module->id)->first()
            : null;

        $result['_assistant_status'] = null;
        if ($userId && class_exists(\App\Models\ModuleAiConfig::class)) {
            try {
                $aiConfig = \App\Models\ModuleAiConfig::where('module_id', $module->id)->first();
                if ($aiConfig) {
                    $result['_assistant_status'] = [
                        'enabled' => (bool) $aiConfig->enabled,
                        'indexed' => (bool) $aiConfig->indexed_at,
                        'chunk_count' => $aiConfig->chunk_count ?? 0,
                    ];
                }
            } catch (\Exception $e) {}
        }

        return response()->json($result);
    }
}
