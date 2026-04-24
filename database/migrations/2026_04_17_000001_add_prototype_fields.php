<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lms_progress', function (Blueprint $table) {
            $table->boolean('prototype_completed')->default(false)->after('checklist_completed_at');
            $table->timestamp('prototype_completed_at')->nullable()->after('prototype_completed');
            $table->json('prototype_progress')->nullable()->after('prototype_completed_at');
        });

        Schema::table('lms_modules', function (Blueprint $table) {
            $table->json('prototype_config')->nullable()->after('completion_rules');
        });
    }

    public function down(): void
    {
        Schema::table('lms_progress', function (Blueprint $table) {
            $table->dropColumn(['prototype_completed', 'prototype_completed_at', 'prototype_progress']);
        });

        Schema::table('lms_modules', function (Blueprint $table) {
            $table->dropColumn('prototype_config');
        });
    }
};
