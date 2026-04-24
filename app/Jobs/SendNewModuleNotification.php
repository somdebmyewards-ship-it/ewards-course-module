<?php

namespace App\Jobs;

use App\Mail\NewModulePublished;
use App\Models\TrainingModule;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class SendNewModuleNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private int $moduleId) {}

    public function handle(): void
    {
        $module = TrainingModule::find($this->moduleId);
        if (!$module || !$module->is_published) return;

        // Send in chunks to avoid memory issues at scale
        DB::table('lms_users')
            ->where('approved', true)
            ->whereNotNull('email')
            ->orderBy('id')
            ->chunk(100, function ($users) use ($module) {
                foreach ($users as $user) {
                    Mail::to($user->email)
                        ->queue(new NewModulePublished($module, $user->name));
                }
            });
    }
}
