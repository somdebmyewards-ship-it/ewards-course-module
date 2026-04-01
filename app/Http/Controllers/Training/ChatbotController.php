<?php
namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\TrainingModule;
use App\Models\TrainingSection;
use App\Services\AI\EmbeddingService;
use App\Services\AI\LLMService;
use App\Services\AI\RetrievalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;

class ChatbotController extends Controller
{
    public function __construct(
        private EmbeddingService $embedder,
        private LLMService       $llm,
    ) {}

    public function ask(Request $request)
    {
        $request->validate([
            'question' => 'required|string|min:2|max:600',
            'history'  => 'nullable|array|max:8',
        ]);

        $user     = $request->user();
        $question = strip_tags(trim($request->input('question')));
        $history  = array_slice($request->input('history', []), -6);

        // Rate limit: 15 messages per minute
        $rlKey = "ela_chat:{$user->id}";
        if (RateLimiter::tooManyAttempts($rlKey, 15)) {
            $wait = RateLimiter::availableIn($rlKey);
            return response()->json([
                'answer'       => "You're asking quite fast! Please wait {$wait} seconds before trying again.",
                'sources'      => [],
                'suggestions'  => [],
                'answer_found' => false,
            ]);
        }
        RateLimiter::hit($rlKey, 60);

        // Cache identical single-turn questions for 6 hours
        $cacheKey = 'ela_answer:' . md5(strtolower($question));
        if (empty($history) && ($cached = Cache::get($cacheKey))) {
            return response()->json($cached);
        }

        try {
            [$chunks, $sources] = $this->findContext($question);
            $result = $this->llm->elaAnswer($question, $chunks, $history);
        } catch (\Throwable $e) {
            Log::error('Ela::ask failed', ['error' => $e->getMessage()]);
            return response()->json([
                'answer'       => "I'm having a moment — please try again. If the issue persists, try refreshing the page.",
                'sources'      => [],
                'suggestions'  => $this->defaultSuggestions(),
                'answer_found' => false,
            ]);
        }

        $payload = [
            'answer'       => $result['answer'],
            'sources'      => $sources,
            'suggestions'  => $this->buildSuggestions($sources),
            'answer_found' => $result['answer_found'],
        ];

        if ($result['answer_found'] && empty($history)) {
            Cache::put($cacheKey, $payload, now()->addHours(6));
        }

        return response()->json($payload);
    }

    // ── Context retrieval ─────────────────────────────────────────────

    /**
     * Find the most relevant context chunks for the question.
     * Path A: indexed RAG (post-migration). Path B: section fallback.
     */
    private function findContext(string $question): array
    {
        // Path A: use indexed vector chunks if available
        if (Schema::hasTable('lms_module_ai_chunks')) {
            try {
                if (DB::table('lms_module_ai_chunks')->count() > 0) {
                    $embedding = $this->embedder->embed($question);
                    // crossModule=true → search all modules
                    $chunks = app(RetrievalService::class)->retrieve(0, $embedding, 6, true);
                    if (!empty($chunks)) {
                        return [$chunks, $this->sourcesFromIndexedChunks($chunks)];
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Ela RAG path failed, using section fallback: ' . $e->getMessage());
            }
        }

        // Path B: direct section search
        return $this->sectionFallback($question);
    }

    private function sectionFallback(string $question): array
    {
        $sections = TrainingSection::with('module')
            ->whereHas('module', fn($q) => $q->where('is_published', true))
            ->get(['id', 'title', 'body', 'module_id']);

        $modules = TrainingModule::where('is_published', true)
            ->get(['id', 'title', 'slug', 'description']);

        $items = [];
        foreach ($sections as $s) {
            $body = strip_tags((string)($s->body ?? ''));
            if (empty(trim($body))) continue;
            $items[] = [
                'text'         => ($s->title ?? '') . ': ' . $body,
                'source_type'  => 'section',
                'source_title' => $s->title ?? 'Section',
                'module_title' => $s->module->title ?? '',
                'module_slug'  => $s->module->slug ?? '',
                'module_id'    => $s->module_id,
            ];
        }
        foreach ($modules as $m) {
            if (empty(trim($m->description ?? ''))) continue;
            $items[] = [
                'text'         => $m->title . ': ' . ($m->description ?? ''),
                'source_type'  => 'module',
                'source_title' => $m->title,
                'module_title' => $m->title,
                'module_slug'  => $m->slug,
                'module_id'    => $m->id,
            ];
        }

        if (empty($items)) return [[], []];

        // Try HF sentence similarity for ranking
        $texts  = array_map(fn($c) => substr($c['text'], 0, 500), $items);
        $scores = $this->hfSimilarity($question, $texts);

        if (!empty($scores) && is_array($scores) && count($scores) === count($items)) {
            array_walk($items, fn(&$item, $i) => $item['score'] = (float)($scores[$i] ?? 0));
        } else {
            // Keyword scoring as last resort
            $words = array_filter(
                explode(' ', strtolower(preg_replace('/[^a-z0-9\s]/i', '', $question))),
                fn($w) => strlen($w) > 3
            );
            foreach ($items as &$item) {
                $t            = strtolower($item['text']);
                $item['score'] = array_sum(array_map(fn($w) => substr_count($t, $w), $words)) / 10;
            }
            unset($item);
        }

        usort($items, fn($a, $b) => $b['score'] <=> $a['score']);
        $top = array_values(array_filter(array_slice($items, 0, 6), fn($c) => $c['score'] > 0.08));

        $sources = $this->buildSourcesFromItems($top);
        return [$top, $sources];
    }

    private function hfSimilarity(string $question, array $sentences): array
    {
        try {
            $token    = config('services.huggingface.key', '');
            $response = Http::withHeaders(['Authorization' => "Bearer {$token}"])
                ->timeout(20)
                ->post('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', [
                    'inputs' => [
                        'source_sentence' => $question,
                        'sentences'       => array_values($sentences),
                    ],
                ]);
            return $response->ok() ? (array)($response->json() ?? []) : [];
        } catch (\Throwable) {
            return [];
        }
    }

    // ── Source builders ───────────────────────────────────────────────

    private function sourcesFromIndexedChunks(array $chunks): array
    {
        $moduleIds  = array_unique(array_filter(array_column($chunks, 'module_id')));
        $slugMap    = TrainingModule::whereIn('id', $moduleIds)->pluck('slug', 'id')->toArray();
        $titleMap   = TrainingModule::whereIn('id', $moduleIds)->pluck('title', 'id')->toArray();

        $seen = $sources = [];
        foreach ($chunks as $c) {
            $key = $c['source_type'] . ':' . $c['source_title'];
            if (!isset($seen[$key])) {
                $mid       = $c['module_id'] ?? 0;
                $sources[] = [
                    'source_type'  => $c['source_type'],
                    'source_title' => $c['source_title'],
                    'module_title' => $titleMap[$mid] ?? '',
                    'slug'         => $slugMap[$mid] ?? '',
                ];
                $seen[$key] = true;
            }
        }
        return $sources;
    }

    private function buildSourcesFromItems(array $items): array
    {
        $seen = $sources = [];
        foreach ($items as $c) {
            $key = $c['source_type'] . ':' . $c['source_title'];
            if (!isset($seen[$key])) {
                $sources[] = [
                    'source_type'  => $c['source_type'],
                    'source_title' => $c['source_title'],
                    'module_title' => $c['module_title'],
                    'slug'         => $c['module_slug'],
                ];
                $seen[$key] = true;
            }
        }
        return $sources;
    }

    // ── Suggestions ───────────────────────────────────────────────────

    private function buildSuggestions(array $sources): array
    {
        $map = [
            'dashboard'       => ['What metrics should I check daily?', 'How do date range filters work?'],
            'campaigns'       => ['What are campaign best practices?', 'How to configure target audience?'],
            'customers'       => ['What CSV format is needed for upload?', 'How to fix import errors?'],
            'rewards'         => ['How to set coupon expiry dates?', 'What reward types are available?'],
            'reports'         => ['What is redemption rate?', 'How often to review analytics?'],
            'whatsapp-ewards' => ['How does WhatsApp OTP work?', 'How can customers opt in via WhatsApp?'],
            'instant-pass'    => ['How does Instant Pass work?', 'What are Instant Pass benefits?'],
        ];

        $suggestions = [];
        foreach ($sources as $src) {
            foreach (($map[$src['slug'] ?? ''] ?? []) as $s) {
                if (count($suggestions) >= 3) break 2;
                $suggestions[] = $s;
            }
        }

        return array_values(array_unique($suggestions)) ?: $this->defaultSuggestions();
    }

    private function defaultSuggestions(): array
    {
        return [
            'How does eWards Instant Pass work?',
            'How do I create a campaign?',
            'What is customer upload?',
        ];
    }
}
