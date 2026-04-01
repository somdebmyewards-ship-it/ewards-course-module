<?php
namespace App\Services\AI;

use App\Models\ModuleAiChunk;
use App\Models\ModuleAiDocument;
use App\Models\ModuleAiSetting;
use App\Models\TrainingModule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class IndexingService
{
    public function __construct(
        private ChunkingService       $chunker,
        private EmbeddingService      $embedder,
        private DocumentParserService $parser,
    ) {}

    /**
     * Full (re-)index of a module.
     * Extracts text → chunks → embeds via HuggingFace → stores all in MySQL.
     */
    public function indexModule(int $moduleId): void
    {
        $module  = TrainingModule::with(['sections', 'checklists', 'quizzes'])->findOrFail($moduleId);
        $setting = ModuleAiSetting::firstOrCreate(['module_id' => $moduleId]);
        $setting->update(['index_status' => 'indexing']);

        try {
            DB::transaction(function () use ($module, $moduleId) {
                // Wipe old index — chunks cascade-deleted via FK
                ModuleAiDocument::where('module_id', $moduleId)->delete();

                $this->indexSections($module);
                $this->indexChecklists($module);
                $this->indexQuizzes($module);
                $this->indexPdfs($module);
            });

            $setting->update([
                'index_status'    => 'ready',
                'last_indexed_at' => now(),
            ]);

            Log::info("AI indexing complete for module {$moduleId}");

        } catch (\Throwable $e) {
            $setting->update(['index_status' => 'failed']);
            Log::error("AI indexing failed for module {$moduleId}: {$e->getMessage()}");
            throw $e;
        }
    }

    // ── Source indexers ──────────────────────────────────────────────

    private function indexSections(TrainingModule $module): void
    {
        foreach ($module->sections as $section) {
            $rawText = trim(strip_tags((string) ($section->body ?? '')));
            if ($rawText === '') continue;

            $doc = ModuleAiDocument::create([
                'module_id'    => $module->id,
                'source_type'  => 'section',
                'source_id'    => $section->id,
                'source_title' => $section->title ?? 'Section',
                'raw_text'     => $rawText,
                'status'       => 'indexed',
                'indexed_at'   => now(),
            ]);

            $this->storeChunks($doc, $rawText, $module->id, 'section', $doc->source_title);
        }
    }

    private function indexChecklists(TrainingModule $module): void
    {
        if ($module->checklists->isEmpty()) return;

        $lines = ["Checklist for {$module->title}:"];
        foreach ($module->checklists as $item) {
            $lines[] = '- ' . strip_tags((string) ($item->item ?? $item->title ?? ''));
        }

        $doc = ModuleAiDocument::create([
            'module_id'    => $module->id,
            'source_type'  => 'checklist',
            'source_id'    => null,
            'source_title' => 'Module Checklist',
            'raw_text'     => implode("\n", $lines),
            'status'       => 'indexed',
            'indexed_at'   => now(),
        ]);

        $this->storeChunks($doc, $doc->raw_text, $module->id, 'checklist', 'Module Checklist');
    }

    private function indexQuizzes(TrainingModule $module): void
    {
        if ($module->quizzes->isEmpty()) return;

        $lines = ["Quiz Q&A for {$module->title}:"];
        foreach ($module->quizzes as $quiz) {
            $lines[] = "Q: {$quiz->question}";
            $lines[] = "A: {$quiz->correct_answer}";
            if (!empty($quiz->explanation)) {
                $lines[] = "Explanation: {$quiz->explanation}";
            }
            $lines[] = '';
        }

        $doc = ModuleAiDocument::create([
            'module_id'    => $module->id,
            'source_type'  => 'quiz',
            'source_id'    => null,
            'source_title' => 'Quiz Content',
            'raw_text'     => implode("\n", $lines),
            'status'       => 'indexed',
            'indexed_at'   => now(),
        ]);

        $this->storeChunks($doc, $doc->raw_text, $module->id, 'quiz', 'Quiz Content');
    }

    private function indexPdfs(TrainingModule $module): void
    {
        $pdfs = DB::table('lms_media')
            ->where('module_id', $module->id)
            ->whereIn('type', ['pdf', 'document', 'file'])
            ->get();

        foreach ($pdfs as $pdf) {
            $path    = storage_path('app/public/' . ltrim((string) $pdf->file_path, '/'));
            $rawText = $this->parser->extractText($path);
            if (trim($rawText) === '') continue;

            $title = $pdf->name ?? basename((string) $pdf->file_path);

            $doc = ModuleAiDocument::create([
                'module_id'    => $module->id,
                'source_type'  => 'pdf',
                'source_id'    => $pdf->id,
                'source_title' => $title,
                'file_path'    => $pdf->file_path,
                'raw_text'     => $rawText,
                'status'       => 'indexed',
                'indexed_at'   => now(),
            ]);

            $this->storeChunks($doc, $rawText, $module->id, 'pdf', $title);
        }
    }

    // ── Core: chunk → embed → store in MySQL ─────────────────────────

    private function storeChunks(
        ModuleAiDocument $doc,
        string $rawText,
        int $moduleId,
        string $sourceType,
        string $sourceTitle
    ): void {
        $chunks = $this->chunker->chunk($rawText);
        if (empty($chunks)) return;

        // Batch embed all chunk texts (one HuggingFace API call per 32 chunks)
        $texts      = array_column($chunks, 'text');
        $embeddings = $this->embedder->embedBatch($texts);

        // Batch insert into MySQL
        $rows = [];
        foreach ($chunks as $i => $chunk) {
            $rows[] = [
                'document_id'  => $doc->id,
                'module_id'    => $moduleId,
                'chunk_text'   => $chunk['text'],
                'embedding'    => json_encode($embeddings[$i]),
                'chunk_index'  => $chunk['index'],
                'source_type'  => $sourceType,
                'source_title' => $sourceTitle,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        foreach (array_chunk($rows, 50) as $batch) {
            ModuleAiChunk::insert($batch);
        }
    }
}
