<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('training_sections', function (Blueprint $table) {
            $table->boolean('is_required')->default(false)->after('key_takeaway');
            $table->string('status')->default('published')->after('is_required');
            $table->string('video_url')->nullable()->after('media_url');
        });
    }

    public function down(): void
    {
        Schema::table('training_sections', function (Blueprint $table) {
            $table->dropColumn(['is_required', 'status', 'video_url']);
        });
    }
};
