<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('merchant_name_entered')->nullable()->after('outlet_id');
            $table->string('outlet_name_entered')->nullable()->after('merchant_name_entered');
            $table->string('ewards_reference')->nullable()->after('outlet_name_entered');
            $table->string('designation')->nullable()->after('ewards_reference');
            $table->string('mobile')->nullable()->after('designation');
            $table->string('rejection_reason')->nullable()->after('approved_by');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['merchant_name_entered', 'outlet_name_entered', 'ewards_reference', 'designation', 'mobile', 'rejection_reason']);
        });
    }
};
