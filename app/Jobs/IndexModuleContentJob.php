<?php
namespace App\Jobs;

use App\Services\AI\IndexingService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class IndexModuleContentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300; // 5 minutes max
    public int $tries   = 2;

    public function __construct(public readonly int $moduleId) {}

    public function handle(IndexingService $service): void
    {
        $service->indexModule($this->moduleId);
    }

    public function failed(\Throwable $e): void
    {
        Log::error("IndexModuleContentJob failed for module {$this->moduleId}: {$e->getMessage()}");
    }
}
