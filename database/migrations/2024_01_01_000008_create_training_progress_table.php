<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('training_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('module_id')->constrained('training_modules')->cascadeOnDelete();
            $table->boolean('help_viewed')->default(false);
            $table->timestamp('help_viewed_at')->nullable();
            $table->json('checklist_state')->nullable();
            $table->boolean('checklist_completed')->default(false);
            $table->timestamp('checklist_completed_at')->nullable();
            $table->boolean('quiz_completed')->default(false);
            $table->timestamp('quiz_completed_at')->nullable();
            $table->unsignedInteger('quiz_score')->default(0);
            $table->boolean('module_completed')->default(false);
            $table->timestamp('module_completed_at')->nullable();
            $table->foreignId('last_section_id')->nullable()->constrained('training_sections')->nullOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'module_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('training_progress'); }
};
