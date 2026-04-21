<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('training_sections', function (Blueprint $table) {
            if (!Schema::hasColumn('training_sections', 'image_urls')) {
                $table->json('image_urls')->nullable()->after('media_url');
            }
            if (!Schema::hasColumn('training_sections', 'document_urls')) {
                $table->json('document_urls')->nullable()->after('image_urls');
            }
            if (!Schema::hasColumn('training_sections', 'is_required')) {
                $table->boolean('is_required')->default(false)->after('document_urls');
            }
        });
    }

    public function down(): void
    {
        Schema::table('training_sections', function (Blueprint $table) {
            $table->dropColumn(['image_urls', 'document_urls', 'is_required']);
        });
    }
};
