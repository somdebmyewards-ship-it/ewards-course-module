<?php
namespace App\Services\AI;

use App\Models\ModuleAiChunk;

class RetrievalService
{
    private float $minScore;

    public function __construct(private EmbeddingService $embedder)
    {
        $this->minScore = (float) config('ai.min_score', 0.20);
    }

    /**
     * Find top-k most relevant chunks for a question embedding.
     * All vectors live in MySQL — cosine similarity computed in PHP.
     *
     * @param  int   $moduleId
     * @param  array $questionEmbedding  float[] from EmbeddingService
     * @param  int   $topK
     * @param  bool  $crossModule        Search all modules (fallback only)
     * @return array [{id, text, source_type, source_title, score}]
     */
    public function retrieve(int $moduleId, array $questionEmbedding, int $topK = 5, bool $crossModule = false): array
    {
        $query = ModuleAiChunk::query()
            ->select(['id', 'chunk_text', 'embedding', 'source_type', 'source_title', 'module_id']);

        if (!$crossModule) {
            $query->where('module_id', $moduleId);
        }

        // Load all chunks for this module (typically < 500 rows per module)
        $chunks = $query->get();

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

        // Return top-k above minimum threshold
        return array_values(array_filter(
            array_slice($scored, 0, $topK),
            fn($c) => $c['score'] >= $this->minScore
        ));
    }
}
