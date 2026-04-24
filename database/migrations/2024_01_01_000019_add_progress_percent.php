<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_progress', function (Blueprint $table) {
            $table->integer('progress_percent')->default(0)->after('quiz_score');
        });
    }

    public function down(): void
    {
        Schema::table('training_progress', function (Blueprint $table) {
            $table->dropColumn('progress_percent');
        });
    }
};
