<?php

namespace App\Services;

use App\Http\Controllers\Training\ProgressController;
use App\Models\Certificate;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\PointsLedger;
use App\Models\User;
use Illuminate\Support\Str;
use App\Services\BadgeService;

class CompletionService
{
    /**
     * Check and process module completion for a user.
     * Awards points, issues certificates (module, path, expert).
     * Returns achievement data if module was newly completed, null otherwise.
     *
     * MUST be called inside a DB::transaction.
     */
    public function checkAndComplete(TrainingProgress $progress, int $bonusPoints = 0): ?array
    {
        $module = TrainingModule::find($progress->module_id);
        if (!$module) return null;

        $basicComplete = true;
        if ($module->require_help_viewed && !$progress->help_viewed) $basicComplete = false;
        if ($module->quiz_enabled && !$progress->quiz_completed) $basicComplete = false;
        if ($module->require_checklist && !$progress->checklist_completed) $basicComplete = false;
        if (($module->prototype_url || $module->prototype_config) && !$progress->prototype_completed) $basicComplete = false;

        // Verify all required sections have been viewed
        $requiredSections = \App\Models\TrainingSection::where('module_id', $progress->module_id)
            ->where('is_required', true)
            ->pluck('id');

        if ($requiredSections->isNotEmpty()) {
            $viewedIds = \App\Models\SectionView::where('user_id', $progress->user_id)
                ->whereIn('section_id', $requiredSections)
                ->pluck('section_id');
            if ($requiredSections->diff($viewedIds)->isNotEmpty()) {
                $basicComplete = false;
            }
        }

        if (!$basicComplete || $progress->module_completed) {
            return null;
        }

        // D4: Capture BEFORE update so the check is against the original DB value
        $wasAlreadyAwarded = (bool) $progress->points_awarded;

        $progress->update([
            'module_completed' => true,
            'module_completed_at' => now(),
            'points_awarded' => true,
        ]);

        $user = User::find($progress->user_id);
        // D4: Only award points once — restarted modules do not re-earn completion points
        $modulePoints = 0;
        if (!$wasAlreadyAwarded) {
            $modulePoints = $module->points_reward ?: 50;
            $user->increment('points', $modulePoints);
            PointsLedger::record($user->id, $modulePoints, 'module_complete', $module->id);
        }

        // Issue certificates
        $certUnlocked = false;
        $userId = $user->id;

        // Module certificate
        if ($module->certificate_enabled) {
            $this->issueCertificate($userId, 'module', $module->id);
            $certUnlocked = true;
        }

        // Path certificate — all published modules completed
        $totalPublished = TrainingModule::where('is_published', true)->count();
        $completedCount = TrainingProgress::where('user_id', $userId)->where('module_completed', true)->count();
        if ($completedCount >= $totalPublished && $totalPublished > 0) {
            $this->issueCertificate($userId, 'path');
            $certUnlocked = true;
        }

        // Expert certificate — 500+ points (D5: aligned with Expert level threshold)
        $freshUser = $user->fresh();
        if ($freshUser->points >= 500) {
            $this->issueCertificate($userId, 'expert');
            $certUnlocked = true;
        }

        // Award badges
        $badgeService = app(BadgeService::class);
        $badgeService->onModuleCompleted($userId);
        if ($certUnlocked) $badgeService->onCertificateIssued($userId);
        $badgeService->onPointsChanged($freshUser);

        $totalPointsEarned = $modulePoints + $bonusPoints;
        $oldLevel = ProgressController::getUserLevel($freshUser->points - $totalPointsEarned);
        $newLevel = ProgressController::getUserLevel($freshUser->points);

        return [
            'title' => 'Module Completed!',
            'message' => "You completed {$module->title}",
            'points_earned' => $totalPointsEarned,
            'module_points' => $modulePoints,
            'quiz_bonus' => $bonusPoints,
            'certificate_unlocked' => $certUnlocked,
            'level_up' => $oldLevel !== $newLevel,
            'new_level' => $newLevel,
            'total_points' => $freshUser->points,
            'share_text' => "Just completed {$module->title} on eWards Learning Hub!",
        ];
    }

    /**
     * Auto-issue any certificates the user has earned but not yet received.
     * Called by CertificateController on read endpoints.
     */
    public function autoIssueMissing(int $userId): void
    {
        $user = User::find($userId);
        if (!$user) return;

        // Path certificate
        $totalPublished = TrainingModule::where('is_published', true)->count();
        $completedCount = TrainingProgress::where('user_id', $userId)
            ->where('module_completed', true)->count();
        if ($completedCount >= $totalPublished && $totalPublished > 0) {
            $this->issueCertificate($userId, 'path');
        }

        // Expert certificate — 500+ points (D5)
        if ($user->points >= 500) {
            $this->issueCertificate($userId, 'expert');
        }

        // Per-module certificates
        $completedModuleIds = TrainingProgress::where('user_id', $userId)
            ->where('module_completed', true)->pluck('module_id');
        $enabledModules = TrainingModule::whereIn('id', $completedModuleIds)
            ->where('certificate_enabled', true)->get();
        foreach ($enabledModules as $mod) {
            $this->issueCertificate($userId, 'module', $mod->id);
        }
    }

    /**
     * Generate PDF data array for a certificate.
     */
    public function buildPdfData(Certificate $cert, User $user): array
    {
        $completedModules = TrainingProgress::where('user_id', $user->id)
            ->where('module_completed', true)
            ->with('module:id,title')
            ->get()
            ->pluck('module.title');

        return [
            'user_name' => $user->name,
            'issued_at' => $cert->issued_at->format('F j, Y'),
            'certificate_id' => $cert->certificate_code,
            'certificate_type' => $cert->certificate_type,
            'completed_modules' => $completedModules,
            'total_points' => $user->points,
        ];
    }

    private function issueCertificate(int $userId, string $type, ?int $moduleId = null): void
    {
        $key = ['user_id' => $userId, 'certificate_type' => $type];
        if ($moduleId) $key['module_id'] = $moduleId;

        Certificate::firstOrCreate($key, [
            'issued_at' => now(),
            'certificate_code' => $this->generateCode($type, $userId, $moduleId),
        ]);
    }

    /**
     * B6: Non-predictable certificate codes using random segment.
     */
    private function generateCode(string $type, int $userId, ?int $moduleId = null): string
    {
        $rand = strtoupper(Str::random(6));
        return match ($type) {
            'module' => "EWMOD-{$moduleId}-{$userId}-{$rand}",
            'path'   => "EWPATH-{$userId}-{$rand}",
            'expert' => "EWEXP-{$userId}-{$rand}",
            default  => "EWCERT-{$userId}-{$rand}",
        };
    }
}
