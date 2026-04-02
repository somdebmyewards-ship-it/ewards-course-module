<?php
namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\TrainingProgress;
use App\Services\CompletionService;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateController extends Controller
{
    public function __construct(private CompletionService $completion) {}

    public function show(Request $request)
    {
        $userId = $request->user()->id;
        $user = $request->user();

        // H5: READ-only — no writes on GET endpoints.
        // Certificates are issued exclusively via CompletionService::checkAndComplete()
        $certs = Certificate::where('user_id', $userId)->get();

        if ($certs->isEmpty()) {
            return response()->json(['message' => 'No certificate earned yet', 'eligible' => false], 404);
        }

        $completedModules = TrainingProgress::where('user_id', $userId)
            ->where('module_completed', true)
            ->with('module:id,title')
            ->get()
            ->pluck('module.title');

        $certificates = $certs->map(fn($cert) => [
            'id' => $cert->id,
            'issued_at' => $cert->issued_at,
            'certificate_type' => $cert->certificate_type,
            'certificate_code' => $cert->certificate_code,
            'module_id' => $cert->module_id,
        ]);

        return response()->json([
            'eligible' => true,
            'certificates' => $certificates,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'completed_modules' => $completedModules,
            'total_points' => $user->points,
        ]);
    }

    // H6: Single download method used by both routes
    public function download(Request $request)
    {
        $certId = $request->query('id');
        return $this->generatePdf($request->user(), $certId);
    }

    public function downloadById(Request $request, $id)
    {
        return $this->generatePdf($request->user(), $id);
    }

    private function generatePdf($user, $certId = null)
    {
        $userId = $user->id;

        // H5: READ-only — no writes on download. Certs issued via completion flow only.
        $query = Certificate::where('user_id', $userId);
        if ($certId) {
            $query->where('id', $certId);
        }
        $cert = $query->orderByRaw("FIELD(certificate_type,'path','expert','module')")->first();

        if (!$cert) {
            return response()->json(['message' => 'No certificate available. Complete all modules first.'], 404);
        }

        $data = $this->completion->buildPdfData($cert, $user);

        $pdf = Pdf::loadView('certificates.template', $data)
            ->setPaper('a4', 'landscape');

        $safeName = preg_replace('/[^a-zA-Z0-9\-]/', '-', $user->name);
        $pdfContent = $pdf->output();

        return response($pdfContent, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="eWards-Certificate-' . $safeName . '.pdf"')
            ->header('Content-Length', strlen($pdfContent))
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
}
