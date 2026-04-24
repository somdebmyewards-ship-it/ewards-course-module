<?php

namespace App\Services\AI;

use App\Models\ModuleAiChunk;

/**
 * Hybrid Retrieval Service — BM25 + Vector + Reranker.
 *
 * Architecture:
 *   User Query
 *       ├── BM25 Search (keyword matching, PHP-based)
 *       └── Vector Search (cosine similarity, PHP-based)
 *              ↓
 *        Reranker (RRF or cross-encoder)
 *              ↓
 *         Top-K chunks → LLM
 *
 * Backward compatible: when no query text is set or retrieval_mode='vector',
 * falls back to the original pure-vector cosine similarity search.
 */
class RetrievalService
{
    private float  $minScore;
    private string $queryText = '';

    public function __construct(
        private EmbeddingService   $embedder,
        private BM25SearchService  $bm25,
        private RerankerService    $reranker,
    ) {
        $this->minScore = (float) config('ai.min_score', 0.20);
    }

    /**
     * Set the raw query text for hybrid (BM25) search.
     * Call before retrieve() to enable hybrid mode.
     *
     * Usage: $this->retriever->forQuery($question)->retrieve(...)
     */
    public function forQuery(string $queryText): self
    {
        $this->queryText = $queryText;
        return $this;
    }

    /**
     * Find top-k most relevant chunks for a question embedding.
     *
     * When hybrid mode is active (query text set + config = 'hybrid'),
     * runs BM25 + vector in parallel and fuses via reranker.
     * Otherwise, falls back to pure vector search (original behavior).
     *
     * @param  int   $moduleId
     * @param  array $questionEmbedding  float[] from EmbeddingService
     * @param  int   $topK
     * @param  bool  $crossModule        Search all modules (fallback only)
     * @return array [{id, text, source_type, source_title, module_id, score}]
     */
    public function retrieve(int $moduleId, array $questionEmbedding, int $topK = 5, bool $crossModule = false): array
    {
        $mode = config('ai.retrieval_mode', 'hybrid');

        if ($mode === 'hybrid' && $this->queryText !== '') {
            $results = $this->hybridRetrieve($moduleId, $questionEmbedding, $topK, $crossModule);

            // Reset query text after use (stateless across calls)
            $this->queryText = '';

            return $results;
        }

        // Reset query text even if not used
        $this->queryText = '';

        // Fallback: pure vector search (original behavior, fully preserved)
        return $this->vectorRetrieve($moduleId, $questionEmbedding, $topK, $crossModule);
    }

    /**
     * Hybrid retrieval: BM25 + Vector → Reranker → Top-K.
     */
    private function hybridRetrieve(int $moduleId, array $questionEmbedding, int $topK, bool $crossModule): array
    {
        $candidateK = max($topK * 4, 20); // Fetch more candidates for better reranking

        // 1. BM25 keyword search
        $bm25Results = $this->bm25->search($moduleId, $this->queryText, $candidateK, $crossModule);

        // 2. Vector cosine similarity search (no threshold filter — let reranker decide)
        $vectorResults = $this->vectorRetrieveRaw($moduleId, $questionEmbedding, $candidateK, $crossModule);

        // 3. If one search returned nothing, use the other directly
        if (empty($bm25Results) && empty($vectorResults)) {
            return [];
        }
        if (empty($bm25Results)) {
            return array_slice($vectorResults, 0, $topK);
        }
        if (empty($vectorResults)) {
            return array_slice($bm25Results, 0, $topK);
        }

        // 4. Fuse via reranker (RRF or cross-encoder)
        return $this->reranker->rerank($this->queryText, $vectorResults, $bm25Results, $topK);
    }

    /**
     * Pure vector search — the ORIGINAL retrieve() logic, preserved exactly.
     * Used as fallback when hybrid mode is disabled.
     */
    private function vectorRetrieve(int $moduleId, array $questionEmbedding, int $topK, bool $crossModule): array
    {
        $results = $this->vectorRetrieveRaw($moduleId, $questionEmbedding, $topK, $crossModule);

        // Apply minimum cosine similarity threshold (original behavior)
        return array_values(array_filter(
            $results,
            fn($c) => $c['score'] >= $this->minScore
        ));
    }

    /**
     * Raw vector search — returns scored chunks WITHOUT threshold filtering.
     * Used by both vectorRetrieve (with threshold) and hybridRetrieve (no threshold).
     */
    private function vectorRetrieveRaw(int $moduleId, array $questionEmbedding, int $topK, bool $crossModule): array
    {
        $query = ModuleAiChunk::query()
            ->select(['id', 'chunk_text', 'embedding', 'source_type', 'source_title', 'module_id']);

        if (!$crossModule) {
            $query->where('module_id', $moduleId);
        }

        // Load chunks. For cross-module, limit to avoid OOM.
        if ($crossModule) {
            $chunks = $query->limit(2000)->get();
        } else {
            $chunks = $query->get(); // typically < 500 rows per module
        }

        if ($chunks->isEmpty()) return [];

        $scored = [];
        foreach ($chunks as $chunk) {
            $emb = $chunk->embedding;
            if (empty($emb) || !is_array($emb)) continue;

            $score    = $this->embedder->cosineSimilarity($questionEmbedding, $emb);
            $scored[] = [
                'id'           => $chunk->id,
                'text'         => $chunk->chunk_text,
                'source_type'  => $chunk->source_type,
                'source_title' => $chunk->source_title,
                'module_id'    => $chunk->module_id,
                'score'        => $score,
            ];
        }

        // Sort descending by similarity score
        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($scored, 0, $topK);
    }
}
