<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // The columns module_id, certificate_type, certificate_code already exist from a prior partial run.
        // The unique index on user_id and foreign key were already handled.
        // This migration is now a no-op since the schema is already in the desired state.
        if (!Schema::hasColumn('certificates', 'module_id')) {
            Schema::table('certificates', function (Blueprint $table) {
                $table->foreignId('module_id')->nullable()->after('user_id')->constrained('training_modules')->onDelete('set null');
                $table->string('certificate_type')->default('module')->after('module_id');
                $table->string('certificate_code')->nullable()->after('certificate_type');
            });
        }
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            if (Schema::hasColumn('certificates', 'module_id')) {
                $table->dropForeign(['module_id']);
                $table->dropColumn(['module_id', 'certificate_type', 'certificate_code']);
            }
            $table->unique('user_id');
        });
    }
};
