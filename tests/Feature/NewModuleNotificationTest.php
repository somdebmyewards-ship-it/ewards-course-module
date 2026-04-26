<?php

namespace Tests\Feature;

use App\Jobs\SendNewModuleNotification;
use App\Mail\NewModulePublished;
use App\Models\TrainingModule;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NewModuleNotificationTest extends TestCase
{
    use RefreshDatabase;

    // ── Job dispatch on publish flip ─────────────────────────────────────────

    public function test_publishing_a_module_dispatches_notification_job(): void
    {
        Queue::fake();

        $admin  = User::factory()->admin()->create();
        $module = TrainingModule::factory()->create(['is_published' => false]);

        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/cm/modules/{$module->id}", [
            'title'        => $module->title,
            'description'  => $module->description,
            'is_published' => true,
        ])->assertOk();

        Queue::assertPushed(SendNewModuleNotification::class, function ($job) use ($module) {
            return $this->getJobModuleId($job) === $module->id;
        });
    }

    public function test_updating_already_published_module_does_not_dispatch_again(): void
    {
        Queue::fake();

        $admin  = User::factory()->admin()->create();
        $module = TrainingModule::factory()->create(['is_published' => true]);

        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/cm/modules/{$module->id}", [
            'title'        => 'Updated Title',
            'description'  => $module->description,
            'is_published' => true,
        ])->assertOk();

        Queue::assertNothingPushed();
    }

    public function test_unpublishing_a_module_does_not_dispatch_job(): void
    {
        Queue::fake();

        $admin  = User::factory()->admin()->create();
        $module = TrainingModule::factory()->create(['is_published' => true]);

        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/cm/modules/{$module->id}", [
            'title'        => $module->title,
            'description'  => $module->description,
            'is_published' => false,
        ])->assertOk();

        Queue::assertNothingPushed();
    }

    // ── Job handle() — emails approved users ─────────────────────────────────

    public function test_job_sends_mail_to_all_approved_users_with_email(): void
    {
        Mail::fake();

        $module = TrainingModule::factory()->create(['is_published' => true]);

        User::factory()->create(['approved' => true,  'email' => 'a@example.com']);
        User::factory()->create(['approved' => true,  'email' => 'b@example.com']);
        User::factory()->create(['approved' => false, 'email' => 'c@example.com']); // excluded

        $job = new SendNewModuleNotification($module->id);
        $job->handle();

        Mail::assertQueued(NewModulePublished::class, 2);
    }

    public function test_job_skips_unpublished_module(): void
    {
        Mail::fake();

        $module = TrainingModule::factory()->create(['is_published' => false]);
        User::factory()->count(3)->create(['approved' => true]);

        $job = new SendNewModuleNotification($module->id);
        $job->handle();

        Mail::assertNothingQueued();
    }

    public function test_job_skips_nonexistent_module(): void
    {
        Mail::fake();

        $job = new SendNewModuleNotification(99999);
        $job->handle();

        Mail::assertNothingQueued();
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private function getJobModuleId(SendNewModuleNotification $job): int
    {
        $ref = new \ReflectionClass($job);
        $prop = $ref->getProperty('moduleId');
        $prop->setAccessible(true);
        return $prop->getValue($job);
    }
}
