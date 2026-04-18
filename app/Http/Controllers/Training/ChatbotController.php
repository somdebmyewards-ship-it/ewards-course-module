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

        // Block inappropriate / abusive content
        $abuse = $this->detectAbuse($question);
        if ($abuse) {
            return response()->json($abuse);
        }

        // Handle greetings / small-talk without hitting the retrieval pipeline
        $greeting = $this->detectGreeting($question);
        if ($greeting) {
            return response()->json($greeting);
        }

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
        // G2: Cache Schema::hasTable check to avoid per-request introspection
        $hasChunksTable = Cache::remember('schema:has_lms_ai_chunks', 3600, fn() => Schema::hasTable('lms_ai_chunks'));
        if ($hasChunksTable) {
            try {
                if (DB::table('lms_ai_chunks')->count() > 0) {
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

    /**
     * Detect greetings and small-talk — respond instantly without retrieval.
     * Uses regex patterns so variations like "hiii", "how r u?", "heyy" all match.
     * Also catches acknowledgments, reactions, nonsense, and very short non-queries.
     * Returns a response payload or null if the question is a real query.
     */
    private function detectGreeting(string $question): ?array
    {
        $q = strtolower(trim(preg_replace('/[^a-z0-9\s]/i', ' ', $question)));
        $q = preg_replace('/\s+/', ' ', trim($q)); // normalize multiple spaces

        $wordCount = str_word_count($q);

        // Domain keywords — if present, it's a real eWards query, skip detection
        $hasKeyword = (bool) preg_match('/\b(ewards|campaign|instant|pass|coupon|reward|report|dashboard|customer|upload|whatsapp|module|quiz|checklist|section|analytics|otp|qr|loyalty|merchant|outlet|billing|scan|redeem|points|sms|crm|segment|audience|notification|push|offer|discount|voucher|referral|feedback|store|brand)\b/i', $q);
        if ($hasKeyword) return null;

        // Question words with real intent — skip detection
        // (but "how are you" / "what is your name" are small talk, handled below)
        $realQuestionPatterns = [
            '/^(how|what|why|when|where|which|can|does|do|is|will|should)\b.{15,}/i',
        ];
        foreach ($realQuestionPatterns as $p) {
            if (preg_match($p, $q)) {
                // Long question without domain keywords — let retrieval handle it
                // Exception: conversational patterns caught below
            }
        }

        $suggestions = $this->defaultSuggestions();

        // ── 1. Greetings: hi, hello, hey, good morning, etc. ──
        $greetingPatterns = [
            '/^h+i+$/i',                                        // hi, hii, hiii
            '/^he+y+$/i',                                       // hey, heyy
            '/^hel+o+$/i',                                      // hello, helloo, helllo
            '/^(hi|hey|hello|hola)\s+(there|ela|buddy|friend|dear|bro|man|dude|sir|maam|madam)/i',
            '/^(good\s*)?(morning|afternoon|evening|night|day)/i',
            '/^(sup|yo+|howdy|hola|namaste|ola|namaskar|salaam|salam)/i',
            '/^(whats?\s*up|wassup|whaddup|waddup)/i',
            '/^(greetings|salutations)/i',
        ];

        // ── 2. How are you / conversational ──
        $conversationPatterns = [
            '/^how\s+(are|r)\s+(you|u|ya|yall)/i',
            '/^how\s+(do|ya|you)\s+do/i',
            '/^how\s+(have\s+you\s+been|you\s+doing|you\s+been)/i',
            '/^(hows|how\s*is)\s+(it\s+going|everything|life|things|your\s+day)/i',
            '/^(whats?\s+going\s+on|what\s+is\s+up)/i',
            '/^(nice|pleased|glad)\s+to\s+meet/i',
            '/^(long\s+time|missed\s+you)/i',
        ];

        // ── 3. Acknowledgments: ok, yes, no, got it, I see ──
        $ackPatterns = [
            '/^(ok+|okay+|k+|okie|okk+|alright|aight|right|sure|yep|yup|ya|yaa|yeah+|yes+|yess+|yea|yah)$/i',
            '/^(no+|nah+|nope|noo+|naah)$/i',
            '/^(got\s+it|i\s+see|i\s+understand|understood|makes\s+sense|noted|roger|copy|fine)$/i',
            '/^(i\s+know|i\s+get\s+it|thats?\s+(right|correct|true))$/i',
            '/^(of\s+course|obviously|definitely|absolutely|certainly|sure\s+thing)$/i',
            '/^(hmm+|hm+|umm+|um+|ahh*|ohh*|ooh+|ugh|meh|eh)$/i',
        ];

        // ── 4. Reactions: nice, cool, wow, lol, haha ──
        $reactionPatterns = [
            '/^(nice|cool|awesome|amazing|great|wonderful|fantastic|brilliant|excellent|superb|sweet|dope|lit|fire|sick)$/i',
            '/^(wow+|whoa+|omg|oh\s*my\s*god|oh\s+wow|damn|dang|woah)$/i',
            '/^(lo+l+|lmao|lmfao|rofl|ha+h?a*|he+h?e*|heh+|ja+j?a*)$/i',
            '/^(interesting|really|seriously|no\s+way|for\s+real|true|legit)$/i',
            '/^(good|bad|sad|happy|yay+|woo+|hurray|hooray)$/i',
        ];

        // ── 5. Thanks ──
        $thanksPatterns = [
            '/^than(k|x|ks)/i',
            '/^(ty|thx|thnx|thnks|tysm|tyvm)/i',
            '/^(appreciate|much\s+appreciated)/i',
            '/^(cheers|ta|gracias|dhanyawad|shukriya)/i',
        ];

        // ── 6. Goodbye ──
        $byePatterns = [
            '/^(bye+|byebye|bye\s*bye|goodbye|good\s*bye)/i',
            '/^(see\s+(you|ya|u)|cya|later+z?|peace)/i',
            '/^(take\s+care|gotta\s+go|gtg|ttyl|brb|bbl)/i',
            '/^(good\s*night|gn|nighty?\s*night)/i',
        ];

        // ── 7. Meta: who are you, help, what can you do ──
        $metaPatterns = [
            '/^who\s+(are|r)\s+(you|u)/i',
            '/^what\s+(are|r)\s+(you|u)/i',
            '/^what(s|\s+is)\s+your\s+name/i',
            '/^what\s+(can|do)\s+(you|u)\s+(do|help|know)/i',
            '/^(help|help\s+me|i\s+need\s+help)$/i',
            '/^(tell\s+me\s+about\s+yourself|introduce\s+yourself)/i',
            '/^(are\s+you\s+(a\s+)?(bot|ai|robot|human|real|machine))/i',
            '/^(can\s+you\s+help\s+me|i\s+have\s+a\s+question)$/i',
        ];

        // ── 8. Filler / nonsense / too-short ──
        $fillerPatterns = [
            '/^(test|testing|hello\s+world|asdf|asd|qwerty|abc|xyz|foo|bar|blah+)$/i',
            '/^(nothing|never\s*mind|nvm|forget\s+it|skip|ignore|idk|dunno)$/i',
            '/^(what|huh|eh|wait|so|and|but|well|anyway|hmm)$/i',
            '/^[a-z]{1,2}$/i',                                // single letter or 2 letters: "a", "ok", "hi" already handled
            '/^(.)\1{2,}$/i',                                  // repeated chars: "aaa", "zzz", "sss"
            '/^(oh\s+ok|ah\s+ok|oh\s+i\s+see|oh\s+right|oh\s+alright|i\s+see|is\s+it)/i',
        ];

        // ── 9. Personal state / sentiments / opinions / complaints ──
        $personalPatterns = [
            '/^(im|i\s*am|i\s+feel)\s+(good|fine|great|okay|ok|bored|tired|confused|lost|happy|sad|excited|curious|sleepy|hungry|angry|frustrated|annoyed)/i',
            '/^(feeling|i\s+feel)\s+(good|fine|great|bored|tired|confused|lost|happy|sad|angry|frustrated)/i',
            '/^(i\s+(dont|do\s*not|am\s+not|aint)\s+(like|understand|know|care|want|need|get))/i',  // i dont like, i dont understand
            '/^(im\s+not|i\s*am\s+not)\s+(liking|understanding|getting|sure|interested|happy)/i',  // im not liking
            '/^(this\s+is|thats?|its?)\s+(good|bad|great|boring|confusing|hard|easy|cool|nice|awesome|terrible|awful|stupid|useless|amazing|helpful|interesting)/i',
            '/^(i\s+(like|love|hate|dislike|enjoy|prefer|need|want))\b/i',  // i like, i love, i hate
            '/^(not\s+(helpful|useful|working|good|great|clear|sure))/i',   // not helpful, not working
            '/^(sounds?\s+(good|great|fine|cool|interesting|boring))/i',     // sounds good
            '/^(thats?\s+(all|it|enough|fine|ok|okay|cool))/i',             // thats all, thats it
        ];

        // ── Match and respond ──

        foreach ($greetingPatterns as $p) {
            if (preg_match($p, $q)) {
                return [
                    'answer'       => "Hey there! 👋 I'm **Ela**, your eWards learning assistant. I can help you understand any feature — campaigns, Instant Pass, customer management, rewards, and more. What would you like to learn about?",
                    'sources'      => [],
                    'suggestions'  => $suggestions,
                    'answer_found' => true,
                ];
            }
        }

        foreach ($conversationPatterns as $p) {
            if (preg_match($p, $q)) {
                return [
                    'answer'       => "I'm doing great, thanks for asking! 😊 I'm **Ela**, always ready to help you learn the eWards platform. What would you like to know about?",
                    'sources'      => [],
                    'suggestions'  => $suggestions,
                    'answer_found' => true,
                ];
            }
        }

        foreach ($ackPatterns as $p) {
            if (preg_match($p, $q)) {
                return [
                    'answer'       => "Got it! 👍 If you have any questions about the eWards platform, just ask away!",
                    'sources'      => [],
                    'suggestions'  => $suggestions,
                    'answer_found' => true,
                ];
            }
        }

        foreach ($reactionPatterns as $p) {
            if (preg_match($p, $q)) {
                return [
                    'answer'       => "Glad to hear it! 😄 Is there anything about eWards you'd like to learn more about?",
                    'sources'      => [],
                    'suggestions'  => $suggestions,
                    'answer_found' => true,
                ];
            }
        }

        foreach ($thanksPatterns as $p) {
            if (preg_match($p, $q)) {
                return [
                    'answer'       => "You're welcome! 😊 Happy to help. Feel free to ask me anything else about the eWards platform!",
                    'sources'      => [],
                    'suggestions'  => $suggestions,
                    'answer_found' => true,
                ];
            }
        }

        foreach ($byePatterns as $p) {
            if (preg_match($p, $q)) {
                return [
                    'answer'       => "See you later! 👋 Whenever you need help with eWards, I'm just a click away. Happy learning!",
                    'sources'      => [],
                    'suggestions'  => [],
                    'answer_found' => true,
                ];
            }
        }

        foreach ($metaPatterns as $p) {
            if (preg_match($p, $q)) {
                return [
                    'answer'       => "I'm **Ela** — your AI learning assistant for the eWards platform! 🤖\n\nI can help you with:\n- **Instant Pass** — how customers join via WhatsApp\n- **Campaigns** — creating and managing promotional campaigns\n- **Customer Upload** — importing customer data via CSV\n- **Rewards & Coupons** — setting up loyalty rewards\n- **Reports** — understanding analytics and metrics\n\nJust ask me anything!",
                    'sources'      => [],
                    'suggestions'  => $suggestions,
                    'answer_found' => true,
                ];
            }
        }

        foreach ($fillerPatterns as $p) {
            if (preg_match($p, $q)) {
                return [
                    'answer'       => "I'm here to help! 💡 Try asking me something about the eWards platform — like how campaigns work, or what Instant Pass does.",
                    'sources'      => [],
                    'suggestions'  => $suggestions,
                    'answer_found' => true,
                ];
            }
        }

        foreach ($personalPatterns as $p) {
            if (preg_match($p, $q)) {
                return [
                    'answer'       => "I hear you! 😊 I'm best at helping with eWards platform questions. Try asking me about **Instant Pass**, **Campaigns**, **Customer Upload**, or **Rewards** — I'd love to help!",
                    'sources'      => [],
                    'suggestions'  => $suggestions,
                    'answer_found' => true,
                ];
            }
        }

        // ── Fallback: short input (≤4 words) without domain keywords ──
        // Catches anything short that slipped through all patterns above
        if ($wordCount <= 4 && !$hasKeyword) {
            return [
                'answer'       => "I'm here to help! 💡 Try asking me about eWards features — like **Instant Pass**, **Campaigns**, **Rewards**, or **Customer Upload**.",
                'sources'      => [],
                'suggestions'  => $suggestions,
                'answer_found' => true,
            ];
        }

        return null; // Longer input without domain keywords — let retrieval try
    }

    /**
     * Detect profanity, abuse, harassment, and inappropriate content.
     * Returns a firm but polite response, or null if the input is clean.
     */
    private function detectAbuse(string $question): ?array
    {
        $q = strtolower(trim($question));

        // Profanity & slurs — covers common words, leetspeak, and spaced-out evasion
        $profanityPatterns = [
            '/\b(fuck|f+u+c+k+|fck|fuk|f\s*u\s*c\s*k)\b/i',
            '/\b(shit|sh+i+t+|sh1t|s\s*h\s*i\s*t)\b/i',
            '/\b(ass+hole|a+ss+|a\s*s\s*s)\b/i',
            '/\b(bitch|b+i+t+c+h+|b1tch)\b/i',
            '/\b(bastard|b+a+s+t+a+r+d+)\b/i',
            '/\b(damn|d+a+m+n+)\b/i',
            '/\b(crap|dick|cock|penis|vagina|boob|tit)\b/i',
            '/\b(idiot|stupid|dumb|moron|retard|loser|trash|garbage)\b/i',
            '/\b(stfu|gtfo|wtf|wth|omfg|smh)\b/i',
            '/\b(slut|whore|hoe|thot|skank)\b/i',
            '/\b(nigga|nigger|n+i+g+)\b/i',
            '/\b(cunt|twat|prick|wanker)\b/i',
            '/\b(suck|sucks|sucking|blows)\b/i',
            '/\b(die|kill|murder|suicide|rape)\b/i',
        ];

        // Directed abuse — "you are stupid", "you suck", "go to hell"
        $abusePatterns = [
            '/\b(you|u|ur)\s+(suck|stink|are\s+(stupid|dumb|useless|trash|garbage|terrible|worst|bad|annoying|pathetic))/i',
            '/\b(go\s+to\s+hell|go\s+die|shut\s*up|piss\s+off|buzz\s+off|get\s+lost)\b/i',
            '/\b(hate\s+(you|u)|screw\s+(you|u)|damn\s+(you|u))\b/i',
            '/\b(useless\s+(bot|ai|assistant|thing|app|tool))\b/i',
            '/\b(worst\s+(bot|ai|assistant|app|thing|ever))\b/i',
            '/\b(you\s+are\s+a\s+(joke|scam|fraud|waste))\b/i',
        ];

        // Inappropriate requests
        $inappropriatePatterns = [
            '/\b(sex|porn|nude|naked|xxx|nsfw|onlyfans)\b/i',
            '/\b(drug|weed|cocaine|heroin|meth)\b/i',
            '/\b(hack|exploit|crack|steal|phishing)\b/i',
            '/\b(bomb|weapon|gun|terrorist)\b/i',
        ];

        foreach ($profanityPatterns as $p) {
            if (preg_match($p, $q)) {
                return $this->abuseResponse();
            }
        }

        foreach ($abusePatterns as $p) {
            if (preg_match($p, $q)) {
                return $this->abuseResponse();
            }
        }

        foreach ($inappropriatePatterns as $p) {
            if (preg_match($p, $q)) {
                return $this->abuseResponse('inappropriate');
            }
        }

        return null;
    }

    private function abuseResponse(string $type = 'profanity'): array
    {
        if ($type === 'inappropriate') {
            return [
                'answer'       => "I'm only able to help with **eWards platform** questions. I can't assist with that kind of request. Let's keep things on topic! 🙂\n\nHere are some things I can help with:",
                'sources'      => [],
                'suggestions'  => $this->defaultSuggestions(),
                'answer_found' => true,
            ];
        }

        return [
            'answer'       => "Hey, let's keep it respectful! 🙏 I'm **Ela**, here to help you learn the eWards platform. I work best when we keep things professional.\n\nHere's what I can help you with:",
            'sources'      => [],
            'suggestions'  => $this->defaultSuggestions(),
            'answer_found' => true,
        ];
    }
}
