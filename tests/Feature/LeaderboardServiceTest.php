<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\LeaderboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaderboardServiceTest extends TestCase
{
    use RefreshDatabase;

    private LeaderboardService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(LeaderboardService::class);
    }

    private function merchant(int $id): int
    {
        \Illuminate\Support\Facades\DB::table('lms_merchants')->insertOrIgnore([
            'id' => $id, 'name' => "Merchant {$id}", 'created_at' => now(), 'updated_at' => now(),
        ]);
        return $id;
    }

    // ── Merchant scoping ─────────────────────────────────────────────────────

    public function test_merchant_user_only_sees_peers_in_same_company(): void
    {
        $merchantA = $this->merchant(1);
        $merchantB = $this->merchant(2);

        $userA1 = User::factory()->create(['merchant_id' => $merchantA, 'points' => 100, 'approved' => true]);
        $userA2 = User::factory()->create(['merchant_id' => $merchantA, 'points' => 50, 'approved' => true]);
        User::factory()->create(['merchant_id' => $merchantB, 'points' => 200, 'approved' => true]);

        $board = $this->service->getForUser($userA1);
        $ids = array_column($board, 'user_id');

        $this->assertContains($userA1->id, $ids);
        $this->assertContains($userA2->id, $ids);
        $this->assertCount(2, $board, 'Merchant B user must not appear');
    }

    public function test_leaderboard_ordered_by_points_descending(): void
    {
        $mid = $this->merchant(1);
        $u1 = User::factory()->create(['merchant_id' => $mid, 'points' => 30, 'approved' => true]);
        $u2 = User::factory()->create(['merchant_id' => $mid, 'points' => 90, 'approved' => true]);
        $u3 = User::factory()->create(['merchant_id' => $mid, 'points' => 60, 'approved' => true]);

        $board = $this->service->getForUser($u1);

        $this->assertEquals($u2->id, $board[0]['user_id']);
        $this->assertEquals($u3->id, $board[1]['user_id']);
        $this->assertEquals($u1->id, $board[2]['user_id']);
    }

    public function test_leaderboard_rank_numbers_are_sequential(): void
    {
        $mid = $this->merchant(5);
        User::factory()->count(3)->create(['merchant_id' => $mid, 'points' => 10, 'approved' => true]);
        $viewer = User::factory()->create(['merchant_id' => $mid, 'points' => 5, 'approved' => true]);

        $board = $this->service->getForUser($viewer);

        $this->assertEquals([1, 2, 3, 4], array_column($board, 'rank'));
    }

    public function test_is_current_user_flag_set_correctly(): void
    {
        $mid = $this->merchant(3);
        $me = User::factory()->create(['merchant_id' => $mid, 'points' => 100, 'approved' => true]);
        User::factory()->create(['merchant_id' => $mid, 'points' => 50, 'approved' => true]);

        $board = $this->service->getForUser($me);
        $myEntry = collect($board)->firstWhere('user_id', $me->id);

        $this->assertTrue($myEntry['is_current_user']);
        $others = collect($board)->filter(fn($r) => $r['user_id'] !== $me->id);
        foreach ($others as $row) {
            $this->assertFalse($row['is_current_user']);
        }
    }

    // ── Internal (null merchant) scoping ─────────────────────────────────────

    public function test_null_merchant_user_sees_only_internal_peers(): void
    {
        $internal1 = User::factory()->create(['merchant_id' => null, 'points' => 80, 'approved' => true]);
        $internal2 = User::factory()->create(['merchant_id' => null, 'points' => 40, 'approved' => true]);
        User::factory()->create(['merchant_id' => $this->merchant(99), 'points' => 999, 'approved' => true]);

        $board = $this->service->getForUser($internal1);
        $ids = array_column($board, 'user_id');

        $this->assertContains($internal1->id, $ids);
        $this->assertContains($internal2->id, $ids);
        $this->assertCount(2, $board, 'Merchant user must not appear in internal leaderboard');
    }

    // ── Approved filter ──────────────────────────────────────────────────────

    public function test_unapproved_users_excluded_from_leaderboard(): void
    {
        $mid = $this->merchant(7);
        $approved   = User::factory()->create(['merchant_id' => $mid, 'points' => 100, 'approved' => true]);
        $unapproved = User::factory()->create(['merchant_id' => $mid, 'points' => 200, 'approved' => false]);

        $board = $this->service->getForUser($approved);
        $ids = array_column($board, 'user_id');

        $this->assertNotContains($unapproved->id, $ids);
    }

    // ── Level labels ─────────────────────────────────────────────────────────

    public function test_level_labels_reflect_points(): void
    {
        $mid = $this->merchant(8);
        $expert     = User::factory()->create(['merchant_id' => $mid, 'points' => 500, 'approved' => true]);
        $specialist = User::factory()->create(['merchant_id' => $mid, 'points' => 250, 'approved' => true]);
        $practitioner = User::factory()->create(['merchant_id' => $mid, 'points' => 100, 'approved' => true]);
        $beginner   = User::factory()->create(['merchant_id' => $mid, 'points' => 10, 'approved' => true]);

        $board = collect($this->service->getForUser($expert));

        $this->assertEquals('Expert',       $board->firstWhere('user_id', $expert->id)['level']);
        $this->assertEquals('Specialist',   $board->firstWhere('user_id', $specialist->id)['level']);
        $this->assertEquals('Practitioner', $board->firstWhere('user_id', $practitioner->id)['level']);
        $this->assertEquals('Beginner',     $board->firstWhere('user_id', $beginner->id)['level']);
    }

    // ── getRank() ────────────────────────────────────────────────────────────

    public function test_get_rank_returns_1_for_top_user(): void
    {
        $mid = $this->merchant(10);
        $top = User::factory()->create(['merchant_id' => $mid, 'points' => 200, 'approved' => true]);
        User::factory()->create(['merchant_id' => $mid, 'points' => 100, 'approved' => true]);

        $this->assertEquals(1, $this->service->getRank($top));
    }

    public function test_get_rank_returns_null_when_outside_top_20(): void
    {
        $mid = $this->merchant(11);
        User::factory()->count(20)->create(['merchant_id' => $mid, 'points' => 500, 'approved' => true]);
        $bottom = User::factory()->create(['merchant_id' => $mid, 'points' => 1, 'approved' => true]);

        $this->assertNull($this->service->getRank($bottom));
    }

    public function test_get_rank_only_counts_same_merchant_peers(): void
    {
        // 20 users from a different merchant won't push our user out of top 20
        User::factory()->count(20)->create(['merchant_id' => $this->merchant(99), 'points' => 999, 'approved' => true]);
        $user = User::factory()->create(['merchant_id' => $this->merchant(12), 'points' => 50, 'approved' => true]);

        $rank = $this->service->getRank($user);
        $this->assertEquals(1, $rank, 'Cross-merchant users must not affect rank');
    }
}
