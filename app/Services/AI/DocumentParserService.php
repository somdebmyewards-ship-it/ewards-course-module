<?php
namespace App\Services\AI;

use Illuminate\Support\Facades\Log;

class DocumentParserService
{
    /**
     * Extract plain text from an absolute file path.
     * Supports: pdf, txt
     */
    public function extractText(string $absolutePath): string
    {
        if (!file_exists($absolutePath)) {
            Log::warning("AI DocumentParser: file not found", ['path' => $absolutePath]);
            return '';
        }

        $ext = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));

        return match ($ext) {
            'pdf'  => $this->parsePdf($absolutePath),
            'txt'  => (string) file_get_contents($absolutePath),
            default => '',
        };
    }

    private function parsePdf(string $path): string
    {
        // Uses smalot/pdfparser — run: composer require smalot/pdfparser
        if (!class_exists(\Smalot\PdfParser\Parser::class)) {
            Log::warning('smalot/pdfparser not installed. Run: composer require smalot/pdfparser');
            return '';
        }

        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf    = $parser->parseFile($path);
            return $pdf->getText();
        } catch (\Throwable $e) {
            Log::error("PDF parse failed: {$e->getMessage()}", ['path' => $path]);
            return '';
        }
    }
}
