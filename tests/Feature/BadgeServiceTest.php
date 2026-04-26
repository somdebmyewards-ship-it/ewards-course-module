<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\BadgeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BadgeServiceTest extends TestCase
{
    use RefreshDatabase;

    private BadgeService $service;
    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(BadgeService::class);
        $this->user = User::factory()->create(['points' => 0, 'approved' => true]);
        $this->seedBadges();
    }

    private function seedBadges(): void
    {
        $badges = [
            ['code' => 'first_section',     'name' => 'First Step',       'icon_emoji' => '👣', 'description' => 'First section'],
            ['code' => 'first_module',       'name' => 'Module Master',    'icon_emoji' => '📚', 'description' => 'First module'],
            ['code' => 'first_cert',         'name' => 'Certified!',       'icon_emoji' => '🎓', 'description' => 'First cert'],
            ['code' => 'quiz_first_attempt', 'name' => 'Quiz Ace',         'icon_emoji' => '⚡', 'description' => 'Quiz first attempt'],
            ['code' => 'quiz_perfect',       'name' => 'Perfect Score',    'icon_emoji' => '💯', 'description' => 'Perfect score'],
            ['code' => 'feedback_giver',     'name' => 'Feedback Giver',   'icon_emoji' => '💬', 'description' => 'Feedback giver'],
            ['code' => 'top_10',             'name' => 'Top 10',           'icon_emoji' => '🏆', 'description' => 'Top 10'],
            ['code' => 'points_100',         'name' => 'Century',          'icon_emoji' => '💪', 'description' => '100 points'],
            ['code' => 'points_500',         'name' => 'Expert Achiever',  'icon_emoji' => '🌟', 'description' => '500 points'],
        ];
        foreach ($badges as $b) {
            DB::table('lms_badges')->insertOrIgnore(array_merge($b, [
                'created_at' => now(), 'updated_at' => now(),
            ]));
        }
    }

    private function hasBadge(string $code): bool
    {
        $badge = DB::table('lms_badges')->where('code', $code)->first();
        if (!$badge) return false;
        return DB::table('lms_user_badges')
            ->where('user_id', $this->user->id)
            ->where('badge_id', $badge->id)
            ->exists();
    }

    // ── award() ──────────────────────────────────────────────────────────────

    public function test_award_returns_true_on_first_grant(): void
    {
        $result = $this->service->award($this->user->id, 'first_section');
        $this->assertTrue($result);
        $this->assertTrue($this->hasBadge('first_section'));
    }

    public function test_award_returns_false_when_already_held(): void
    {
        $this->service->award($this->user->id, 'first_section');
        $result = $this->service->award($this->user->id, 'first_section');
        $this->assertFalse($result);

        $count = DB::table('lms_user_badges')
            ->where('user_id', $this->user->id)
            ->count();
        $this->assertEquals(1, $count, 'Duplicate badge row must not be inserted');
    }

    public function test_award_returns_false_for_unknown_code(): void
    {
        $result = $this->service->award($this->user->id, 'nonexistent_badge');
        $this->assertFalse($result);
    }

    // ── onModuleCompleted() ──────────────────────────────────────────────────

    public function test_module_completed_awards_first_module_badge(): void
    {
        $this->service->onModuleCompleted($this->user->id);
        $this->assertTrue($this->hasBadge('first_module'));
    }

    public function test_module_completed_does_not_duplicate_badge(): void
    {
        $this->service->onModuleCompleted($this->user->id);
        $this->service->onModuleCompleted($this->user->id);

        $count = DB::table('lms_user_badges')
            ->join('lms_badges', 'lms_badges.id', '=', 'lms_user_badges.badge_id')
            ->where('lms_user_badges.user_id', $this->user->id)
            ->where('lms_badges.code', 'first_module')
            ->count();
        $this->assertEquals(1, $count);
    }

    // ── onQuizPassed() ───────────────────────────────────────────────────────

    public function test_quiz_perfect_score_awards_badge(): void
    {
        $this->service->onQuizPassed($this->user->id, isPerfect: true, isFirstAttempt: false);
        $this->assertTrue($this->hasBadge('quiz_perfect'));
    }

    public function test_quiz_first_attempt_awards_badge(): void
    {
        $this->service->onQuizPassed($this->user->id, isPerfect: false, isFirstAttempt: true);
        $this->assertTrue($this->hasBadge('quiz_first_attempt'));
        $this->assertFalse($this->hasBadge('quiz_perfect'));
    }

    public function test_quiz_both_badges_awarded_on_first_attempt_perfect(): void
    {
        $this->service->onQuizPassed($this->user->id, isPerfect: true, isFirstAttempt: true);
        $this->assertTrue($this->hasBadge('quiz_perfect'));
        $this->assertTrue($this->hasBadge('quiz_first_attempt'));
    }

    // ── onFeedbackSubmitted() ────────────────────────────────────────────────

    public function test_feedback_badge_awarded_at_three_submissions(): void
    {
        $this->service->onFeedbackSubmitted($this->user->id, 3);
        $this->assertTrue($this->hasBadge('feedback_giver'));
    }

    public function test_feedback_badge_not_awarded_below_three(): void
    {
        $this->service->onFeedbackSubmitted($this->user->id, 2);
        $this->assertFalse($this->hasBadge('feedback_giver'));
    }

    // ── onPointsChanged() ────────────────────────────────────────────────────

    public function test_points_100_badge_awarded_at_threshold(): void
    {
        $this->user->update(['points' => 100]);
        $this->service->onPointsChanged($this->user->fresh());
        $this->assertTrue($this->hasBadge('points_100'));
    }

    public function test_points_100_badge_not_awarded_below_threshold(): void
    {
        $this->user->update(['points' => 99]);
        $this->service->onPointsChanged($this->user->fresh());
        $this->assertFalse($this->hasBadge('points_100'));
    }

    public function test_points_500_badge_awarded_at_threshold(): void
    {
        $this->user->update(['points' => 500]);
        $this->service->onPointsChanged($this->user->fresh());
        $this->assertTrue($this->hasBadge('points_500'));
        $this->assertTrue($this->hasBadge('points_100'), 'points_100 also awarded at 500+');
    }

    // ── top_10 via onPointsChanged() ─────────────────────────────────────────

    public function test_top_10_badge_awarded_when_user_is_rank_1(): void
    {
        // Only this user exists — rank will be 1
        $this->user->update(['points' => 50]);
        $this->service->onPointsChanged($this->user->fresh());
        $this->assertTrue($this->hasBadge('top_10'));
    }

    public function test_top_10_badge_not_awarded_when_outside_top_20(): void
    {
        // Create 20 users with higher points so this user is rank 21
        User::factory()->count(20)->create(['points' => 999, 'approved' => true, 'merchant_id' => null]);
        $this->user->update(['points' => 1, 'merchant_id' => null]);

        $this->service->onPointsChanged($this->user->fresh());
        $this->assertFalse($this->hasBadge('top_10'));
    }
}
