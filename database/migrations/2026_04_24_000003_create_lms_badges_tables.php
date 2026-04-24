<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('lms_badges', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->string('description', 255);
            $table->string('icon_emoji', 10)->default('🏅');
            $table->timestamps();
        });

        Schema::create('lms_user_badges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('lms_users')->cascadeOnDelete();
            $table->foreignId('badge_id')->constrained('lms_badges')->cascadeOnDelete();
            $table->timestamp('awarded_at');
            $table->unique(['user_id', 'badge_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_user_badges');
        Schema::dropIfExists('lms_badges');
    }
};
