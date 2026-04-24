<?php

namespace Tests\Feature;

use App\Models\Certificate;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CertificateTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->getJson('/api/v1/certificates')->assertUnauthorized();
    }

    public function test_user_with_no_certificates_gets_404(): void
    {
        Sanctum::actingAs(User::factory()->create(['points' => 0]));

        $this->getJson('/api/v1/certificates')
            ->assertNotFound()
            ->assertJsonFragment(['eligible' => false]);
    }

    public function test_unapproved_user_cannot_access_certificates(): void
    {
        Sanctum::actingAs(User::factory()->unapproved()->create(['points' => 0]));

        $this->getJson('/api/v1/certificates')->assertForbidden();
    }

    // ── autoIssueMissing via HTTP ────────────────────────────────────────────

    public function test_expert_cert_auto_issued_on_show_when_user_has_500_points(): void
    {
        $user = User::factory()->create(['points' => 500]);
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/certificates');

        $response->assertOk()->assertJsonFragment(['eligible' => true]);
        $this->assertTrue(
            Certificate::where('user_id', $user->id)
                ->where('certificate_type', 'expert')->exists(),
            'Expert cert must be auto-issued on certificates page load for 500+ pt user'
        );
    }

    public function test_path_cert_auto_issued_on_show_when_all_modules_completed(): void
    {
        $module = TrainingModule::factory()->create(['is_published' => true, 'certificate_enabled' => false]);
        $user   = User::factory()->create(['points' => 0]);
        Sanctum::actingAs($user);

        TrainingProgress::create([
            'user_id'          => $user->id,
            'module_id'        => $module->id,
            'module_completed' => true,
            'help_viewed'      => true,
            'points_awarded'   => true,
        ]);

        $response = $this->getJson('/api/v1/certificates');

        $response->assertOk();
        $this->assertTrue(
            Certificate::where('user_id', $user->id)
                ->where('certificate_type', 'path')->exists(),
            'Path cert must be auto-issued when all published modules are completed'
        );
    }

    public function test_module_cert_auto_issued_on_show_when_cert_enabled(): void
    {
        $module = TrainingModule::factory()->create(['is_published' => true, 'certificate_enabled' => true]);
        $user   = User::factory()->create(['points' => 0]);
        Sanctum::actingAs($user);

        TrainingProgress::create([
            'user_id'          => $user->id,
            'module_id'        => $module->id,
            'module_completed' => true,
            'help_viewed'      => true,
            'points_awarded'   => true,
        ]);

        $response = $this->getJson('/api/v1/certificates');

        $response->assertOk();
        $this->assertTrue(
            Certificate::where('user_id', $user->id)
                ->where('certificate_type', 'module')
                ->where('module_id', $module->id)->exists(),
            'Module cert must be auto-issued when module certificate_enabled=true and module is completed'
        );
    }
}
