<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (!Schema::hasColumn('training_modules', 'completion_rules')) {
                $table->json('completion_rules')->nullable()->after('quiz_enabled');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->dropColumn('completion_rules');
        });
    }
};
