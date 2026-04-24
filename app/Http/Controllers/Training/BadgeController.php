<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BadgeController extends Controller
{
    /**
     * Return the authenticated user's earned badges.
     */
    public function mine(Request $request)
    {
        return response()->json($this->getBadgesForUser($request->user()->id));
    }

    /**
     * Return badges for a specific user (admin or same merchant_id peer).
     */
    public function forUser(Request $request, int $userId)
    {
        $viewer = $request->user();
        $target = DB::table('lms_users')->where('id', $userId)->first();

        if (!$target) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $canView = $viewer->isAdmin()
            || $viewer->id === $userId
            || ($viewer->merchant_id !== null && $viewer->merchant_id === $target->merchant_id);

        if (!$canView) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($this->getBadgesForUser($userId));
    }

    private function getBadgesForUser(int $userId): array
    {
        return DB::table('lms_user_badges')
            ->join('lms_badges', 'lms_badges.id', '=', 'lms_user_badges.badge_id')
            ->where('lms_user_badges.user_id', $userId)
            ->select(
                'lms_badges.code',
                'lms_badges.name',
                'lms_badges.description',
                'lms_badges.icon_emoji',
                'lms_user_badges.awarded_at'
            )
            ->orderBy('lms_user_badges.awarded_at')
            ->get()
            ->toArray();
    }
}
