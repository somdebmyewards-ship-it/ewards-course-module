<?php
namespace App\Http\Controllers\AI;

use App\Http\Controllers\Controller;
use App\Jobs\IndexModuleContentJob;
use App\Models\ModuleAiChatLog;
use App\Models\ModuleAiSetting;
use App\Models\TrainingModule;
use App\Services\AI\EmbeddingService;
use App\Services\AI\LLMService;
use App\Services\AI\RetrievalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class AssistantController extends Controller
{
    public function __construct(
        private EmbeddingService $embedder,
        private RetrievalService $retriever,
        private LLMService       $llm,
    ) {}

    // ── Learner endpoints ─────────────────────────────────────────────

    /**
     * GET /api/modules/{moduleId}/assistant/status
     */
    public function status(int $moduleId)
    {
        $setting = ModuleAiSetting::where('module_id', $moduleId)->first();

        return response()->json([
            'enabled'         => (bool) ($setting?->assistant_enabled ?? false),
            'index_status'    => $setting?->index_status ?? 'not_indexed',
            'last_indexed_at' => $setting?->last_indexed_at?->toISOString(),
        ]);
    }

    /**
     * GET /api/modules/{moduleId}/assistant/suggestions
     */
    public function suggestions(int $moduleId)
    {
        $suggestions = Cache::remember("ai_suggestions:{$moduleId}", 86400, function () use ($moduleId) {
            $sectionTitles = \DB::table('training_sections')
                ->where('module_id', $moduleId)
                ->whereNotNull('title')
                ->pluck('title')
                ->take(4)
                ->map(fn($t) => "What is covered in \"{$t}\"?")
                ->toArray();

            return array_merge($sectionTitles, [
                'Summarise this module for me',
                'What are the key steps?',
            ]);
        });

        return response()->json(['suggestions' => array_slice($suggestions, 0, 5)]);
    }

    /**
     * POST /api/modules/{moduleId}/assistant/chat
     */
    public function chat(Request $request, int $moduleId)
    {
        $request->validate([
            'question' => 'required|string|min:3|max:500',
        ]);

        $user = $request->user();

        // 1. Module must exist and be published
        $module = TrainingModule::where('id', $moduleId)
            ->where('is_published', true)
            ->firstOrFail();

        // 2. Assistant must be enabled and indexed
        $setting = ModuleAiSetting::where('module_id', $moduleId)->first();
        if (!$setting || !$setting->assistant_enabled || $setting->index_status !== 'ready') {
            return response()->json(['error' => 'Assistant is not available for this module.'], 403);
        }

        // 3. Rate limit: 10 questions per user per minute
        $rlKey = "ai_chat:{$user->id}:{$moduleId}";
        if (RateLimiter::tooManyAttempts($rlKey, config('ai.rate_limit', 10))) {
            $wait = RateLimiter::availableIn($rlKey);
            return response()->json(['error' => "Too many questions. Please wait {$wait} seconds."], 429);
        }
        RateLimiter::hit($rlKey, 60);

        // 4. Sanitise — strip prompt-injection patterns
        $question = $this->sanitise(strip_tags(trim($request->input('question'))));

        // 5. Cache identical questions for 1 hour (per module)
        $cacheKey = "ai_answer:{$moduleId}:" . md5(strtolower($question));
        if ($cached = Cache::get($cacheKey)) {
            $this->log($user->id, $moduleId, $question, $cached, 0);
            return response()->json($cached);
        }

        try {
            // 6. Embed the question
            $qEmbed = $this->embedder->embed($question);

            // 7. Retrieve top chunks from this module
            $topK   = config('ai.max_context_chunks', 5);
            $chunks = $this->retriever->retrieve($moduleId, $qEmbed, $topK, false);

            // 8. Cross-module fallback if enabled and no chunks found
            if (empty($chunks) && $setting->use_cross_module_fallback) {
                $chunks = $this->retriever->retrieve($moduleId, $qEmbed, 3, true);
            }

            // 9. Generate answer
            $result = $this->llm->answer($question, $chunks, $module->title);

            // 10. Deduplicated source list
            $sources = $this->buildSources($chunks);

            $payload = [
                'answer'       => $result['answer'],
                'sources'      => $sources,
                'answer_found' => $result['answer_found'],
            ];

            // 11. Log + cache
            $this->log($user->id, $moduleId, $question, $payload, $result['tokens_used'], $chunks);
            Cache::put($cacheKey, $payload, now()->addHour());

            return response()->json($payload);

        } catch (\Throwable $e) {
            \Log::error('AssistantController::chat failed', [
                'module_id' => $moduleId,
                'error'     => $e->getMessage(),
            ]);
            return response()->json([
                'error' => 'The assistant encountered an error. Please try again in a moment.',
            ], 500);
        }
    }

    // ── Admin / Trainer endpoints ─────────────────────────────────────

    /**
     * POST /api/modules/{moduleId}/assistant/index
     */
    public function triggerIndex(Request $request, int $moduleId)
    {
        $this->requireAdminOrTrainer($request);
        TrainingModule::findOrFail($moduleId);

        ModuleAiSetting::updateOrCreate(
            ['module_id' => $moduleId],
            ['index_status' => 'indexing']
        );

        IndexModuleContentJob::dispatch($moduleId);

        return response()->json(['message' => 'Indexing started in background.']);
    }

    /**
     * PATCH /api/modules/{moduleId}/assistant/toggle
     */
    public function toggle(Request $request, int $moduleId)
    {
        $this->requireAdminOrTrainer($request);
        $request->validate(['enabled' => 'required|boolean']);

        $setting = ModuleAiSetting::updateOrCreate(
            ['module_id' => $moduleId],
            ['assistant_enabled' => $request->boolean('enabled')]
        );

        // Invalidate suggestion cache on toggle
        Cache::forget("ai_suggestions:{$moduleId}");

        return response()->json(['assistant_enabled' => $setting->assistant_enabled]);
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private function sanitise(string $input): string
    {
        $patterns = [
            '/ignore\s+(all\s+)?previous\s+instructions?/i',
            '/disregard.{0,30}instructions?/i',
            '/you\s+are\s+now/i',
            '/act\s+as\b/i',
            '/jailbreak/i',
        ];
        foreach ($patterns as $p) {
            $input = preg_replace($p, '[removed]', $input);
        }
        return $input;
    }

    private function buildSources(array $chunks): array
    {
        $seen = $sources = [];
        foreach ($chunks as $c) {
            $key = $c['source_type'] . ':' . $c['source_title'];
            if (!isset($seen[$key])) {
                $sources[] = ['source_type' => $c['source_type'], 'source_title' => $c['source_title']];
                $seen[$key] = true;
            }
        }
        return $sources;
    }

    private function log(int $userId, int $moduleId, string $question, array $payload, int $tokens, array $chunks = []): void
    {
        try {
            ModuleAiChatLog::create([
                'user_id'             => $userId,
                'module_id'           => $moduleId,
                'question'            => $question,
                'answer'              => $payload['answer'],
                'sources'             => $payload['sources'],
                'retrieved_chunk_ids' => array_column($chunks, 'id'),
                'chunks_retrieved'    => count($chunks),
                'answer_found'        => $payload['answer_found'],
                'tokens_used'         => $tokens,
            ]);
        } catch (\Throwable) {
            // Never fail a user request due to logging
        }
    }

    private function requireAdminOrTrainer(Request $request): void
    {
        $role = $request->user()?->role ?? '';
        if (!in_array($role, ['ADMIN', 'TRAINER'])) {
            abort(403, 'Unauthorised.');
        }
    }
}
