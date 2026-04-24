<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * D4: Prevent double-awarding points on module restart.
 * Once points have been awarded for a module, this flag is set.
 * Restarting resets all progress EXCEPT this flag — points are not re-earned.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_progress', function (Blueprint $table) {
            $table->boolean('points_awarded')->default(false)->after('module_completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('lms_progress', function (Blueprint $table) {
            $table->dropColumn('points_awarded');
        });
    }
};
