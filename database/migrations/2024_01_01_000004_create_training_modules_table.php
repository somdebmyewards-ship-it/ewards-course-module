<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('training_modules', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description');
            $table->string('icon', 50)->default('');
            $table->unsignedInteger('display_order');
            $table->string('video_url', 500)->default('');
            $table->json('image_urls')->nullable();
            $table->json('document_urls')->nullable();
            $table->unsignedInteger('points_reward')->default(10);
            $table->boolean('is_published')->default(false);
            $table->string('page_route', 255)->default('');
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('training_modules'); }
};
