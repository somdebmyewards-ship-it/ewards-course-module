<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop foreign key first, then unique index, then re-add foreign key + new composite unique
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('certificates', function (Blueprint $table) {
            $table->dropUnique(['user_id']);
        });

        Schema::table('certificates', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->unique(['user_id', 'certificate_type', 'module_id'], 'cert_user_type_module');
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropUnique('cert_user_type_module');
            $table->unique('user_id');
        });
    }
};
