<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('module_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('training_modules')->onDelete('cascade');
            $table->string('route_path');
            $table->foreignId('section_id')->nullable()->constrained('training_sections')->onDelete('set null');
            $table->string('context_label')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_routes');
    }
};
