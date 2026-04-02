<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\Certificate;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function index()
    {
        // Single query for user counts
        $userCounts = User::selectRaw("
            SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) as total_users,
            SUM(CASE WHEN approved = 0 THEN 1 ELSE 0 END) as pending_users
        ")->first();

        $totalUsers = (int) $userCounts->total_users;
        $pendingUsers = (int) $userCounts->pending_users;

        // Single queries for other counts
        $totalCertificates = Certificate::count();
        $totalModules = TrainingModule::where('is_published', true)->count();

        $progressCounts = TrainingProgress::selectRaw("
            SUM(CASE WHEN module_completed = 1 THEN 1 ELSE 0 END) as completed_modules,
            SUM(CASE WHEN help_viewed = 1 THEN 1 ELSE 0 END) as help_viewed
        ")->first();

        $completedModules = (int) $progressCounts->completed_modules;
        $helpViewed = (int) $progressCounts->help_viewed;
        $quizSubmissions = DB::table('lms_quiz_attempts')->count();

        // Module stats — single batch query instead of N+1
        $modules = TrainingModule::where('is_published', true)->orderBy('display_order')->get();
        $moduleCompletions = TrainingProgress::where('module_completed', true)
            ->selectRaw('module_id, COUNT(*) as completed')
            ->groupBy('module_id')
            ->pluck('completed', 'module_id');

        $moduleStats = $modules->map(function ($m) use ($totalUsers, $moduleCompletions) {
            $completed = (int) ($moduleCompletions[$m->id] ?? 0);
            return [
                'id' => $m->id, 'title' => $m->title, 'slug' => $m->slug,
                'completed' => $completed, 'total_users' => $totalUsers,
                'percentage' => $totalUsers > 0 ? round(($completed / $totalUsers) * 100) : 0,
            ];
        });

        // Merchant adoption — ALL done with batch queries, no N+1
        $merchantUsers = User::where('approved', true)
            ->whereNotNull('merchant_name_entered')
            ->where('merchant_name_entered', '!=', '')
            ->select('id', 'merchant_name_entered')
            ->get();

        $merchantGroups = $merchantUsers->groupBy('merchant_name_entered');
        $allMerchantUserIds = $merchantUsers->pluck('id');

        // Single query: get all progress for all merchant users
        $allProgress = TrainingProgress::whereIn('user_id', $allMerchantUserIds)
            ->select('user_id', 'module_completed', 'progress_percent')
            ->get();

        $merchantAdoption = $merchantGroups->map(function ($users, $merchantName) use ($allProgress) {
            $userIds = $users->pluck('id');
            $progressData = $allProgress->whereIn('user_id', $userIds);
            $userCount = $users->count();

            $completedCount = $progressData->where('module_completed', true)->count();
            $avgProgress = $progressData->count() > 0
                ? round($progressData->avg('progress_percent'), 1)
                : 0;
            $completedUsers = $progressData->where('module_completed', true)
                ->unique('user_id')->count();

            return [
                'merchant_name' => $merchantName,
                'total_users' => $userCount,
                'user_count' => $userCount,
                'completed_users' => $completedUsers,
                'avg_progress' => $avgProgress,
                'completed_count' => $completedCount,
                'adoption_rate' => $userCount > 0 ? round(($completedUsers / $userCount) * 100) : 0,
            ];
        })->sortByDesc('user_count')->values();

        return response()->json([
            'total_users' => $totalUsers,
            'pending_users' => $pendingUsers,
            'certificates_issued' => $totalCertificates,
            'total_modules' => $totalModules,
            'modules_completed' => $completedModules,
            'quiz_submissions' => $quizSubmissions,
            'help_viewed' => $helpViewed,
            'module_stats' => $moduleStats,
            'merchant_adoption' => $merchantAdoption,
        ]);
    }
}
