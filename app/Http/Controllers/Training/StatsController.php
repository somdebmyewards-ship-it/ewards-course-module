<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Services\LeaderboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function __construct(private LeaderboardService $leaderboard) {}

    public function me(Request $request)
    {
        $user = $request->user();

        $rank        = $this->leaderboard->getRank($user);
        $totalGroup  = $this->groupCount($user);

        [$nextLevel, $pointsNeeded, $levelPct] = $this->nextLevelData($user->points);

        $newModules = TrainingModule::where('is_published', true)
            ->where('created_at', '>=', now()->subDays(14))
            ->orderByDesc('created_at')
            ->take(3)
            ->get(['id', 'title', 'slug', 'icon', 'description']);

        $earnedCodes = DB::table('lms_user_badges')
            ->join('lms_badges', 'lms_badges.id', '=', 'lms_user_badges.badge_id')
            ->where('lms_user_badges.user_id', $user->id)
            ->pluck('lms_badges.code')
            ->toArray();

        $allBadges = DB::table('lms_badges')->orderBy('id')->get()
            ->map(fn($b) => [
                'code'        => $b->code,
                'name'        => $b->name,
                'icon_emoji'  => $b->icon_emoji,
                'description' => $b->description,
                'earned'      => in_array($b->code, $earnedCodes),
            ]);

        $nextBadge = $allBadges->firstWhere('earned', false);

        $leaderboard  = $this->leaderboard->getForUser($user);
        $top5         = array_slice($leaderboard, 0, 5);
        $userInTop5   = collect($top5)->contains('is_current_user', true);
        $myRow        = !$userInTop5 ? collect($leaderboard)->firstWhere('is_current_user', true) : null;

        return response()->json([
            'rank'          => $rank,
            'total_in_group'=> $totalGroup,
            'current_level' => $this->levelName($user->points),
            'next_level'    => $nextLevel,
            'points_needed' => $pointsNeeded,
            'level_pct'     => $levelPct,
            'new_modules'   => $newModules,
            'badges'        => $allBadges,
            'next_badge'    => $nextBadge,
            'leaderboard'   => $top5,
            'my_row'        => $myRow,
        ]);
    }

    private function groupCount($user): int
    {
        $q = DB::table('lms_users')->where('approved', true);
        return $user->merchant_id !== null
            ? $q->where('merchant_id', $user->merchant_id)->count()
            : $q->whereNull('merchant_id')->count();
    }

    private function nextLevelData(int $pts): array
    {
        if ($pts < 100) return ['Practitioner', 100 - $pts, (int) round($pts / 100 * 100)];
        if ($pts < 250) return ['Specialist',   250 - $pts, (int) round(($pts - 100) / 150 * 100)];
        if ($pts < 500) return ['Expert',       500 - $pts, (int) round(($pts - 250) / 250 * 100)];
        return [null, 0, 100];
    }

    private function levelName(int $pts): string
    {
        if ($pts >= 500) return 'Expert';
        if ($pts >= 250) return 'Specialist';
        if ($pts >= 100) return 'Practitioner';
        return 'Beginner';
    }
}
