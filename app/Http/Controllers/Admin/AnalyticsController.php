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
        $userCounts = User::selectRaw("
            SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) as total_users,
            SUM(CASE WHEN approved = 0 THEN 1 ELSE 0 END) as pending_users
        ")->first();

        $totalUsers = (int) $userCounts->total_users;
        $pendingUsers = (int) $userCounts->pending_users;

        $totalCertificates = Certificate::count();
        $totalModules = TrainingModule::where('is_published', true)->count();

        $progressCounts = TrainingProgress::selectRaw("
            SUM(CASE WHEN module_completed = 1 THEN 1 ELSE 0 END) as completed_modules,
            SUM(CASE WHEN help_viewed = 1 THEN 1 ELSE 0 END) as help_viewed
        ")->first();

        $completedModules = (int) $progressCounts->completed_modules;
        $helpViewed = (int) $progressCounts->help_viewed;

        $quizSubmissions = DB::table('lms_quiz_attempts')->exists()
            ? DB::table('lms_quiz_attempts')->count()
            : 0;

        // Module stats — batch query
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

        // C3: Merchant adoption via SQL GROUP BY instead of in-memory groupBy
        $merchantAdoption = DB::table('lms_users as u')
            ->leftJoin('lms_progress as p', 'u.id', '=', 'p.user_id')
            ->where('u.approved', true)
            ->whereNotNull('u.merchant_name_entered')
            ->where('u.merchant_name_entered', '!=', '')
            ->groupBy('u.merchant_name_entered')
            ->selectRaw("
                u.merchant_name_entered as merchant_name,
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT u.id) as user_count,
                COUNT(DISTINCT CASE WHEN p.module_completed = 1 THEN u.id END) as completed_users,
                ROUND(AVG(CASE WHEN p.id IS NOT NULL THEN p.progress_percent ELSE 0 END), 1) as avg_progress,
                SUM(CASE WHEN p.module_completed = 1 THEN 1 ELSE 0 END) as completed_count
            ")
            ->orderByDesc('total_users')
            ->get()
            ->map(fn($row) => [
                'merchant_name' => $row->merchant_name,
                'total_users' => (int) $row->total_users,
                'user_count' => (int) $row->user_count,
                'completed_users' => (int) $row->completed_users,
                'avg_progress' => (float) $row->avg_progress,
                'completed_count' => (int) $row->completed_count,
                'adoption_rate' => $row->total_users > 0
                    ? round(($row->completed_users / $row->total_users) * 100)
                    : 0,
            ]);

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
