<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('lms_points_ledger')) {
            Schema::create('lms_points_ledger', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->integer('points');
                $table->string('reason', 100);
                $table->unsignedBigInteger('module_id')->nullable();
                $table->integer('balance_after')->default(0);
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('lms_users')->onDelete('cascade');
                $table->index('user_id');
            });
        }

        if (!Schema::hasTable('lms_audit_logs')) {
            Schema::create('lms_audit_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('action', 100);
                $table->string('target_type', 50)->nullable();
                $table->unsignedBigInteger('target_id')->nullable();
                $table->json('metadata')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();

                $table->foreign('user_id')->references('id')->on('lms_users')->onDelete('set null');
                $table->index(['action', 'created_at']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('lms_audit_logs');
        Schema::dropIfExists('lms_points_ledger');
    }
};
