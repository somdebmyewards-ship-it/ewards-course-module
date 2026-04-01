<?php
namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * LLM Service — Groq (primary) with pure-PHP extractive fallback.
 * Ela ALWAYS responds even when the LLM API is unavailable or misconfigured.
 */
class LLMService
{
    private string $apiKey;
    private string $model;
    private string $chatUrl;

    private const NOT_FOUND =
        "I don't have specific training content on that. " .
        "Try browsing the relevant module in the Learning Hub or check with your trainer.";

    public function __construct()
    {
        $this->apiKey  = config('services.groq.key', '');
        $this->model   = config('ai.chat_model', 'llama3-8b-8192');
        $base          = rtrim(config('ai.llm_base_url', 'https://api.groq.com/openai/v1'), '/');
        $this->chatUrl = $base . '/chat/completions';
    }

    // ── Public: Ela global assistant ─────────────────────────────────

    public function elaAnswer(string $question, array $contextChunks, array $history = []): array
    {
        // Try LLM first (Groq)
        if ($this->hasApiKey()) {
            try {
                return $this->llmAnswer($question, $contextChunks, $history, false);
            } catch (\Throwable $e) {
                Log::warning('Ela LLM failed, using extractive fallback: ' . $e->getMessage());
            }
        }

        // Always-works fallback — pure PHP, no API
        return $this->extractiveAnswer($question, $contextChunks);
    }

    // ── Public: Module-specific RAG answer ───────────────────────────

    public function answer(string $question, array $contextChunks, string $moduleTitle): array
    {
        if ($this->hasApiKey()) {
            try {
                return $this->llmAnswer($question, $contextChunks, [], true, $moduleTitle);
            } catch (\Throwable $e) {
                Log::warning('Module LLM failed, using extractive fallback: ' . $e->getMessage());
            }
        }

        return $this->extractiveAnswer($question, $contextChunks);
    }

    // ── LLM path (Groq / any OpenAI-compatible API) ──────────────────

    private function llmAnswer(
        string $question,
        array  $contextChunks,
        array  $history,
        bool   $strictMode,
        string $moduleTitle = 'eWards'
    ): array {
        $contextText = $this->buildContext($contextChunks);
        $messages    = [];

        // System prompt
        $messages[] = [
            'role'    => 'system',
            'content' => $strictMode
                ? $this->moduleSystemPrompt($moduleTitle)
                : $this->elaSystemPrompt(),
        ];

        // Context
        if (trim($contextText) !== '') {
            $messages[] = [
                'role'    => 'system',
                'content' => "Relevant training content:\n\n" . $contextText,
            ];
        }

        // Conversation history (last 3 turns)
        foreach (array_slice($history, -6) as $turn) {
            $role       = in_array($turn['role'] ?? '', ['user', 'assistant']) ? $turn['role'] : 'user';
            $messages[] = ['role' => $role, 'content' => substr($turn['content'] ?? '', 0, 800)];
        }

        $messages[] = ['role' => 'user', 'content' => $question];

        $response = Http::withToken($this->apiKey)
            ->timeout(30)
            ->post($this->chatUrl, [
                'model'       => $this->model,
                'max_tokens'  => 600,
                'temperature' => $strictMode ? 0.1 : 0.2,
                'messages'    => $messages,
            ]);

        if ($response->failed()) {
            Log::error('LLM API failed', [
                'status' => $response->status(),
                'body'   => substr($response->body(), 0, 300),
            ]);
            throw new \RuntimeException('LLM API failed: HTTP ' . $response->status());
        }

        $answer   = trim($response->json('choices.0.message.content', ''));
        $answer   = $answer ?: self::NOT_FOUND;
        $notFound = str_contains(strtolower($answer), "don't have specific training content");

        return ['answer' => $answer, 'tokens_used' => 0, 'answer_found' => !$notFound];
    }

    // ── Extractive fallback (pure PHP — no API required) ─────────────

    /**
     * Builds a clean, readable answer from context chunks using only PHP.
     * Used when no LLM API key is configured or the API call fails.
     */
    private function extractiveAnswer(string $question, array $chunks): array
    {
        if (empty($chunks)) {
            return ['answer' => self::NOT_FOUND, 'tokens_used' => 0, 'answer_found' => false];
        }

        // Score each sentence across all chunks
        $qWords = array_filter(
            explode(' ', strtolower(preg_replace('/[^a-z0-9\s]/i', '', $question))),
            fn($w) => strlen($w) > 3
        );

        $scored  = [];
        $sources = [];

        foreach (array_slice($chunks, 0, 5) as $chunk) {
            $raw   = trim(strip_tags($chunk['text'] ?? ''));
            $title = $chunk['source_title'] ?? '';
            $base  = (float)($chunk['score'] ?? 0.3);

            if ($title && !in_array($title, $sources)) {
                $sources[] = $title;
            }

            // Split into sentences
            $sents = preg_split('/(?<=[.!?])\s+(?=[A-Z"\-\d])/', $raw) ?: [$raw];

            foreach ($sents as $s) {
                $s = trim($s);
                if (strlen($s) < 30) continue;

                $sLower = strtolower($s);
                $score  = $base;
                foreach ($qWords as $w) {
                    $score += substr_count($sLower, $w) * 1.2;
                }

                $scored[] = ['text' => $s, 'score' => $score, 'source' => $title];
            }
        }

        if (empty($scored)) {
            // No sentences extracted — return raw chunk text directly
            $text = trim(implode("\n\n", array_map(
                fn($c) => strip_tags($c['text'] ?? ''),
                array_slice($chunks, 0, 2)
            )));
            return [
                'answer'       => $text ?: self::NOT_FOUND,
                'tokens_used'  => 0,
                'answer_found' => !empty($text),
            ];
        }

        // Sort by score, deduplicate, take top 5
        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);

        $seen  = [];
        $lines = [];
        foreach ($scored as $s) {
            $key = md5(substr(strtolower($s['text']), 0, 60));
            if (isset($seen[$key])) continue;
            $seen[$key] = true;
            $lines[]    = $s['text'];
            if (count($lines) >= 5) break;
        }

        // Format the answer
        $sourceLabel = !empty($sources) ? '**' . implode(' · ', array_slice($sources, 0, 2)) . '**' : null;

        if (count($lines) === 1) {
            $answer = ($sourceLabel ? "{$sourceLabel}\n\n" : '') . $lines[0];
        } else {
            $answer = ($sourceLabel ? "{$sourceLabel}\n\n" : '');
            foreach ($lines as $line) {
                $answer .= "- {$line}\n";
            }
        }

        return [
            'answer'       => trim($answer),
            'tokens_used'  => 0,
            'answer_found' => true,
        ];
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private function hasApiKey(): bool
    {
        $key = trim($this->apiKey);
        return !empty($key) && $key !== 'your_groq_key_here';
    }

    private function buildContext(array $chunks): string
    {
        if (empty($chunks)) return '';
        $parts = [];
        foreach (array_values($chunks) as $i => $chunk) {
            $source  = $chunk['source_title'] ?? ucfirst($chunk['source_type'] ?? 'Content');
            $parts[] = '[' . ($i + 1) . ". {$source}]\n{$chunk['text']}";
        }
        return implode("\n\n---\n\n", $parts);
    }

    private function elaSystemPrompt(): string
    {
        return <<<PROMPT
You are Ela — the intelligent learning assistant for the eWards Learning Hub.

eWards is a customer loyalty and engagement platform. You help merchants and staff understand features including Instant Pass, Campaigns, Customer Management, Rewards, Analytics Reports, and WhatsApp integration.

How to answer:
- Use the training content provided to answer accurately
- Be warm, friendly, and concise — like a brilliant colleague who knows the platform inside out
- Use **bold** for key terms. Use numbered lists for steps. Use bullet points for features.
- Keep answers under 150 words unless more detail is genuinely needed
- For follow-up questions, refer naturally to the prior conversation
- If the content doesn't cover the question, say: "I don't have specific training content on that. Try browsing the relevant module in the Learning Hub or check with your trainer."
- Never invent features, steps, or procedures not in the training content
PROMPT;
    }

    private function moduleSystemPrompt(string $moduleTitle): string
    {
        return <<<PROMPT
You are a helpful learning assistant for the "{$moduleTitle}" training module.
Answer ONLY using the training content provided. Use **bold** for key terms. Use numbered steps for processes.
If the answer is not in the content, say: "I don't have specific training content on that."
PROMPT;
    }
}
