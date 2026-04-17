<?php

namespace App\Services\AI;

use App\Models\ModuleAiChunk;
use Illuminate\Support\Facades\Log;

/**
 * BM25 keyword search — pure PHP implementation.
 * Works on any database (MySQL, TiDB, PostgreSQL) since scoring is computed
 * in application memory, not via SQL FULLTEXT indexes.
 *
 * BM25 formula: score(D,Q) = SUM[ IDF(qi) * (tf * (k1+1)) / (tf + k1 * (1 - b + b * |D|/avgdl)) ]
 */
class BM25SearchService
{
    // BM25 hyperparameters (Okapi defaults)
    private float $k1 = 1.5;   // term frequency saturation
    private float $b  = 0.75;  // document length normalization

    /**
     * Run BM25 keyword search over chunks.
     *
     * @param  int    $moduleId
     * @param  string $query       Raw user question text
     * @param  int    $topK        Max results to return
     * @param  bool   $crossModule Search all modules
     * @return array  [{id, text, source_type, source_title, module_id, score}]
     */
    public function search(int $moduleId, string $query, int $topK = 20, bool $crossModule = false): array
    {
        $queryTerms = $this->tokenize($query);
        if (empty($queryTerms)) return [];

        try {
            $dbQuery = ModuleAiChunk::query()
                ->select(['id', 'chunk_text', 'source_type', 'source_title', 'module_id']);

            if (!$crossModule) {
                $dbQuery->where('module_id', $moduleId);
            }

            if ($crossModule) {
                $chunks = $dbQuery->limit(2000)->get();
            } else {
                $chunks = $dbQuery->get();
            }

            if ($chunks->isEmpty()) return [];

            return $this->scoreBM25($chunks, $queryTerms, $topK);
        } catch (\Throwable $e) {
            Log::warning('BM25SearchService::search failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Compute BM25 scores for all chunks against query terms.
     */
    private function scoreBM25($chunks, array $queryTerms, int $topK): array
    {
        $N = $chunks->count(); // total documents

        // Pre-tokenize all documents and compute stats
        $docs      = [];
        $docLens   = [];
        $totalLen  = 0;

        foreach ($chunks as $chunk) {
            $tokens    = $this->tokenize($chunk->chunk_text);
            $tf        = array_count_values($tokens);
            $docLen    = count($tokens);
            $docs[]    = ['chunk' => $chunk, 'tf' => $tf, 'len' => $docLen];
            $docLens[] = $docLen;
            $totalLen += $docLen;
        }

        $avgdl = $totalLen / max($N, 1);

        // Compute document frequency (DF) for each query term
        $df = [];
        foreach ($queryTerms as $term) {
            $df[$term] = 0;
            foreach ($docs as $doc) {
                if (isset($doc['tf'][$term])) {
                    $df[$term]++;
                }
            }
        }

        // Score each document
        $scored = [];
        foreach ($docs as $doc) {
            $score = 0.0;
            $chunk = $doc['chunk'];

            foreach ($queryTerms as $term) {
                $termDf = $df[$term] ?? 0;
                if ($termDf === 0) continue;

                // IDF: log((N - df + 0.5) / (df + 0.5) + 1)
                $idf = log(($N - $termDf + 0.5) / ($termDf + 0.5) + 1.0);

                // Term frequency in this document
                $tf = $doc['tf'][$term] ?? 0;
                if ($tf === 0) continue;

                // BM25 TF component
                $tfNorm = ($tf * ($this->k1 + 1))
                    / ($tf + $this->k1 * (1 - $this->b + $this->b * ($doc['len'] / $avgdl)));

                $score += $idf * $tfNorm;
            }

            if ($score > 0.0) {
                $scored[] = [
                    'id'           => $chunk->id,
                    'text'         => $chunk->chunk_text,
                    'source_type'  => $chunk->source_type,
                    'source_title' => $chunk->source_title,
                    'module_id'    => $chunk->module_id,
                    'score'        => $score,
                ];
            }
        }

        // Sort descending by BM25 score
        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($scored, 0, $topK);
    }

    /**
     * Tokenize text into lowercase terms, filtering stop words and short words.
     */
    private function tokenize(string $text): array
    {
        // Lowercase + strip non-alphanumeric (keep spaces)
        $text = strtolower(preg_replace('/[^a-z0-9\s]/i', ' ', $text));

        // Split on whitespace
        $tokens = preg_split('/\s+/', trim($text), -1, PREG_SPLIT_NO_EMPTY);

        // Remove stop words and very short tokens (< 2 chars)
        $stopWords = $this->stopWords();
        return array_values(array_filter($tokens, function ($t) use ($stopWords) {
            return strlen($t) >= 2 && !isset($stopWords[$t]);
        }));
    }

    /**
     * Common English stop words — fast lookup via hash keys.
     */
    private function stopWords(): array
    {
        static $sw = null;
        if ($sw !== null) return $sw;

        $words = [
            'a', 'an', 'the', 'is', 'it', 'in', 'on', 'at', 'to', 'of', 'for',
            'and', 'or', 'but', 'not', 'with', 'from', 'by', 'as', 'be', 'was',
            'are', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
            'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can',
            'shall', 'this', 'that', 'these', 'those', 'am', 'if', 'then', 'so',
            'than', 'too', 'very', 'just', 'about', 'also', 'into', 'over',
            'after', 'before', 'between', 'under', 'above', 'up', 'down', 'out',
            'off', 'no', 'nor', 'only', 'own', 'same', 'some', 'such', 'what',
            'which', 'who', 'whom', 'how', 'when', 'where', 'why', 'all', 'each',
            'every', 'both', 'few', 'more', 'most', 'other', 'any', 'here', 'there',
        ];
        $sw = array_flip($words);
        return $sw;
    }
}
