<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('training_sections', function (Blueprint $table) {
            if (!Schema::hasColumn('training_sections', 'is_required')) {
                $table->boolean('is_required')->default(true)->after('key_takeaway');
            }
        });
    }
    public function down(): void
    {
        Schema::table('training_sections', function (Blueprint $table) {
            $table->dropColumn('is_required');
        });
    }
};
