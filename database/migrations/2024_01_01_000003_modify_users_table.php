<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['ADMIN', 'TRAINER', 'CASHIER', 'CLIENT'])->default('CASHIER')->after('password');
            $table->boolean('approved')->default(false)->after('role');
            $table->foreignId('merchant_id')->nullable()->constrained()->nullOnDelete()->after('approved');
            $table->foreignId('outlet_id')->nullable()->constrained()->nullOnDelete()->after('merchant_id');
            $table->unsignedInteger('points')->default(0)->after('outlet_id');
            $table->timestamp('approved_at')->nullable()->after('points');
            $table->unsignedBigInteger('approved_by')->nullable()->after('approved_at');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['merchant_id']);
            $table->dropForeign(['outlet_id']);
            $table->dropColumn(['role', 'approved', 'merchant_id', 'outlet_id', 'points', 'approved_at', 'approved_by']);
        });
    }
};
