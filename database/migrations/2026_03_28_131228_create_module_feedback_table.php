<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('module_id')->constrained('training_modules')->onDelete('cascade');
            $table->tinyInteger('rating')->default(0); // 1-5 stars
            $table->text('comment')->nullable(); // Free text feedback
            $table->text('improvement_suggestion')->nullable(); // What content to improve
            $table->timestamps();

            $table->unique(['user_id', 'module_id']); // One feedback per user per module
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_feedback');
    }
};
