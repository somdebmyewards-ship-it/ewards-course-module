<?php
namespace App\Services\AI;

class ChunkingService
{
    private int $chunkChars;   // ≈ chunk_size tokens × 4 chars/token
    private int $overlapChars; // ≈ overlap tokens × 4 chars/token

    public function __construct()
    {
        $this->chunkChars   = config('ai.chunk_size',    500) * 4;
        $this->overlapChars = config('ai.chunk_overlap', 100) * 4;
    }

    /**
     * Split plain text into overlapping chunks.
     * Returns array of ['text' => string, 'index' => int]
     */
    public function chunk(string $text): array
    {
        $text = $this->normalise($text);
        if (strlen($text) === 0) return [];

        if (strlen($text) <= $this->chunkChars) {
            return [['text' => $text, 'index' => 0]];
        }

        $chunks = [];
        $offset = 0;
        $index  = 0;

        while ($offset < strlen($text)) {
            $slice = substr($text, $offset, $this->chunkChars);

            // Prefer clean sentence break within back half of slice
            $breakAt = $this->sentenceBreak($slice);
            if ($breakAt > $this->chunkChars * 0.5) {
                $slice = substr($slice, 0, $breakAt);
            }

            $trimmed = trim($slice);
            if ($trimmed !== '') {
                $chunks[] = ['text' => $trimmed, 'index' => $index++];
            }

            $advance = max(1, strlen($slice) - $this->overlapChars);
            $offset += $advance;
        }

        return $chunks;
    }

    private function sentenceBreak(string $text): int
    {
        $best = 0;
        foreach (['. ', ".\n", '? ', '! ', "\n\n"] as $delim) {
            $pos = strrpos($text, $delim);
            if ($pos !== false) $best = max($best, $pos + strlen($delim));
        }
        return $best;
    }

    private function normalise(string $text): string
    {
        $text = strip_tags($text);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = preg_replace('/\s+/', ' ', $text);
        return trim($text);
    }
}
