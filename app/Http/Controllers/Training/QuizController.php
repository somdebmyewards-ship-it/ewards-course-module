<?php
namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\TrainingQuiz;
use App\Models\PointsLedger;
use App\Services\CompletionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuizController extends Controller
{
    public function __construct(private CompletionService $completion) {}

    public function submit(Request $request, int $moduleId)
    {
        // D1: Verify module is published
        $module = TrainingModule::where('is_published', true)
            ->with('quizzes')
            ->findOrFail($moduleId);

        // D5: Validate quiz answers structure and keys are valid quiz IDs for this module
        $validQuizIds = $module->quizzes->pluck('id')->map(fn($id) => (string) $id)->toArray();
        $request->validate([
            'answers' => 'required|array',
            'answers.*' => 'required|string|max:500',
        ]);

        // D5: Reject answer keys that don't belong to this module's quizzes
        $submittedIds = array_keys($request->answers);
        $invalidIds = array_diff($submittedIds, $validQuizIds);
        if (!empty($invalidIds)) {
            return response()->json([
                'message' => 'Invalid quiz question IDs submitted.',
                'errors' => ['answers' => ['Some answer keys do not belong to this module\'s quizzes.']],
            ], 422);
        }

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

        // A2: Transaction wrapping multi-step writes
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

            $quizBonusPoints = 0;
            if ($passed) {
                $quizBonusPoints = 20;
                $request->user()->increment('points', $quizBonusPoints);
                PointsLedger::record($userId, $quizBonusPoints, 'quiz_bonus', $moduleId);
            }

            // A1: Use CompletionService instead of duplicated logic
            $achievement = $this->completion->checkAndComplete($progress->fresh(), $quizBonusPoints);

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
        // D1: Verify module is published
        $module = TrainingModule::where('is_published', true)
            ->with('quizzes')
            ->findOrFail($moduleId);

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
