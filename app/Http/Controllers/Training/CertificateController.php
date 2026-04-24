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

        // H5: Auto-issue only when user explicitly views certificates page
        $this->completion->autoIssueMissing($userId);

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
        return $this->generatePdf(
            $request->user(),
            $request->query('id'),
            $request->query('module_id'),
            $request->query('type')
        );
    }

    public function downloadById(Request $request, $id)
    {
        return $this->generatePdf($request->user(), $id);
    }

    private function generatePdf($user, $certId = null, $moduleId = null, $type = null)
    {
        $userId = $user->id;

        // H5: Auto-issue only on explicit download action
        $this->completion->autoIssueMissing($userId);

        $query = Certificate::where('user_id', $userId);
        if ($certId) {
            $query->where('id', $certId);
        } elseif ($moduleId) {
            // Specific module cert requested (e.g. from the just-completed module screen)
            $query->where('certificate_type', 'module')->where('module_id', $moduleId);
        } elseif ($type && in_array($type, ['module', 'path', 'expert'], true)) {
            $query->where('certificate_type', $type);
        }
        $cert = $query->orderByRaw("FIELD(certificate_type,'path','expert','module')")->first();

        if (!$cert) {
            $msg = $moduleId
                ? 'Certificate for this module has not been issued yet. Try completing the module again or contact support.'
                : 'No certificate available yet. Finish a module to earn one.';
            return response()->json(['message' => $msg], 404);
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
