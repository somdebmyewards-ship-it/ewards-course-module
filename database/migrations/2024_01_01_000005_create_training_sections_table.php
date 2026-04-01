<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('training_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('module_id')->constrained('training_modules')->cascadeOnDelete();
            $table->string('title');
            $table->longText('body');
            $table->enum('content_type', ['text', 'video', 'image', 'document'])->default('text');
            $table->string('media_url', 500)->default('');
            $table->unsignedInteger('display_order');
            $table->text('key_takeaway')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('training_sections'); }
};
