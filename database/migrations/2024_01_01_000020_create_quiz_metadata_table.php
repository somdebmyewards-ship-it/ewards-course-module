<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_metadata', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('module_id');
            $table->string('title')->default('Module Quiz');
            $table->integer('passing_percent')->default(75);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('module_id')->references('id')->on('training_modules')->onDelete('cascade');
        });

        Schema::table('training_quizzes', function (Blueprint $table) {
            $table->unsignedBigInteger('quiz_metadata_id')->nullable()->after('module_id');
        });
    }

    public function down(): void
    {
        Schema::table('training_quizzes', function (Blueprint $table) {
            $table->dropColumn('quiz_metadata_id');
        });

        Schema::dropIfExists('quiz_metadata');
    }
};
