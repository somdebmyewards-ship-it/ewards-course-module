<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->integer('estimated_minutes')->default(5)->after('description');
            $table->boolean('quiz_enabled')->default(true)->after('points_reward');
            $table->boolean('certificate_enabled')->default(false)->after('quiz_enabled');
            $table->unsignedBigInteger('created_by')->nullable()->after('is_published');
            $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->dropColumn(['estimated_minutes', 'quiz_enabled', 'certificate_enabled', 'created_by', 'updated_by']);
        });
    }
};
