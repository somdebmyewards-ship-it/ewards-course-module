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

    // ── Hybrid Search (BM25 + Vector + Reranker) ────────────────────
    // 'vector' = pure cosine similarity (original behavior)
    // 'hybrid' = BM25 + Vector + Reranker (reduces hallucination)
    'retrieval_mode' => env('AI_RETRIEVAL_MODE', 'vector'),

    'bm25' => [
        'top_k' => (int) env('AI_BM25_TOP_K', 20), // candidates before reranking
    ],

    'reranker' => [
        // 'rrf'           = Reciprocal Rank Fusion (no API, pure PHP, ~0ms)
        // 'cross_encoder' = HuggingFace cross-encoder (more accurate, +300-600ms)
        'strategy'            => env('AI_RERANKER_STRATEGY', 'rrf'),
        'rrf_k'               => (int)   env('AI_RRF_K', 60),
        'vector_weight'       => (float) env('AI_VECTOR_WEIGHT', 1.0),
        'bm25_weight'         => (float) env('AI_BM25_WEIGHT', 1.0),
        'cross_encoder_model' => env('AI_CROSS_ENCODER_MODEL', 'cross-encoder/ms-marco-MiniLM-L-6-v2'),
    ],

    // ── Rate limiting ───────────────────────────────────────────────
    'rate_limit'      => (int) env('AI_RATE_LIMIT_PER_MINUTE', 8),
];
