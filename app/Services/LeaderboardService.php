<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Single source of truth for leaderboard scoping.
 *
 * Option A (current): scoped by merchant_id.
 *   - Users with a merchant_id see peers in the same company.
 *   - Internal users (null merchant_id) see all internal users.
 *
 * Option B (future): when MERCHANT_ADMIN role is added, update scopeQuery()
 * to handle that role — no other file needs to change.
 */
class LeaderboardService
{
    private const TOP_N = 20;

    /**
     * Returns the top N leaderboard entries visible to the given user.
     * Each entry: user_id, name, points, level, badge_count, last_active_at.
     */
    public function getForUser(User $user): array
    {
        $rows = $this->scopeQuery($user)
            ->select([
                'lms_users.id',
                'lms_users.name',
                'lms_users.points',
                DB::raw('MAX(lms_user_badges.awarded_at) as last_active_at'),
                DB::raw('COUNT(DISTINCT lms_user_badges.id) as badge_count'),
            ])
            ->leftJoin('lms_user_badges', 'lms_users.id', '=', 'lms_user_badges.user_id')
            ->where('lms_users.approved', true)
            ->groupBy('lms_users.id', 'lms_users.name', 'lms_users.points')
            ->orderByDesc('lms_users.points')
            ->limit(self::TOP_N)
            ->get();

        $currentUserId = $user->id;
        $rank = 1;

        return $rows->map(function ($row) use (&$rank, $currentUserId) {
            return [
                'rank'           => $rank++,
                'user_id'        => $row->id,
                'name'           => $row->name,
                'points'         => (int) $row->points,
                'level'          => $this->getLevel((int) $row->points),
                'badge_count'    => (int) $row->badge_count,
                'last_active_at' => $row->last_active_at,
                'is_current_user'=> $row->id === $currentUserId,
            ];
        })->toArray();
    }

    /**
     * Returns the 1-based rank of a user in their leaderboard group, or null if not in top N.
     */
    public function getRank(User $user): ?int
    {
        $position = $this->scopeQuery($user)
            ->where('lms_users.approved', true)
            ->where('lms_users.points', '>', $user->points)
            ->count();

        $rank = $position + 1;
        return $rank <= self::TOP_N ? $rank : null;
    }

    // --- Scoping logic — update ONLY here when adding MERCHANT_ADMIN (Option B) ---

    private function scopeQuery(User $user)
    {
        $query = DB::table('lms_users');

        if ($user->merchant_id !== null) {
            $query->where('merchant_id', $user->merchant_id);
        } else {
            $query->whereNull('merchant_id');
        }

        return $query;
    }

    private function getLevel(int $points): string
    {
        if ($points >= 500) return 'Expert';
        if ($points >= 200) return 'Specialist';
        if ($points >= 75)  return 'Practitioner';
        return 'Beginner';
    }
}
