<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // training_progress indexes
        Schema::table('training_progress', function (Blueprint $table) {
            $table->index('module_id', 'tp_module_id_idx');
            $table->index('module_completed', 'tp_module_completed_idx');
            $table->index(['module_id', 'module_completed'], 'tp_module_completed_combo_idx');
        });

        // section_views indexes
        Schema::table('section_views', function (Blueprint $table) {
            $table->index('module_id', 'sv_module_id_idx');
            $table->index(['module_id', 'user_id'], 'sv_module_user_idx');
        });

        // module_feedback indexes
        Schema::table('module_feedback', function (Blueprint $table) {
            $table->index('module_id', 'mf_module_id_idx');
            $table->index('rating', 'mf_rating_idx');
        });

        // training_sections index for completion checks
        Schema::table('training_sections', function (Blueprint $table) {
            $table->index(['module_id', 'is_required'], 'ts_module_required_idx');
        });
    }

    public function down(): void
    {
        Schema::table('training_progress', function (Blueprint $table) {
            $table->dropIndex('tp_module_id_idx');
            $table->dropIndex('tp_module_completed_idx');
            $table->dropIndex('tp_module_completed_combo_idx');
        });

        Schema::table('section_views', function (Blueprint $table) {
            $table->dropIndex('sv_module_id_idx');
            $table->dropIndex('sv_module_user_idx');
        });

        Schema::table('module_feedback', function (Blueprint $table) {
            $table->dropIndex('mf_module_id_idx');
            $table->dropIndex('mf_rating_idx');
        });

        Schema::table('training_sections', function (Blueprint $table) {
            $table->dropIndex('ts_module_required_idx');
        });
    }
};
