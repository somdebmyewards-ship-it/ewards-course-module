<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * MANDATORY 2 — Developer Brief: Rename ALL tables with lms_ prefix.
 */
return new class extends Migration
{
    private array $renames = [
        'merchants'              => 'lms_merchants',
        'outlets'                => 'lms_outlets',
        'users'                  => 'lms_users',
        'training_modules'       => 'lms_training_modules',
        'training_sections'      => 'lms_training_sections',
        'training_checklists'    => 'lms_training_checklists',
        'training_quizzes'       => 'lms_training_quizzes',
        'training_progress'      => 'lms_training_progress',
        'bookmarks'              => 'lms_bookmarks',
        'certificates'           => 'lms_certificates',
        'media'                  => 'lms_media',
        'section_views'          => 'lms_section_views',
        'module_routes'          => 'lms_module_routes',
        'quiz_attempts'          => 'lms_quiz_attempts',
        'quiz_metadata'          => 'lms_quiz_metadata',
        'module_feedback'        => 'lms_module_feedback',
        'module_ai_settings'     => 'lms_module_ai_settings',
        'module_ai_documents'    => 'lms_module_ai_documents',
        'module_ai_chunks'       => 'lms_module_ai_chunks',
        'module_ai_chat_logs'    => 'lms_module_ai_chat_logs',
        'password_reset_tokens'  => 'lms_password_reset_tokens',
        'failed_jobs'            => 'lms_failed_jobs',
        'personal_access_tokens' => 'lms_personal_access_tokens',
        'jobs'                   => 'lms_jobs',
    ];

    public function up(): void
    {
        foreach ($this->renames as $old => $new) {
            if (Schema::hasTable($old) && !Schema::hasTable($new)) {
                Schema::rename($old, $new);
            }
        }
    }

    public function down(): void
    {
        foreach ($this->renames as $old => $new) {
            if (Schema::hasTable($new) && !Schema::hasTable($old)) {
                Schema::rename($new, $old);
            }
        }
    }
};
