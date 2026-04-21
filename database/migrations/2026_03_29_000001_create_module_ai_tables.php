<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── AI Settings (feature flag per module) ─────────────────────
        Schema::create('module_ai_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('module_id')->unique();
            $table->boolean('assistant_enabled')->default(false);
            $table->boolean('use_cross_module_fallback')->default(false);
            $table->timestamp('last_indexed_at')->nullable();
            $table->string('index_status', 30)->default('not_indexed');
            // not_indexed | indexing | ready | failed
            $table->timestamps();

            $table->foreign('module_id')
                  ->references('id')->on('training_modules')
                  ->onDelete('cascade');
        });

        // ── AI Documents (source tracking) ────────────────────────────
        Schema::create('module_ai_documents', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('module_id');
            $table->string('source_type', 30);   // section | pdf | checklist | quiz
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('source_title')->nullable();
            $table->string('file_path')->nullable();
            $table->longText('raw_text');
            $table->string('status', 20)->default('pending');
            $table->timestamp('indexed_at')->nullable();
            $table->timestamps();

            $table->index(['module_id', 'source_type']);
            $table->foreign('module_id')
                  ->references('id')->on('training_modules')
                  ->onDelete('cascade');
        });

        // ── AI Chunks (text + metadata + embedding vector in MySQL) ─────
        Schema::create('module_ai_chunks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('document_id');
            $table->unsignedBigInteger('module_id');
            $table->text('chunk_text');
            $table->longText('embedding');   // JSON float[] — 384 dims (all-MiniLM-L6-v2)
            $table->smallInteger('chunk_index')->default(0);
            $table->string('source_type', 30);
            $table->string('source_title')->nullable();
            $table->timestamps();

            $table->index('module_id');
            $table->index('document_id');
            $table->foreign('document_id')
                  ->references('id')->on('module_ai_documents')
                  ->onDelete('cascade');
            $table->foreign('module_id')
                  ->references('id')->on('training_modules')
                  ->onDelete('cascade');
        });

        // ── AI Chat Logs ──────────────────────────────────────────────
        Schema::create('module_ai_chat_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('module_id');
            $table->text('question');
            $table->longText('answer');
            $table->json('sources')->nullable();
            $table->json('retrieved_chunk_ids')->nullable();
            $table->smallInteger('chunks_retrieved')->default(0);
            $table->boolean('answer_found')->default(true);
            $table->integer('tokens_used')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'module_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('module_ai_chat_logs');
        Schema::dropIfExists('module_ai_chunks');
        Schema::dropIfExists('module_ai_documents');
        Schema::dropIfExists('module_ai_settings');
    }
};
