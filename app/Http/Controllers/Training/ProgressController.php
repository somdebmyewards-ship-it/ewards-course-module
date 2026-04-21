<?php
namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Models\TrainingSection;
use App\Models\TrainingProgress;
use App\Models\SectionView;
use App\Models\Certificate;
use App\Models\PointsLedger;
use App\Services\CompletionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProgressController extends Controller
{
    public function __construct(private CompletionService $completion) {}

    public static function getUserLevel(int $points): string
    {
        if ($points >= 500) return 'Expert';
        if ($points >= 250) return 'Specialist';
        if ($points >= 100) return 'Practitioner';
        return 'Beginner';
    }

    public static function getNextLevelInfo(int $points): array
    {
        if ($points >= 500) return ['next_level' => null, 'points_needed' => 0, 'current_min' => 500, 'next_min' => 500];
        if ($points >= 250) return ['next_level' => 'Expert', 'points_needed' => 500 - $points, 'current_min' => 250, 'next_min' => 500];
        if ($points >= 100) return ['next_level' => 'Specialist', 'points_needed' => 250 - $points, 'current_min' => 100, 'next_min' => 250];
        return ['next_level' => 'Practitioner', 'points_needed' => 100 - $points, 'current_min' => 0, 'next_min' => 100];
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $modules = TrainingModule::where('is_published', true)->orderBy('display_order')->get();
        $progress = $user->progress()->with('module')->get()->keyBy('module_id');

        $result = $modules->map(function ($m) use ($progress) {
            $p = $progress->get($m->id);
            return [
                'module_id' => $m->id,
                'slug' => $m->slug,
                'title' => $m->title,
                'icon' => $m->icon,
                'help_viewed' => $p?->help_viewed ?? false,
                'checklist_completed' => $p?->checklist_completed ?? false,
                'prototype_completed' => $p?->prototype_completed ?? false,
                'quiz_completed' => $p?->quiz_completed ?? false,
                'quiz_score' => $p?->quiz_score ?? 0,
                'module_completed' => $p?->module_completed ?? false,
                'last_section_id' => $p?->last_section_id,
            ];
        });

        $completedCount = $result->where('module_completed', true)->count();
        $totalModules = $modules->count();

        return response()->json([
            'modules' => $result,
            'completed' => $completedCount,
            'total' => $totalModules,
            'percentage' => $totalModules > 0 ? round(($completedCount / $totalModules) * 100) : 0,
            'certified' => Certificate::where('user_id', $request->user()->id)->exists(),
        ]);
    }

    public function takeaways(Request $request)
    {
        $user = $request->user();
        $completedModuleIds = TrainingProgress::where('user_id', $user->id)
            ->where('module_completed', true)
            ->pluck('module_id');

        $takeaways = TrainingSection::whereIn('module_id', $completedModuleIds)
            ->whereNotNull('key_takeaway')
            ->where('key_takeaway', '!=', '')
            ->with('module:id,title,slug')
            ->get(['id', 'module_id', 'title', 'key_takeaway']);

        return response()->json($takeaways);
    }

    public function show(Request $request, int $moduleId)
    {
        $progress = TrainingProgress::where('user_id', $request->user()->id)
            ->where('module_id', $moduleId)
            ->first();

        if (!$progress) {
            return response()->json(['message' => 'No progress found'], 404);
        }

        return response()->json($progress);
    }

    // A2: Wrap mutations in DB::transaction
    public function markHelpViewed(Request $request, int $moduleId)
    {
        // D1: Verify module is published
        $module = TrainingModule::where('is_published', true)->findOrFail($moduleId);
        $userId = $request->user()->id;

        $result = DB::transaction(function () use ($userId, $moduleId, $module) {
            $progress = TrainingProgress::updateOrCreate(
                ['user_id' => $userId, 'module_id' => $moduleId],
                ['help_viewed' => true, 'help_viewed_at' => now()]
            );

            $this->updateProgressPercent($progress, $module);
            $progress->refresh();
            $achievement = $this->completion->checkAndComplete($progress);

            return ['progress' => $progress, 'achievement' => $achievement];
        });

        return response()->json([
            'success' => true,
            'progress' => $result['progress'],
            'achievement' => $result['achievement'],
        ]);
    }

    // A2: Wrap mutations in DB::transaction
    public function updateChecklist(Request $request, int $moduleId)
    {
        $request->validate([
            'checklist_item_id' => 'required',
            'checked' => 'required|boolean',
        ]);

        // D1: Verify module is published
        $module = TrainingModule::where('is_published', true)
            ->with('checklists')
            ->findOrFail($moduleId);
        $userId = $request->user()->id;

        $result = DB::transaction(function () use ($request, $userId, $moduleId, $module) {
            $progress = TrainingProgress::updateOrCreate(
                ['user_id' => $userId, 'module_id' => $moduleId],
                []
            );

            $state = $progress->checklist_state ?? [];
            $state[$request->checklist_item_id] = $request->checked;

            $allChecked = $module->checklists->every(fn($item) => !empty($state[$item->id]));

            $progress->update([
                'checklist_state' => $state,
                'checklist_completed' => $allChecked,
                'checklist_completed_at' => $allChecked ? now() : null,
            ]);

            $progress->refresh();
            $this->updateProgressPercent($progress, $module);
            $progress->refresh();
            $achievement = $this->completion->checkAndComplete($progress);

            return [
                'checklist_completed' => $allChecked,
                'progress' => $progress,
                'achievement' => $achievement,
            ];
        });

        return response()->json([
            'success' => true,
            'checklist_completed' => $result['checklist_completed'],
            'progress' => $result['progress'],
            'achievement' => $result['achievement'],
        ]);
    }

    public function reset(Request $request, int $moduleId)
    {
        $userId = $request->user()->id;
        TrainingProgress::where('user_id', $userId)->where('module_id', $moduleId)->delete();
        // Also clear section views so required-section completion checks start fresh
        SectionView::where('user_id', $userId)->where('module_id', $moduleId)->delete();

        return response()->json(['success' => true, 'message' => 'Progress reset']);
    }

    public function saveResume(Request $request, int $moduleId)
    {
        // D2: Validate section belongs to this module
        $request->validate([
            'section_id' => [
                'required',
                'exists:lms_sections,id',
                function ($attribute, $value, $fail) use ($moduleId) {
                    $exists = TrainingSection::where('id', $value)
                        ->where('module_id', $moduleId)
                        ->exists();
                    if (!$exists) {
                        $fail('The section does not belong to this module.');
                    }
                },
            ],
        ]);

        TrainingProgress::updateOrCreate(
            ['user_id' => $request->user()->id, 'module_id' => $moduleId],
            ['last_section_id' => $request->section_id]
        );

        return response()->json(['success' => true]);
    }

    public function updatePrototype(Request $request, int $moduleId)
    {
        $request->validate([
            'flow_id' => 'required|string',
            'completed' => 'required|boolean',
        ]);

        // D1: Verify module is published and has prototype (URL or config)
        $module = TrainingModule::where('is_published', true)->findOrFail($moduleId);

        if (!$module->prototype_url && !$module->prototype_config) {
            return response()->json(['message' => 'This module does not have a prototype practice step.'], 404);
        }

        $userId = $request->user()->id;
        $isHtmlPrototype = (bool) $module->prototype_url;

        $result = DB::transaction(function () use ($request, $userId, $moduleId, $module, $isHtmlPrototype) {
            $progress = TrainingProgress::updateOrCreate(
                ['user_id' => $userId, 'module_id' => $moduleId],
                []
            );

            // Merge the flow completion status into prototype_progress JSON
            $prototypeProgress = $progress->prototype_progress ?? [];
            $prototypeProgress[$request->flow_id] = $request->completed;

            $updateData = ['prototype_progress' => $prototypeProgress];

            if ($isHtmlPrototype) {
                // HTML-upload prototype: single flow_id 'html_prototype' — complete immediately
                $allDone = $request->completed;
            } else {
                // Legacy JSON config: check if all required flows are done
                $config = $module->prototype_config;
                $requiredFlowIds = collect($config['flows'] ?? [])->pluck('id')->toArray();
                $allDone = !empty($requiredFlowIds) && collect($requiredFlowIds)->every(
                    fn($flowId) => !empty($prototypeProgress[$flowId])
                );
            }

            $firstCompletion = false;
            if ($allDone && !$progress->prototype_completed) {
                $updateData['prototype_completed'] = true;
                $updateData['prototype_completed_at'] = now();
                $firstCompletion = true;
            }

            $progress->update($updateData);

            // Award points when prototype first completed
            if ($firstCompletion) {
                $pointsReward = $isHtmlPrototype ? 30 : ($module->prototype_config['points_reward'] ?? 30);
                $request->user()->increment('points', $pointsReward);
                PointsLedger::record($userId, $pointsReward, 'prototype_complete', $moduleId);
            }

            $progress->refresh();
            $this->updateProgressPercent($progress, $module);
            $progress->refresh();
            $achievement = $this->completion->checkAndComplete($progress);

            return [
                'prototype_progress' => $prototypeProgress,
                'prototype_completed' => $allDone,
                'first_completion' => $firstCompletion,
                'progress' => $progress,
                'achievement' => $achievement,
            ];
        });

        return response()->json([
            'success' => true,
            'prototype_progress' => $result['prototype_progress'],
            'prototype_completed' => $result['prototype_completed'],
            'first_completion' => $result['first_completion'],
            'progress' => $result['progress'],
            'achievement' => $result['achievement'],
        ]);
    }

    private function updateProgressPercent(TrainingProgress $progress, TrainingModule $module): void
    {
        $totalSteps = 2; // help + checklist
        if ($module->prototype_url || $module->prototype_config) $totalSteps++;
        if ($module->quiz_enabled) $totalSteps++;
        $completedSteps = 0;
        if ($progress->help_viewed) $completedSteps++;
        if ($progress->checklist_completed) $completedSteps++;
        if ($progress->prototype_completed) $completedSteps++;
        if ($progress->quiz_completed) $completedSteps++;
        $progress->progress_percent = round(($completedSteps / $totalSteps) * 100);
        $progress->save();
    }
}
