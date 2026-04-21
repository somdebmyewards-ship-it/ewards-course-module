<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('training_quizzes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('training_modules')->cascadeOnDelete();
            $table->text('question');
            $table->json('options');
            $table->string('correct_answer', 500);
            $table->text('explanation')->nullable();
            $table->unsignedInteger('display_order');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('training_quizzes'); }
};
