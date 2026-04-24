<?php

namespace Tests\Feature;

use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProgressTest extends TestCase
{
    use RefreshDatabase;

    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cashier = User::factory()->create(['role' => 'CASHIER', 'approved' => true, 'points' => 0]);
    }

    public function test_progress_index_returns_modules_with_progress(): void
    {
        TrainingModule::factory()->count(2)->create(['is_published' => true]);

        Sanctum::actingAs($this->cashier);

        $res = $this->getJson('/api/v1/progress')->assertOk();
        $this->assertCount(2, $res->json('modules'));
        $this->assertEquals(0, $res->json('completed'));
        $this->assertEquals(2, $res->json('total'));
    }

    public function test_mark_help_viewed_persists(): void
    {
        $module = TrainingModule::factory()->create(['is_published' => true]);

        Sanctum::actingAs($this->cashier);

        $this->postJson("/api/v1/progress/{$module->id}/help-viewed")->assertOk();

        $progress = TrainingProgress::where('user_id', $this->cashier->id)
            ->where('module_id', $module->id)
            ->first();
        $this->assertNotNull($progress);
        $this->assertTrue($progress->help_viewed);
    }

    public function test_progress_show_returns_module_progress(): void
    {
        $module = TrainingModule::factory()->create(['is_published' => true]);
        TrainingProgress::create([
            'user_id' => $this->cashier->id,
            'module_id' => $module->id,
            'help_viewed' => true,
        ]);

        Sanctum::actingAs($this->cashier);

        $res = $this->getJson("/api/v1/progress/{$module->id}")->assertOk();
        $this->assertTrue($res->json('help_viewed'));
    }

    public function test_unapproved_user_cannot_access_progress(): void
    {
        $unapproved = User::factory()->unapproved()->create(['points' => 0]);
        Sanctum::actingAs($unapproved);

        $this->getJson('/api/v1/progress')->assertForbidden();
    }

    public function test_checklist_update_persists(): void
    {
        $module = TrainingModule::factory()->create(['is_published' => true]);

        Sanctum::actingAs($this->cashier);

        $this->postJson("/api/v1/progress/{$module->id}/checklist", [
            'checklist_item_id' => 1,
            'checked' => true,
        ])->assertOk();

        $progress = TrainingProgress::where('user_id', $this->cashier->id)
            ->where('module_id', $module->id)
            ->first();
        $this->assertNotNull($progress);
        $this->assertNotNull($progress->checklist_state);
    }
}
