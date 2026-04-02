<?php
namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Models\TrainingSection;
use App\Models\TrainingProgress;
use App\Models\SectionView;
use App\Models\Certificate;
use Illuminate\Http\Request;

class ProgressController extends Controller
{
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

    public function markHelpViewed(Request $request, int $moduleId)
    {
        $module = TrainingModule::findOrFail($moduleId);
        $userId = $request->user()->id;

        $progress = TrainingProgress::updateOrCreate(
            ['user_id' => $userId, 'module_id' => $moduleId],
            ['help_viewed' => true, 'help_viewed_at' => now()]
        );

        $this->updateProgressPercent($progress, $module);
        $this->checkModuleCompletion($progress);

        return response()->json(['success' => true, 'progress' => $progress->fresh()]);
    }

    public function updateChecklist(Request $request, int $moduleId)
    {
        $request->validate([
            'checklist_item_id' => 'required',
            'checked' => 'required|boolean',
        ]);

        $module = TrainingModule::with('checklists')->findOrFail($moduleId);
        $userId = $request->user()->id;

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

        $this->updateProgressPercent($progress->fresh(), $module);
        $this->checkModuleCompletion($progress->fresh());

        return response()->json([
            'success' => true,
            'checklist_completed' => $allChecked,
            'progress' => $progress->fresh(),
        ]);
    }

    public function reset(Request $request, int $moduleId)
    {
        TrainingProgress::where('user_id', $request->user()->id)
            ->where('module_id', $moduleId)
            ->delete();

        return response()->json(['success' => true, 'message' => 'Progress reset']);
    }

    public function saveResume(Request $request, int $moduleId)
    {
        $request->validate(['section_id' => 'required|exists:lms_sections,id']);

        $progress = TrainingProgress::updateOrCreate(
            ['user_id' => $request->user()->id, 'module_id' => $moduleId],
            ['last_section_id' => $request->section_id]
        );

        return response()->json(['success' => true]);
    }

    private function updateProgressPercent(TrainingProgress $progress, TrainingModule $module): void
    {
        $totalSteps = 2; // help + checklist
        if ($module->quiz_enabled) $totalSteps = 3;
        $completedSteps = 0;
        if ($progress->help_viewed) $completedSteps++;
        if ($progress->checklist_completed) $completedSteps++;
        if ($progress->quiz_completed) $completedSteps++;
        $progress->progress_percent = round(($completedSteps / $totalSteps) * 100);
        $progress->save();
    }

    private function checkModuleCompletion(TrainingProgress $progress): ?array
    {
        $module = TrainingModule::find($progress->module_id);

        // Completion requires: help_viewed always + quiz if quiz_enabled + optional checklist flag
        $basicComplete = true;
        if (!$progress->help_viewed) $basicComplete = false;
        if ($module->quiz_enabled && !$progress->quiz_completed) $basicComplete = false;
        if ($module->require_checklist && !$progress->checklist_completed) $basicComplete = false;

        // Also verify all required (key) sections have been viewed
        $requiredSections = TrainingSection::where('module_id', $progress->module_id)
            ->where('is_required', true)
            ->pluck('id');

        $requiredSectionsViewed = true;
        if ($requiredSections->isNotEmpty()) {
            $viewedIds = SectionView::where('user_id', $progress->user_id)
                ->whereIn('section_id', $requiredSections)
                ->pluck('section_id');
            $requiredSectionsViewed = $requiredSections->diff($viewedIds)->isEmpty();
        }

        if ($basicComplete && $requiredSectionsViewed) {
            if (!$progress->module_completed) {
                $progress->update([
                    'module_completed' => true,
                    'module_completed_at' => now(),
                ]);

                // Award module completion points (50 or module.points_reward)
                $user = $progress->user;
                $pointsAwarded = $module->points_reward ?: 50;
                $user->increment('points', $pointsAwarded);

                // Check if all modules completed -> auto-issue certificate
                $this->checkAllModulesCompleted($user->fresh());

                $certUnlocked = Certificate::where('user_id', $user->id)
                    ->where('module_id', $module->id)
                    ->exists();

                $freshUser = $user->fresh();
                $oldLevel = self::getUserLevel($freshUser->points - $pointsAwarded);
                $newLevel = self::getUserLevel($freshUser->points);
                $levelUp = $oldLevel !== $newLevel;

                return [
                    'title' => 'Module Completed!',
                    'message' => "You completed {$module->title}",
                    'points_earned' => $pointsAwarded,
                    'certificate_unlocked' => $certUnlocked,
                    'level_up' => $levelUp,
                    'new_level' => $newLevel,
                    'total_points' => $freshUser->points,
                    'share_text' => "Just completed {$module->title} on eWards Learning Hub!",
                ];
            }
        }

        return null;
    }

    private function checkAllModulesCompleted($user): void
    {
        $totalPublished = TrainingModule::where('is_published', true)->count();
        $completedCount = TrainingProgress::where('user_id', $user->id)
            ->where('module_completed', true)
            ->count();

        // Path certificate when all modules completed
        if ($completedCount >= $totalPublished && $totalPublished > 0) {
            Certificate::firstOrCreate(
                ['user_id' => $user->id, 'certificate_type' => 'path'],
                [
                    'issued_at' => now(),
                    'certificate_code' => 'EWPATH-' . str_pad($user->id, 6, '0', STR_PAD_LEFT),
                ]
            );
        }

        // Expert certificate when user has 300+ points
        if ($user->points >= 300) {
            Certificate::firstOrCreate(
                ['user_id' => $user->id, 'certificate_type' => 'expert'],
                [
                    'issued_at' => now(),
                    'certificate_code' => 'EWEXP-' . str_pad($user->id, 6, '0', STR_PAD_LEFT),
                ]
            );
        }
    }
}
