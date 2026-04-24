<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_token_for_valid_credentials(): void
    {
        $user = User::factory()->create(['password' => bcrypt('secret123')]);

        $res = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $res->assertOk()->assertJsonStructure(['token', 'user']);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('correct')]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'wrong',
        ])->assertUnauthorized();
    }

    public function test_login_rejects_unknown_email(): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => 'nobody@example.com',
            'password' => 'anything',
        ])->assertUnauthorized();
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create(['points' => 0]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_me_rejects_unauthenticated(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_logout_returns_ok(): void
    {
        $user = User::factory()->create(['points' => 0]);

        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/logout')->assertOk();

        // Confirm all tokens were deleted
        $this->assertEquals(0, $user->tokens()->count());
    }
}
