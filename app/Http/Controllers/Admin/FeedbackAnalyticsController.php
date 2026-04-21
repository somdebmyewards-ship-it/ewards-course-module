<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ModuleFeedback;
use App\Models\TrainingModule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeedbackAnalyticsController extends Controller
{
    public function index(Request $request)
    {
        // Single query for all overview metrics
        $overview = ModuleFeedback::selectRaw("
            COUNT(*) as total_feedback,
            ROUND(AVG(rating), 1) as avg_rating,
            SUM(CASE WHEN comment IS NOT NULL AND comment != '' THEN 1 ELSE 0 END) as total_comments,
            SUM(CASE WHEN improvement_suggestion IS NOT NULL AND improvement_suggestion != '' THEN 1 ELSE 0 END) as total_suggestions,
            SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as promoters,
            SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as passives,
            SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as detractors
        ")->first();

        $totalFeedback = (int) $overview->total_feedback;
        $promoters = (int) $overview->promoters;
        $detractors = (int) $overview->detractors;
        $npsScore = $totalFeedback > 0
            ? round((($promoters - $detractors) / $totalFeedback) * 100)
            : 0;

        // Single query for rating distribution
        $ratingCounts = ModuleFeedback::selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating');

        $ratingDistribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $count = (int) ($ratingCounts[$i] ?? 0);
            $ratingDistribution[] = [
                'rating' => $i,
                'count' => $count,
                'percentage' => $totalFeedback > 0 ? round(($count / $totalFeedback) * 100, 1) : 0,
            ];
        }

        // Per-module metrics — single batch query instead of 3 queries per module
        $moduleMetrics = ModuleFeedback::selectRaw("
            module_id,
            COUNT(*) as feedback_count,
            ROUND(AVG(rating), 1) as avg_rating,
            SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as promoters,
            SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) as detractors
        ")
            ->groupBy('module_id')
            ->get()
            ->keyBy('module_id');

        $modules = TrainingModule::orderBy('display_order')->get()
            ->map(function ($m) use ($moduleMetrics) {
                $metrics = $moduleMetrics->get($m->id);
                $mCount = $metrics ? (int) $metrics->feedback_count : 0;
                $mPromoters = $metrics ? (int) $metrics->promoters : 0;
                $mDetractors = $metrics ? (int) $metrics->detractors : 0;
                $mNps = $mCount > 0 ? round((($mPromoters - $mDetractors) / $mCount) * 100) : 0;

                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'slug' => $m->slug,
                    'icon' => $m->icon,
                    'feedback_count' => $mCount,
                    'avg_rating' => $metrics ? (float) $metrics->avg_rating : 0,
                    'nps' => $mNps,
                    'promoters' => $mPromoters,
                    'detractors' => $mDetractors,
                ];
            });

        // Recent feedback with eager loading
        $recentFeedback = ModuleFeedback::with(['user:id,name,email,role', 'module:id,title,icon'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(function ($f) {
                return [
                    'id' => $f->id,
                    'rating' => $f->rating,
                    'comment' => $f->comment,
                    'improvement_suggestion' => $f->improvement_suggestion,
                    'created_at' => $f->created_at->format('d M Y, h:i A'),
                    'user_name' => $f->user->name ?? 'Unknown',
                    'user_email' => $f->user->email ?? '',
                    'user_role' => $f->user->role ?? '',
                    'module_title' => $f->module->title ?? 'Unknown',
                    'module_icon' => $f->module->icon ?? '',
                ];
            });

        return response()->json([
            'overview' => [
                'total_feedback' => $totalFeedback,
                'avg_rating' => (float) ($overview->avg_rating ?? 0),
                'nps_score' => $npsScore,
                'promoters' => $promoters,
                'passives' => (int) $overview->passives,
                'detractors' => $detractors,
                'total_comments' => (int) $overview->total_comments,
                'total_suggestions' => (int) $overview->total_suggestions,
            ],
            'rating_distribution' => $ratingDistribution,
            'modules' => $modules,
            'recent_feedback' => $recentFeedback,
        ]);
    }
}
