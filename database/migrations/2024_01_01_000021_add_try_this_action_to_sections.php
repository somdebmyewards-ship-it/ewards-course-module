<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_sections', function (Blueprint $table) {
            $table->text('try_this_action')->nullable()->after('key_takeaway');
        });
    }

    public function down(): void
    {
        Schema::table('training_sections', function (Blueprint $table) {
            $table->dropColumn('try_this_action');
        });
    }
};
