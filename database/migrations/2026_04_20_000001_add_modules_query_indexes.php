<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lms_modules', function (Blueprint $table) {
            $table->index('is_published', 'lm_is_published_idx');
            $table->index(['is_published', 'display_order'], 'lm_published_order_idx');
        });
    }

    public function down(): void
    {
        Schema::table('lms_modules', function (Blueprint $table) {
            $table->dropIndex('lm_is_published_idx');
            $table->dropIndex('lm_published_order_idx');
        });
    }
};
