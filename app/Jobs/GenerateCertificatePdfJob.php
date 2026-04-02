<?php

namespace App\Jobs;

use App\Models\Certificate;
use App\Models\User;
use App\Services\CompletionService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateCertificatePdfJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(
        private int $certificateId,
    ) {}

    public function handle(CompletionService $completion): void
    {
        $cert = Certificate::find($this->certificateId);
        if (!$cert) return;

        $user = User::find($cert->user_id);
        if (!$user) return;

        $data = $completion->buildPdfData($cert, $user);

        $pdf = Pdf::loadView('certificates.template', $data)
            ->setPaper('a4', 'landscape');

        $safeName = preg_replace('/[^a-zA-Z0-9\-]/', '-', $user->name);
        $filename = "certificates/{$cert->certificate_code}-{$safeName}.pdf";

        Storage::put($filename, $pdf->output());

        $cert->update([
            'certificate_url' => $filename,
        ]);

        Log::info("Certificate PDF generated", ['cert_id' => $cert->id, 'path' => $filename]);
    }
}
