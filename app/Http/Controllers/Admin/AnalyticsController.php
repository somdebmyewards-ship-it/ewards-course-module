<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    private function getLevel(int $points): string
    {
        if ($points >= 500) return 'Expert';
        if ($points >= 250) return 'Specialist';
        if ($points >= 100) return 'Practitioner';
        return 'Beginner';
    }

    public function index(Request $request)
    {
        $period = $request->input('period', 'all');
        $since  = match ($period) {
            '7d'  => now()->subDays(7),
            '30d' => now()->subDays(30),
            default => null,
        };

        // ── All-time stats (period-insensitive) ──────────────────────────
        $userCounts = User::selectRaw("
            SUM(CASE WHEN approved = 1 THEN 1 ELSE 0 END) as total_users,
            SUM(CASE WHEN approved = 0 THEN 1 ELSE 0 END) as pending_users
        ")->first();

        $totalUsers    = (int) $userCounts->total_users;
        $pendingUsers  = (int) $userCounts->pending_users;
        $totalModules  = TrainingModule::where('is_published', true)->count();
        $totalCertificates = Certificate::count();

        // ── Period-filtered stats ────────────────────────────────────────
        $progressQuery = TrainingProgress::query();
        if ($since) {
            $progressQuery->where('updated_at', '>=', $since);
        }

        $progressCounts = (clone $progressQuery)->selectRaw("
            SUM(CASE WHEN module_completed = 1 THEN 1 ELSE 0 END) as completed_modules,
            SUM(CASE WHEN help_viewed = 1 THEN 1 ELSE 0 END) as help_viewed
        ")->first();

        $completedModules = (int) $progressCounts->completed_modules;
        $helpViewed       = (int) $progressCounts->help_viewed;

        $quizQuery = DB::table('lms_quiz_attempts');
        if ($since) {
            $quizQuery->where('created_at', '>=', $since);
        }
        $quizSubmissions = $quizQuery->count();

        // ── Module completion breakdown (period-filtered) ────────────────
        $modules = TrainingModule::where('is_published', true)->orderBy('display_order')->get();

        $moduleCompletionQuery = TrainingProgress::where('module_completed', true)
            ->selectRaw('module_id, COUNT(*) as completed')
            ->groupBy('module_id');
        if ($since) {
            $moduleCompletionQuery->where('updated_at', '>=', $since);
        }
        $moduleCompletions = $moduleCompletionQuery->pluck('completed', 'module_id');

        $moduleStats = $modules->map(function ($m) use ($totalUsers, $moduleCompletions) {
            $completed = (int) ($moduleCompletions[$m->id] ?? 0);
            return [
                'id'          => $m->id,
                'title'       => $m->title,
                'slug'        => $m->slug,
                'completed'   => $completed,
                'total_users' => $totalUsers,
                'percentage'  => $totalUsers > 0 ? round(($completed / $totalUsers) * 100) : 0,
            ];
        });

        // ── Merchant adoption (all-time) ─────────────────────────────────
        $merchantAdoption = DB::table('lms_users as u')
            ->leftJoin('lms_progress as p', 'u.id', '=', 'p.user_id')
            ->where('u.approved', true)
            ->whereNotNull('u.merchant_name_entered')
            ->where('u.merchant_name_entered', '!=', '')
            ->groupBy('u.merchant_name_entered')
            ->selectRaw("
                u.merchant_name_entered as merchant_name,
                COUNT(DISTINCT u.id) as total_users,
                COUNT(DISTINCT CASE WHEN p.module_completed = 1 THEN u.id END) as completed_users,
                ROUND(AVG(CASE WHEN p.id IS NOT NULL THEN p.progress_percent ELSE 0 END), 1) as avg_progress,
                SUM(CASE WHEN p.module_completed = 1 THEN 1 ELSE 0 END) as completed_count
            ")
            ->orderByDesc('total_users')
            ->get()
            ->map(fn($row) => [
                'merchant_name'   => $row->merchant_name,
                'total_users'     => (int) $row->total_users,
                'completed_users' => (int) $row->completed_users,
                'avg_progress'    => (float) $row->avg_progress,
                'completed_count' => (int) $row->completed_count,
                'adoption_rate'   => $row->total_users > 0
                    ? round(($row->completed_users / $row->total_users) * 100)
                    : 0,
            ]);

        // ── U1b: Leaderboard — top 10 by points ─────────────────────────
        $leaderboard = User::where('approved', true)
            ->orderByDesc('points')
            ->take(10)
            ->get(['id', 'name', 'email', 'points', 'designation'])
            ->map(fn($u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'designation' => $u->designation,
                'points'      => (int) ($u->points ?? 0),
                'level'       => $this->getLevel((int) ($u->points ?? 0)),
            ]);

        // ── U1c: Activity feed — last 10 module completions ─────────────
        $activity = TrainingProgress::where('module_completed', true)
            ->with(['user:id,name', 'module:id,title,icon'])
            ->orderByDesc('module_completed_at')
            ->take(10)
            ->get()
            ->map(fn($p) => [
                'user_name'    => $p->user?->name,
                'module_title' => $p->module?->title,
                'module_icon'  => $p->module?->icon,
                'completed_at' => $p->module_completed_at ?? $p->updated_at,
            ]);

        return response()->json([
            'total_users'        => $totalUsers,
            'pending_users'      => $pendingUsers,
            'certificates_issued'=> $totalCertificates,
            'total_modules'      => $totalModules,
            'modules_completed'  => $completedModules,
            'quiz_submissions'   => $quizSubmissions,
            'help_viewed'        => $helpViewed,
            'module_stats'       => $moduleStats,
            'merchant_adoption'  => $merchantAdoption,
            'leaderboard'        => $leaderboard,
            'activity'           => $activity,
            'period'             => $period,
        ]);
    }
}
