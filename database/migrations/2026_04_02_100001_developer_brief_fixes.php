<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // C1: Ensure exactly ONE composite unique index on certificates.
        // The earlier migration (2026_03_28) created 'cert_user_type_module' on the old table.
        // After rename to lms_certificates, that index still exists. Only create if missing.
        if (Schema::hasTable('lms_certificates')) {
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexes = collect($sm->listTableIndexes('lms_certificates'))->keys()->toArray();

            // If the old index name exists (from 2026_03_28 rename), we're covered
            $hasComposite = in_array('cert_user_type_module', $indexes)
                         || in_array('lms_certs_user_type_module_unique', $indexes);

            if (!$hasComposite) {
                Schema::table('lms_certificates', function (Blueprint $table) {
                    $table->unique(['user_id', 'certificate_type', 'module_id'], 'lms_certs_user_type_module_unique');
                });
            }
        }

        // C5: Add soft deletes to key tables
        if (Schema::hasTable('lms_modules') && !Schema::hasColumn('lms_modules', 'deleted_at')) {
            Schema::table('lms_modules', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('lms_users') && !Schema::hasColumn('lms_users', 'deleted_at')) {
            Schema::table('lms_users', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // H1: Audit log table for admin actions
        if (!Schema::hasTable('lms_audit_logs')) {
            Schema::create('lms_audit_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('action', 100); // e.g. 'user.approve', 'module.create'
                $table->string('target_type', 100)->nullable(); // e.g. 'user', 'module'
                $table->unsignedBigInteger('target_id')->nullable();
                $table->json('metadata')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();
                $table->index(['target_type', 'target_id']);
            });
        }

        // H2: Points transaction ledger
        if (!Schema::hasTable('lms_points_ledger')) {
            Schema::create('lms_points_ledger', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->index();
                $table->integer('points');
                $table->string('reason', 100); // 'module_complete', 'quiz_bonus', 'admin_adjust'
                $table->unsignedBigInteger('module_id')->nullable();
                $table->integer('balance_after');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        // Drop whichever composite unique index exists
        if (Schema::hasTable('lms_certificates')) {
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexes = collect($sm->listTableIndexes('lms_certificates'))->keys()->toArray();

            if (in_array('lms_certs_user_type_module_unique', $indexes)) {
                Schema::table('lms_certificates', function (Blueprint $table) {
                    $table->dropUnique('lms_certs_user_type_module_unique');
                });
            }
        }

        if (Schema::hasColumn('lms_modules', 'deleted_at')) {
            Schema::table('lms_modules', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasColumn('lms_users', 'deleted_at')) {
            Schema::table('lms_users', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        Schema::dropIfExists('lms_audit_logs');
        Schema::dropIfExists('lms_points_ledger');
    }
};
