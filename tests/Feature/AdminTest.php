<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin   = User::factory()->admin()->create(['points' => 0]);
        $this->cashier = User::factory()->create(['points' => 0]);
    }

    public function test_admin_can_list_users(): void
    {
        User::factory()->count(3)->create(['points' => 0]);

        Sanctum::actingAs($this->admin);

        $res = $this->getJson('/api/v1/admin/users')->assertOk();
        $this->assertGreaterThanOrEqual(4, count($res->json())); // admin + 3
    }

    public function test_cashier_cannot_list_users(): void
    {
        Sanctum::actingAs($this->cashier);

        $this->getJson('/api/v1/admin/users')->assertForbidden();
    }

    public function test_admin_can_approve_user(): void
    {
        $pending = User::factory()->unapproved()->create(['points' => 0]);

        Sanctum::actingAs($this->admin);

        $this->postJson("/api/v1/admin/approve/{$pending->id}")->assertOk();
        $this->assertTrue($pending->fresh()->approved);
    }

    public function test_cashier_cannot_approve_user(): void
    {
        $pending = User::factory()->unapproved()->create(['points' => 0]);

        Sanctum::actingAs($this->cashier);

        $this->postJson("/api/v1/admin/approve/{$pending->id}")->assertForbidden();
        $this->assertFalse($pending->fresh()->approved);
    }
}
