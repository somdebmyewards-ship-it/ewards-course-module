<?php
namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\TrainingQuiz;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    public function submit(Request $request, int $moduleId)
    {
        $request->validate([
            'answers' => 'required|array',
        ]);

        $module = TrainingModule::with('quizzes')->findOrFail($moduleId);
        $answers = $request->answers;

        $totalQuestions = $module->quizzes->count();
        $correctCount = 0;
        $results = [];

        foreach ($module->quizzes as $quiz) {
            $userAnswer = $answers[$quiz->id] ?? null;
            $isCorrect = $userAnswer === $quiz->correct_answer;
            if ($isCorrect) $correctCount++;

            $options = is_string($quiz->options) ? json_decode($quiz->options, true) : $quiz->options;
            $results[] = [
                'question_id' => $quiz->id,
                'question' => $quiz->question,
                'options' => $options,
                'user_answer' => $userAnswer,
                'correct_answer' => $quiz->correct_answer,
                'is_correct' => $isCorrect,
                'explanation' => $quiz->explanation,
            ];
        }

        $score = $totalQuestions > 0 ? round(($correctCount / $totalQuestions) * 100) : 0;
        $quizMeta = \App\Models\QuizMetadata::where('module_id', $moduleId)->first();
        $passingPercent = $quizMeta ? $quizMeta->passing_percent : 75;
        $passed = $score >= $passingPercent;

        // A2: Wrap multi-step writes (progress + points + certificates) in transaction
        $responseData = DB::transaction(function () use ($request, $module, $moduleId, $passed, $score, $correctCount, $totalQuestions, $results) {
            $userId = $request->user()->id;
            $progress = TrainingProgress::updateOrCreate(
                ['user_id' => $userId, 'module_id' => $moduleId],
                [
                    'quiz_completed' => $passed,
                    'quiz_completed_at' => $passed ? now() : null,
                    'quiz_score' => $score,
                ]
            );

            $achievement = null;
            $quizBonusPoints = 0;

            // Award +20 quiz bonus points when quiz is passed
            if ($passed) {
                $quizBonusPoints = 20;
                $user = $request->user();
                $user->increment('points', $quizBonusPoints);
            }

            // Check full module completion
            $checklistOk = !$module->require_checklist || $progress->checklist_completed;
            if ($passed && $progress->help_viewed && $checklistOk) {
                if (!$progress->module_completed) {
                    $progress->update([
                        'module_completed' => true,
                        'module_completed_at' => now(),
                    ]);

                    $user = $request->user();
                    $modulePoints = $module->points_reward ?: 50;
                    $user->increment('points', $modulePoints);

                    // Module certificate if enabled
                    $certUnlocked = false;
                    if ($module->certificate_enabled) {
                        Certificate::firstOrCreate(
                            ['user_id' => $userId, 'module_id' => $module->id, 'certificate_type' => 'module'],
                            [
                                'issued_at' => now(),
                                'certificate_code' => 'EWMOD-' . str_pad($module->id, 4, '0', STR_PAD_LEFT) . '-' . str_pad($userId, 6, '0', STR_PAD_LEFT),
                            ]
                        );
                        $certUnlocked = true;
                    }

                    // Path certificate check - all modules completed
                    $totalPublished = TrainingModule::where('is_published', true)->count();
                    $completedCount = TrainingProgress::where('user_id', $userId)->where('module_completed', true)->count();
                    if ($completedCount >= $totalPublished && $totalPublished > 0) {
                        Certificate::firstOrCreate(
                            ['user_id' => $userId, 'certificate_type' => 'path'],
                            [
                                'issued_at' => now(),
                                'certificate_code' => 'EWPATH-' . str_pad($userId, 6, '0', STR_PAD_LEFT),
                            ]
                        );
                        $certUnlocked = true;
                    }

                    // Expert certificate check - 300+ points
                    $freshUser = $user->fresh();
                    if ($freshUser->points >= 300) {
                        Certificate::firstOrCreate(
                            ['user_id' => $userId, 'certificate_type' => 'expert'],
                            [
                                'issued_at' => now(),
                                'certificate_code' => 'EWEXP-' . str_pad($userId, 6, '0', STR_PAD_LEFT),
                            ]
                        );
                        $certUnlocked = true;
                    }

                    $totalPointsEarned = $modulePoints + $quizBonusPoints;
                    $oldLevel = ProgressController::getUserLevel($freshUser->points - $totalPointsEarned);
                    $newLevel = ProgressController::getUserLevel($freshUser->points);
                    $levelUp = $oldLevel !== $newLevel;

                    $achievement = [
                        'title' => 'Module Completed!',
                        'message' => "You completed {$module->title}",
                        'points_earned' => $totalPointsEarned,
                        'module_points' => $modulePoints,
                        'quiz_bonus' => $quizBonusPoints,
                        'certificate_unlocked' => $certUnlocked,
                        'level_up' => $levelUp,
                        'new_level' => $newLevel,
                        'total_points' => $freshUser->points,
                        'share_text' => "Just completed {$module->title} on eWards Learning Hub!",
                    ];
                }
            }

            $data = [
                'score' => $score,
                'passed' => $passed,
                'correct' => $correctCount,
                'total' => $totalQuestions,
                'results' => $results,
                'module_completed' => $progress->fresh()->module_completed,
                'quiz_bonus_points' => $passed ? $quizBonusPoints : 0,
            ];

            if ($achievement) {
                $data['achievement'] = $achievement;
            }

            return $data;
        });

        return response()->json($responseData);
    }

    public function answers(Request $request, int $moduleId)
    {
        $module = TrainingModule::with('quizzes')->findOrFail($moduleId);
        $progress = TrainingProgress::where('user_id', $request->user()->id)
            ->where('module_id', $moduleId)
            ->firstOrFail();

        if (!$progress->quiz_completed) {
            return response()->json(['message' => 'Quiz not completed yet'], 403);
        }

        $results = $module->quizzes->map(function ($quiz) {
            $options = is_string($quiz->options) ? json_decode($quiz->options, true) : $quiz->options;
            return [
                'question_id' => $quiz->id,
                'question' => $quiz->question,
                'correct_answer' => $quiz->correct_answer,
                'options' => $options,
                'explanation' => $quiz->explanation,
            ];
        });

        return response()->json([
            'score' => $progress->quiz_score,
            'results' => $results,
        ]);
    }
}
