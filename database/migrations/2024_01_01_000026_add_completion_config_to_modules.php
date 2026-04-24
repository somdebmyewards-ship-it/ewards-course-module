<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            if (!Schema::hasColumn('training_modules', 'require_help_viewed')) {
                $table->boolean('require_help_viewed')->default(true)->after('quiz_enabled');
            }
            if (!Schema::hasColumn('training_modules', 'require_checklist')) {
                $table->boolean('require_checklist')->default(true)->after('require_help_viewed');
            }
            if (!Schema::hasColumn('training_modules', 'require_quiz')) {
                $table->boolean('require_quiz')->default(false)->after('require_checklist');
            }
            if (!Schema::hasColumn('training_modules', 'certificate_enabled')) {
                // certificate_enabled may already exist from original schema
                $table->boolean('certificate_enabled')->default(true)->after('require_quiz');
            }
        });
    }
    public function down(): void
    {
        Schema::table('training_modules', function (Blueprint $table) {
            $table->dropColumn(['require_help_viewed', 'require_checklist', 'require_quiz']);
        });
    }
};
