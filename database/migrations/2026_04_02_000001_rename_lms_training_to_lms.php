<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Fix table naming: lms_training_* → lms_* and lms_module_ai_* → lms_ai_*
 * This migration handles existing databases that already ran the first rename.
 */
return new class extends Migration
{
    private array $renames = [
        'lms_training_modules'    => 'lms_modules',
        'lms_training_sections'   => 'lms_sections',
        'lms_training_checklists' => 'lms_checklists',
        'lms_training_quizzes'    => 'lms_quizzes',
        'lms_training_progress'   => 'lms_progress',
        'lms_module_ai_settings'  => 'lms_ai_settings',
        'lms_module_ai_documents' => 'lms_ai_documents',
        'lms_module_ai_chunks'    => 'lms_ai_chunks',
        'lms_module_ai_chat_logs' => 'lms_ai_chat_logs',
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
