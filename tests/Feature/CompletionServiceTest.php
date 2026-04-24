<?php

namespace Tests\Feature;

use App\Models\Certificate;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\User;
use App\Services\CompletionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompletionServiceTest extends TestCase
{
    use RefreshDatabase;

    private CompletionService $service;
    private User $user;
    private TrainingModule $module;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(CompletionService::class);
        $this->user = User::factory()->create([
            'role' => 'CASHIER', 'approved' => true, 'points' => 0,
        ]);
        $this->module = TrainingModule::factory()->create([
            'is_published'       => true,
            'quiz_enabled'       => false,
            'require_checklist'  => false,
            'certificate_enabled'=> false,
            'points_reward'      => 50,
        ]);
    }

    private function progress(array $attrs = []): TrainingProgress
    {
        return TrainingProgress::create(array_merge([
            'user_id'        => $this->user->id,
            'module_id'      => $this->module->id,
            'help_viewed'    => true,
            'points_awarded' => false,
        ], $attrs));
    }

    // ── Points award ────────────────────────────────────────────────────────

    public function test_first_completion_awards_module_points(): void
    {
        $result = $this->service->checkAndComplete($this->progress());

        $this->assertNotNull($result);
        $this->assertEquals(50, $this->user->fresh()->points);
        $this->assertEquals(50, $result['module_points']);
    }

    public function test_already_completed_returns_null(): void
    {
        $result = $this->service->checkAndComplete(
            $this->progress(['module_completed' => true])
        );
        $this->assertNull($result);
        $this->assertEquals(0, $this->user->fresh()->points);
    }

    public function test_incomplete_requirements_returns_null(): void
    {
        $result = $this->service->checkAndComplete(
            $this->progress(['help_viewed' => false])
        );
        $this->assertNull($result);
    }

    // ── D4: No double-award ─────────────────────────────────────────────────

    public function test_no_double_award_after_restart(): void
    {
        // After restart: module_completed=false, but points_awarded remains true (D4)
        $result = $this->service->checkAndComplete(
            $this->progress(['points_awarded' => true])
        );

        $this->assertNotNull($result);
        $this->assertEquals(0, $this->user->fresh()->points, 'Restarted module must not re-award points');
        $this->assertEquals(0, $result['module_points']);
    }

    // ── D5: Expert cert at 500 pts ──────────────────────────────────────────

    public function test_expert_cert_issued_when_points_reach_500(): void
    {
        $this->user->update(['points' => 490]); // 490 + 50 = 540 ≥ 500

        $this->service->checkAndComplete($this->progress());

        $this->assertTrue(
            Certificate::where('user_id', $this->user->id)
                ->where('certificate_type', 'expert')->exists(),
            'Expert cert must be issued at 500+ points'
        );
    }

    public function test_expert_cert_not_issued_below_500_points(): void
    {
        $this->module->update(['points_reward' => 10]); // 0 + 10 = 10 < 500

        $this->service->checkAndComplete($this->progress());

        $this->assertFalse(
            Certificate::where('user_id', $this->user->id)
                ->where('certificate_type', 'expert')->exists()
        );
    }

    // ── Path cert ───────────────────────────────────────────────────────────

    public function test_path_cert_issued_when_all_modules_completed(): void
    {
        // Only one published module — completing it satisfies the path
        $this->service->checkAndComplete($this->progress());

        $this->assertTrue(
            Certificate::where('user_id', $this->user->id)
                ->where('certificate_type', 'path')->exists(),
            'Path cert must be issued when all published modules are complete'
        );
    }

    public function test_path_cert_not_issued_when_modules_remain(): void
    {
        TrainingModule::factory()->create(['is_published' => true]); // second module, not completed

        $this->service->checkAndComplete($this->progress());

        $this->assertFalse(
            Certificate::where('user_id', $this->user->id)
                ->where('certificate_type', 'path')->exists()
        );
    }

    // ── Module cert ─────────────────────────────────────────────────────────

    public function test_module_cert_issued_when_enabled(): void
    {
        $this->module->update(['certificate_enabled' => true]);

        $this->service->checkAndComplete($this->progress());

        $this->assertTrue(
            Certificate::where('user_id', $this->user->id)
                ->where('certificate_type', 'module')
                ->where('module_id', $this->module->id)
                ->exists()
        );
    }

    public function test_module_cert_not_issued_when_disabled(): void
    {
        $this->service->checkAndComplete($this->progress());

        $this->assertFalse(
            Certificate::where('user_id', $this->user->id)
                ->where('certificate_type', 'module')->exists()
        );
    }
}
