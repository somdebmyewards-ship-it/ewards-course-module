<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('training_progress', function (Blueprint $table) {
            $table->json('quiz_answers')->nullable()->after('quiz_score');
        });
    }

    public function down(): void
    {
        Schema::table('training_progress', function (Blueprint $table) {
            $table->dropColumn('quiz_answers');
        });
    }
};
