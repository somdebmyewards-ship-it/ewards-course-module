<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('certificates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('issued_at')->useCurrent();
            $table->boolean('enabled_by_admin')->default(false);
            $table->string('certificate_url', 500)->nullable();
            $table->timestamps();
            $table->unique(['user_id']);
        });
    }
    public function down(): void { Schema::dropIfExists('certificates'); }
};
