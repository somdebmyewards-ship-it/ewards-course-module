<?php

namespace Tests\Feature;

use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StatsControllerTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/v1/me/stats';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedBadges();
    }

    private function seedBadges(): void
    {
        $badges = [
            ['code' => 'first_section',     'name' => 'First Step',      'icon_emoji' => '👣', 'description' => 'First section'],
            ['code' => 'first_module',       'name' => 'Module Master',   'icon_emoji' => '📚', 'description' => 'First module'],
            ['code' => 'first_cert',         'name' => 'Certified!',      'icon_emoji' => '🎓', 'description' => 'First cert'],
            ['code' => 'quiz_first_attempt', 'name' => 'Quiz Ace',        'icon_emoji' => '⚡', 'description' => 'Quiz first attempt'],
            ['code' => 'quiz_perfect',       'name' => 'Perfect Score',   'icon_emoji' => '💯', 'description' => 'Perfect score'],
            ['code' => 'feedback_giver',     'name' => 'Feedback Giver',  'icon_emoji' => '💬', 'description' => 'Feedback giver'],
            ['code' => 'top_10',             'name' => 'Top 10',          'icon_emoji' => '🏆', 'description' => 'Top 10'],
            ['code' => 'points_100',         'name' => 'Century',         'icon_emoji' => '💪', 'description' => '100 points'],
            ['code' => 'points_500',         'name' => 'Expert Achiever', 'icon_emoji' => '🌟', 'description' => '500 points'],
        ];
        foreach ($badges as $b) {
            DB::table('lms_badges')->insertOrIgnore(array_merge($b, [
                'created_at' => now(), 'updated_at' => now(),
            ]));
        }
    }

    // ── Auth guard ───────────────────────────────────────────────────────────

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->getJson(self::ENDPOINT)->assertUnauthorized();
    }

    public function test_unapproved_user_returns_403(): void
    {
        Sanctum::actingAs(User::factory()->unapproved()->create());
        $this->getJson(self::ENDPOINT)->assertForbidden();
    }

    // ── Response shape ───────────────────────────────────────────────────────

    public function test_stats_response_has_required_keys(): void
    {
        Sanctum::actingAs(User::factory()->create(['points' => 0, 'approved' => true]));

        $this->getJson(self::ENDPOINT)
            ->assertOk()
            ->assertJsonStructure([
                'rank',
                'total_in_group',
                'current_level',
                'next_level',
                'points_needed',
                'level_pct',
                'new_modules',
                'badges',
                'next_badge',
                'leaderboard',
                'my_row',
            ]);
    }

    public function test_current_level_is_beginner_at_zero_points(): void
    {
        Sanctum::actingAs(User::factory()->create(['points' => 0, 'approved' => true]));

        $this->getJson(self::ENDPOINT)
            ->assertOk()
            ->assertJsonPath('current_level', 'Beginner')
            ->assertJsonPath('next_level', 'Practitioner');
    }

    public function test_current_level_is_expert_at_500_points(): void
    {
        Sanctum::actingAs(User::factory()->create(['points' => 500, 'approved' => true]));

        $this->getJson(self::ENDPOINT)
            ->assertOk()
            ->assertJsonPath('current_level', 'Expert')
            ->assertJsonPath('next_level', null)
            ->assertJsonPath('points_needed', 0)
            ->assertJsonPath('level_pct', 100);
    }

    // ── Badges in response ───────────────────────────────────────────────────

    public function test_badges_array_contains_earned_flag(): void
    {
        $user = User::factory()->create(['points' => 0, 'approved' => true]);
        // Award one badge directly
        $badge = DB::table('lms_badges')->where('code', 'first_section')->first();
        DB::table('lms_user_badges')->insert([
            'user_id'    => $user->id,
            'badge_id'   => $badge->id,
            'awarded_at' => now(),
        ]);

        Sanctum::actingAs($user);
        $res = $this->getJson(self::ENDPOINT)->assertOk();

        $badges = collect($res->json('badges'));
        $earned = $badges->firstWhere('code', 'first_section');
        $unearned = $badges->firstWhere('code', 'first_module');

        $this->assertTrue($earned['earned']);
        $this->assertFalse($unearned['earned']);
    }

    // ── New modules ──────────────────────────────────────────────────────────

    public function test_new_modules_only_includes_published_within_14_days(): void
    {
        TrainingModule::factory()->create([
            'is_published' => true,
            'created_at'   => now()->subDays(5),
            'title'        => 'Recent Module',
        ]);
        TrainingModule::factory()->create([
            'is_published' => true,
            'created_at'   => now()->subDays(20),
            'title'        => 'Old Module',
        ]);
        TrainingModule::factory()->create([
            'is_published' => false,
            'created_at'   => now()->subDays(1),
            'title'        => 'Draft Module',
        ]);

        Sanctum::actingAs(User::factory()->create(['points' => 0, 'approved' => true]));
        $res = $this->getJson(self::ENDPOINT)->assertOk();

        $titles = array_column($res->json('new_modules'), 'title');
        $this->assertContains('Recent Module', $titles);
        $this->assertNotContains('Old Module', $titles);
        $this->assertNotContains('Draft Module', $titles);
    }

    // ── Leaderboard slice ────────────────────────────────────────────────────

    private function merchant(int $id): int
    {
        \Illuminate\Support\Facades\DB::table('lms_merchants')->insertOrIgnore([
            'id' => $id, 'name' => "Merchant {$id}", 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    public function test_leaderboard_returns_at_most_5_entries(): void
    {
        $merchantId = $this->merchant(42);
        User::factory()->count(10)->create(['merchant_id' => $merchantId, 'points' => 100, 'approved' => true]);
        $me = User::factory()->create(['merchant_id' => $merchantId, 'points' => 5, 'approved' => true]);

        Sanctum::actingAs($me);
        $res = $this->getJson(self::ENDPOINT)->assertOk();

        $this->assertLessThanOrEqual(5, count($res->json('leaderboard')));
    }

    // ── Rank ─────────────────────────────────────────────────────────────────

    public function test_rank_is_1_when_user_is_top_of_group(): void
    {
        $merchantId = $this->merchant(55);
        $me = User::factory()->create(['merchant_id' => $merchantId, 'points' => 200, 'approved' => true]);
        User::factory()->create(['merchant_id' => $merchantId, 'points' => 50, 'approved' => true]);

        Sanctum::actingAs($me);
        $this->getJson(self::ENDPOINT)
            ->assertOk()
            ->assertJsonPath('rank', 1);
    }
}
