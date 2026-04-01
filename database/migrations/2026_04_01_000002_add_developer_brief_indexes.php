<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Developer Brief C1 — Add missing composite indexes for query optimization.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Bookmarks: user_id + module_id (common query pattern)
        Schema::table('lms_bookmarks', function (Blueprint $table) {
            $table->index(['user_id', 'module_id'], 'bk_user_module_idx');
        });

        // Certificates: user_id + certificate_type (common lookup)
        Schema::table('lms_certificates', function (Blueprint $table) {
            $table->index(['user_id', 'certificate_type'], 'cert_user_type_idx');
        });

        // Quiz attempts: user_id + module_id (analytics queries)
        Schema::table('lms_quiz_attempts', function (Blueprint $table) {
            $table->index(['user_id', 'module_id'], 'qa_user_module_idx');
        });

        // Training progress: user_id index (already has unique on user_id+module_id, but single col helps)
        Schema::table('lms_training_progress', function (Blueprint $table) {
            $table->index('user_id', 'tp_user_idx');
        });

        // Module feedback: module_id index for analytics aggregation
        Schema::table('lms_module_feedback', function (Blueprint $table) {
            $table->index('module_id', 'mf_module_idx');
        });
    }

    public function down(): void
    {
        Schema::table('lms_bookmarks', function (Blueprint $table) {
            $table->dropIndex('bk_user_module_idx');
        });
        Schema::table('lms_certificates', function (Blueprint $table) {
            $table->dropIndex('cert_user_type_idx');
        });
        Schema::table('lms_quiz_attempts', function (Blueprint $table) {
            $table->dropIndex('qa_user_module_idx');
        });
        Schema::table('lms_training_progress', function (Blueprint $table) {
            $table->dropIndex('tp_user_idx');
        });
        Schema::table('lms_module_feedback', function (Blueprint $table) {
            $table->dropIndex('mf_module_idx');
        });
    }
};
