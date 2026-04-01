<?php

return [
    // ── HuggingFace (free) ──────────────────────────────────────────
    // Embedding model: 384 dims, fast, free on HF inference API
    'embedding_model' => env('HF_EMBEDDING_MODEL', 'sentence-transformers/all-MiniLM-L6-v2'),

    // Chat model (Groq — fast, free, OpenAI-compatible)
    'chat_model'      => env('GROQ_CHAT_MODEL', 'llama3-8b-8192'),

    // Groq base URL (OpenAI-compatible)
    'llm_base_url'    => env('LLM_BASE_URL', 'https://api.groq.com/openai/v1'),

    // ── Chunking ────────────────────────────────────────────────────
    'chunk_size'      => (int) env('AI_CHUNK_SIZE',    400),  // tokens approx
    'chunk_overlap'   => (int) env('AI_CHUNK_OVERLAP',  80),

    // ── Retrieval ───────────────────────────────────────────────────
    'max_context_chunks' => (int)   env('AI_MAX_CONTEXT_CHUNKS', 5),
    'min_score'          => (float) env('AI_MIN_SIMILARITY_SCORE', 0.20),

    // ── Rate limiting ───────────────────────────────────────────────
    'rate_limit'      => (int) env('AI_RATE_LIMIT_PER_MINUTE', 8),
];
