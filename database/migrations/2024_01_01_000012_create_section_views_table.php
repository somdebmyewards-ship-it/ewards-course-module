<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('section_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('module_id')->constrained('training_modules')->onDelete('cascade');
            $table->foreignId('section_id')->constrained('training_sections')->onDelete('cascade');
            $table->timestamp('viewed_at')->useCurrent();
            $table->unique(['user_id', 'section_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('section_views');
    }
};
