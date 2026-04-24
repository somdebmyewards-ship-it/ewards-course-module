<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class BadgeService
{
    /**
     * Award a badge by code if the user doesn't already have it.
     * Returns true if newly awarded, false if already held.
     */
    public function award(int $userId, string $badgeCode): bool
    {
        $badge = DB::table('lms_badges')->where('code', $badgeCode)->first();
        if (!$badge) return false;

        $exists = DB::table('lms_user_badges')
            ->where('user_id', $userId)
            ->where('badge_id', $badge->id)
            ->exists();

        if ($exists) return false;

        DB::table('lms_user_badges')->insert([
            'user_id'    => $userId,
            'badge_id'   => $badge->id,
            'awarded_at' => now(),
        ]);

        return true;
    }

    /**
     * Called after any section is marked viewed.
     */
    public function onSectionViewed(int $userId): void
    {
        $this->award($userId, 'first_section');
    }

    /**
     * Called after a module is fully completed.
     */
    public function onModuleCompleted(int $userId): void
    {
        $this->award($userId, 'first_module');
        $this->checkFirstCert($userId);
    }

    /**
     * Called after a certificate is issued.
     */
    public function onCertificateIssued(int $userId): void
    {
        $this->checkFirstCert($userId);
    }

    /**
     * Called after a quiz attempt. Pass $isPerfect=true if score=100, $isFirstAttempt=true if attempt #1.
     */
    public function onQuizPassed(int $userId, bool $isPerfect, bool $isFirstAttempt): void
    {
        if ($isFirstAttempt) {
            $this->award($userId, 'quiz_first_attempt');
        }
        if ($isPerfect) {
            $this->award($userId, 'quiz_perfect');
        }
    }

    /**
     * Called after feedback is submitted. $totalFeedbackCount is the user's total feedback submissions.
     */
    public function onFeedbackSubmitted(int $userId, int $totalFeedbackCount): void
    {
        if ($totalFeedbackCount >= 3) {
            $this->award($userId, 'feedback_giver');
        }
    }

    /**
     * Called after points change. Checks points thresholds and leaderboard rank.
     */
    public function onPointsChanged(User $user): void
    {
        if ($user->points >= 100) {
            $this->award($user->id, 'points_100');
        }
        if ($user->points >= 500) {
            $this->award($user->id, 'points_500');
        }
        $this->checkTop10($user);
    }

    private function checkFirstCert(int $userId): void
    {
        $hasCert = DB::table('lms_certificates')->where('user_id', $userId)->exists();
        if ($hasCert) {
            $this->award($userId, 'first_cert');
        }
    }

    private function checkTop10(User $user): void
    {
        $rank = app(LeaderboardService::class)->getRank($user);
        if ($rank !== null && $rank <= 10) {
            $this->award($user->id, 'top_10');
        }
    }
}
