<?php

namespace Tests\Feature;

use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\TrainingQuiz;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class QuizTest extends TestCase
{
    use RefreshDatabase;

    private User $cashier;
    private TrainingModule $module;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cashier = User::factory()->create(['role' => 'CASHIER', 'approved' => true, 'points' => 0]);

        $this->module = TrainingModule::factory()->create([
            'is_published' => true,
            'quiz_enabled' => true,
            'require_checklist' => false,
            'certificate_enabled' => false,
            'points_reward' => 50,
        ]);

        // Create two quiz questions; correct answers are 'A' and 'B'
        TrainingQuiz::factory()->create([
            'module_id' => $this->module->id,
            'options' => ['A', 'B', 'C', 'D'],
            'correct_answer' => 'A',
            'display_order' => 1,
        ]);
        TrainingQuiz::factory()->create([
            'module_id' => $this->module->id,
            'options' => ['A', 'B', 'C', 'D'],
            'correct_answer' => 'B',
            'display_order' => 2,
        ]);
    }

    public function test_quiz_submit_returns_score_and_results(): void
    {
        Sanctum::actingAs($this->cashier);

        $quizIds = $this->module->quizzes->pluck('id');
        $answers = [
            (string) $quizIds[0] => 'A', // correct
            (string) $quizIds[1] => 'A', // wrong
        ];

        $res = $this->postJson("/api/v1/progress/{$this->module->id}/quiz", ['answers' => $answers]);

        $res->assertOk()
            ->assertJsonStructure(['score', 'passed', 'correct', 'total', 'results'])
            ->assertJsonFragment(['correct' => 1, 'total' => 2, 'score' => 50]);
    }

    public function test_perfect_score_marks_quiz_passed(): void
    {
        Sanctum::actingAs($this->cashier);

        $quizIds = $this->module->quizzes->pluck('id');
        $answers = [
            (string) $quizIds[0] => 'A',
            (string) $quizIds[1] => 'B',
        ];

        $res = $this->postJson("/api/v1/progress/{$this->module->id}/quiz", ['answers' => $answers]);

        $res->assertOk()->assertJsonFragment(['passed' => true, 'score' => 100]);
    }

    public function test_passing_quiz_awards_bonus_points(): void
    {
        Sanctum::actingAs($this->cashier);

        $quizIds = $this->module->quizzes->pluck('id');
        $answers = [
            (string) $quizIds[0] => 'A',
            (string) $quizIds[1] => 'B',
        ];

        $this->postJson("/api/v1/progress/{$this->module->id}/quiz", ['answers' => $answers]);

        $this->assertGreaterThan(0, $this->cashier->fresh()->points);
    }

    public function test_quiz_invalid_answer_key_rejected(): void
    {
        Sanctum::actingAs($this->cashier);

        $res = $this->postJson("/api/v1/progress/{$this->module->id}/quiz", [
            'answers' => ['99999' => 'A'],
        ]);

        $res->assertStatus(422);
    }

    public function test_unauthenticated_quiz_submit_rejected(): void
    {
        $this->postJson("/api/v1/progress/{$this->module->id}/quiz", ['answers' => []])
            ->assertUnauthorized();
    }

    public function test_module_completed_when_quiz_passes_and_help_viewed(): void
    {
        // help_viewed = true is required (module has no checklist, no prototype, no required sections)
        TrainingProgress::updateOrCreate(
            ['user_id' => $this->cashier->id, 'module_id' => $this->module->id],
            ['help_viewed' => true]
        );

        Sanctum::actingAs($this->cashier);

        $quizIds = $this->module->quizzes->pluck('id');
        $answers = [
            (string) $quizIds[0] => 'A',
            (string) $quizIds[1] => 'B',
        ];

        $res = $this->postJson("/api/v1/progress/{$this->module->id}/quiz", ['answers' => $answers]);
        $res->assertOk()->assertJsonFragment(['module_completed' => true]);

        $progress = TrainingProgress::where('user_id', $this->cashier->id)
            ->where('module_id', $this->module->id)
            ->first();
        $this->assertTrue($progress->module_completed);
    }
}
