<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Reranker — merges BM25 + Vector search results using configurable strategy.
 *
 * Strategies:
 *   - rrf:            Reciprocal Rank Fusion (pure PHP, no API, ~0ms)
 *   - cross_encoder:  HuggingFace cross-encoder via Inference API (more accurate, adds latency)
 */
class RerankerService
{
    /**
     * Rerank and merge results from vector search and BM25 search.
     *
     * @param  string $query          Raw user question
     * @param  array  $vectorResults  [{id, text, source_type, source_title, module_id, score}]
     * @param  array  $bm25Results    [{id, text, source_type, source_title, module_id, score}]
     * @param  int    $topK           Final number of results to return
     * @return array  [{id, text, source_type, source_title, module_id, score}]
     */
    public function rerank(string $query, array $vectorResults, array $bm25Results, int $topK = 5): array
    {
        $strategy = config('ai.reranker.strategy', 'rrf');

        if ($strategy === 'cross_encoder') {
            try {
                return $this->crossEncoderRerank($query, $vectorResults, $bm25Results, $topK);
            } catch (\Throwable $e) {
                Log::warning('Cross-encoder reranker failed, falling back to RRF: ' . $e->getMessage());
                // Fall through to RRF
            }
        }

        return $this->rrfRerank($vectorResults, $bm25Results, $topK);
    }

    /**
     * Reciprocal Rank Fusion — pure PHP, no external API.
     *
     * RRF_score(chunk) = w_vector * 1/(k + rank_vector) + w_bm25 * 1/(k + rank_bm25)
     *
     * Chunks appearing in BOTH result sets get boosted; single-source chunks
     * still appear but with a lower score.
     */
    private function rrfRerank(array $vectorResults, array $bm25Results, int $topK): array
    {
        $k            = (int) config('ai.reranker.rrf_k', 60);
        $vectorWeight = (float) config('ai.reranker.vector_weight', 1.0);
        $bm25Weight   = (float) config('ai.reranker.bm25_weight', 1.0);

        // Build unified chunk map (dedup by id, preserve full metadata)
        $chunkMap = []; // id => chunk data

        foreach ($vectorResults as $chunk) {
            $chunkMap[$chunk['id']] = $chunk;
        }
        foreach ($bm25Results as $chunk) {
            if (!isset($chunkMap[$chunk['id']])) {
                $chunkMap[$chunk['id']] = $chunk;
            }
        }

        // Assign ranks (1-indexed)
        $vectorRanks = [];
        foreach (array_values($vectorResults) as $rank => $chunk) {
            $vectorRanks[$chunk['id']] = $rank + 1;
        }

        $bm25Ranks = [];
        foreach (array_values($bm25Results) as $rank => $chunk) {
            $bm25Ranks[$chunk['id']] = $rank + 1;
        }

        // Compute RRF score for each unique chunk
        $scored = [];
        foreach ($chunkMap as $id => $chunk) {
            $vRank = $vectorRanks[$id] ?? PHP_INT_MAX;
            $bRank = $bm25Ranks[$id]   ?? PHP_INT_MAX;

            $rrfScore = $vectorWeight * (1.0 / ($k + $vRank))
                      + $bm25Weight   * (1.0 / ($k + $bRank));

            $chunk['score'] = $rrfScore;
            $scored[]       = $chunk;
        }

        // Sort descending by RRF score
        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($scored, 0, $topK);
    }

    /**
     * HuggingFace cross-encoder reranker — optional, higher accuracy.
     * Uses sentence-pair classification to score (query, chunk) relevance.
     */
    private function crossEncoderRerank(string $query, array $vectorResults, array $bm25Results, int $topK): array
    {
        // Union all unique chunks from both result sets
        $chunkMap = [];
        foreach (array_merge($vectorResults, $bm25Results) as $chunk) {
            if (!isset($chunkMap[$chunk['id']])) {
                $chunkMap[$chunk['id']] = $chunk;
            }
        }

        $chunks = array_values($chunkMap);
        if (empty($chunks)) return [];

        // Limit to avoid API overload (cross-encoders are slower)
        $chunks = array_slice($chunks, 0, 30);

        $model = config('ai.reranker.cross_encoder_model', 'cross-encoder/ms-marco-MiniLM-L-6-v2');
        $token = config('services.huggingface.key', '');

        // Build input pairs: [[query, chunk_text], ...]
        $pairs = array_map(fn($c) => [$query, substr($c['text'], 0, 512)], $chunks);

        // Batch in groups of 16 (cross-encoders are heavier than bi-encoders)
        $allScores = [];
        foreach (array_chunk($pairs, 16) as $batch) {
            $response = Http::withHeaders(['Authorization' => "Bearer {$token}"])
                ->timeout(15)
                ->post("https://api-inference.huggingface.co/models/{$model}", [
                    'inputs' => $batch,
                    'options' => ['wait_for_model' => true],
                ]);

            if ($response->failed()) {
                throw new \RuntimeException('Cross-encoder API failed: HTTP ' . $response->status());
            }

            $data = $response->json();

            // HF cross-encoder returns: [[{label, score}, ...], ...] per pair
            foreach ($data as $result) {
                if (is_array($result) && isset($result[0]['score'])) {
                    // Classification output — take the "LABEL_1" (relevant) score
                    $relevanceScore = 0.0;
                    foreach ($result as $label) {
                        if (($label['label'] ?? '') === 'LABEL_1') {
                            $relevanceScore = (float) $label['score'];
                            break;
                        }
                    }
                    $allScores[] = $relevanceScore;
                } elseif (is_numeric($result)) {
                    // Some models return a single float
                    $allScores[] = (float) $result;
                } else {
                    $allScores[] = 0.0;
                }
            }
        }

        // Assign scores back to chunks
        $scored = [];
        foreach ($chunks as $i => $chunk) {
            $chunk['score'] = $allScores[$i] ?? 0.0;
            $scored[]       = $chunk;
        }

        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
        return array_slice($scored, 0, $topK);
    }
}
