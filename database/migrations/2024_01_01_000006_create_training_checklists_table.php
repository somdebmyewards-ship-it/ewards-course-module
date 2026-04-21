<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('training_checklists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('training_modules')->cascadeOnDelete();
            $table->string('label', 500);
            $table->unsignedInteger('display_order');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('training_checklists'); }
};
