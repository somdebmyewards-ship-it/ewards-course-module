<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('lms_users') && !Schema::hasColumn('lms_users', 'deleted_at')) {
            Schema::table('lms_users', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('lms_users') && Schema::hasColumn('lms_users', 'deleted_at')) {
            Schema::table('lms_users', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
