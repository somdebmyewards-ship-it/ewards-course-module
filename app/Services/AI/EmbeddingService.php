<?php
namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * HuggingFace Inference API — free embeddings.
 * Model: sentence-transformers/all-MiniLM-L6-v2  (384 dims, very fast)
 */
class EmbeddingService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl = 'https://api-inference.huggingface.co/models';

    public function __construct()
    {
        $this->apiKey = config('services.huggingface.key', '');
        $this->model  = config('ai.embedding_model', 'sentence-transformers/all-MiniLM-L6-v2');
    }

    /**
     * Embed a single string. Returns float[].
     */
    public function embed(string $text): array
    {
        $results = $this->embedBatch([$text]);
        return $results[0];
    }

    /**
     * Embed multiple strings (batched, max 64 per HF request).
     * Returns float[][].
     */
    /**
     * Cosine similarity between two float vectors (used by RetrievalService).
     */
    public function cosineSimilarity(array $a, array $b): float
    {
        $dot = $magA = $magB = 0.0;
        $n   = count($a);
        for ($i = 0; $i < $n; $i++) {
            $dot  += $a[$i] * $b[$i];
            $magA += $a[$i] * $a[$i];
            $magB += $b[$i] * $b[$i];
        }
        if ($magA === 0.0 || $magB === 0.0) return 0.0;
        return $dot / (sqrt($magA) * sqrt($magB));
    }

    public function embedBatch(array $texts): array
    {
        $all = [];

        foreach (array_chunk($texts, 32) as $batch) {
            $response = Http::withToken($this->apiKey)
                ->timeout(60)
                ->post("{$this->baseUrl}/{$this->model}", [
                    'inputs' => array_values($batch),
                    'options' => ['wait_for_model' => true],
                ]);

            if ($response->failed()) {
                Log::error('HuggingFace embedding API failed', [
                    'status' => $response->status(),
                    'body'   => substr($response->body(), 0, 300),
                ]);
                throw new RuntimeException('HuggingFace embedding failed: HTTP ' . $response->status());
            }

            $data = $response->json();

            // HF returns: [[float, ...], [float, ...]] for batch input
            // OR: [float, ...] for single input — normalise to 2D
            if (isset($data[0]) && is_float($data[0])) {
                // Single text was passed — wrap in array
                $all[] = $data;
            } else {
                foreach ($data as $vec) {
                    $all[] = $vec;
                }
            }
        }

        return $all;
    }
}
