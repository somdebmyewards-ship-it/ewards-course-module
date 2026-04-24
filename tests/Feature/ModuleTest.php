<?php

namespace Tests\Feature;

use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ModuleTest extends TestCase
{
    use RefreshDatabase;

    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->cashier = User::factory()->create(['role' => 'CASHIER', 'approved' => true, 'points' => 0]);
    }

    public function test_unauthenticated_cannot_list_modules(): void
    {
        $this->getJson('/api/v1/modules')->assertUnauthorized();
    }

    public function test_unapproved_user_cannot_list_modules(): void
    {
        $unapproved = User::factory()->unapproved()->create(['points' => 0]);
        Sanctum::actingAs($unapproved);

        $this->getJson('/api/v1/modules')->assertForbidden();
    }

    public function test_approved_user_sees_published_modules(): void
    {
        TrainingModule::factory()->count(3)->create(['is_published' => true]);
        TrainingModule::factory()->create(['is_published' => false]);

        Sanctum::actingAs($this->cashier);

        $res = $this->getJson('/api/v1/modules')->assertOk();
        $this->assertCount(3, $res->json('modules'));
    }

    public function test_module_show_returns_404_for_bad_slug(): void
    {
        Sanctum::actingAs($this->cashier);

        $this->getJson('/api/v1/modules/no-such-slug')->assertNotFound();
    }

    public function test_module_show_returns_module_data(): void
    {
        $module = TrainingModule::factory()->create([
            'is_published' => true,
            'slug' => 'cash-handling-101',
        ]);

        Sanctum::actingAs($this->cashier);

        // show() returns the module fields directly (not nested under 'module' key)
        $res = $this->getJson("/api/v1/modules/{$module->slug}")->assertOk();
        $this->assertEquals('cash-handling-101', $res->json('slug'));
    }
}
