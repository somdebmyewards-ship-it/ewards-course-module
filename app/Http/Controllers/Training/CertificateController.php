<?php
namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class CertificateController extends Controller
{
    public function show(Request $request)
    {
        $userId = $request->user()->id;
        $user = $request->user();

        // Auto-issue any certificates the user has earned but not yet received
        $this->autoIssueCertificates($userId, $user);

        $certs = Certificate::where('user_id', $userId)->get();

        if ($certs->isEmpty()) {
            return response()->json(['message' => 'No certificate earned yet', 'eligible' => false], 404);
        }

        $user = $request->user();
        $completedModules = TrainingProgress::where('user_id', $userId)
            ->where('module_completed', true)
            ->with('module:id,title')
            ->get()
            ->pluck('module.title');

        $certificates = $certs->map(function ($cert) {
            return [
                'id' => $cert->id,
                'issued_at' => $cert->issued_at,
                'certificate_type' => $cert->certificate_type,
                'certificate_code' => $cert->certificate_code,
                'module_id' => $cert->module_id,
            ];
        });

        return response()->json([
            'eligible' => true,
            'certificates' => $certificates,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'completed_modules' => $completedModules,
            'total_points' => $user->points,
        ]);
    }

    private function autoIssueCertificates(int $userId, $user): void
    {
        $totalPublished = TrainingModule::where('is_published', true)->count();
        $completedCount = TrainingProgress::where('user_id', $userId)
            ->where('module_completed', true)->count();

        if ($completedCount >= $totalPublished && $totalPublished > 0) {
            Certificate::firstOrCreate(
                ['user_id' => $userId, 'certificate_type' => 'path'],
                ['issued_at' => now(), 'certificate_code' => 'EWPATH-' . str_pad($userId, 6, '0', STR_PAD_LEFT)]
            );
        }

        if ($user->points >= 300) {
            Certificate::firstOrCreate(
                ['user_id' => $userId, 'certificate_type' => 'expert'],
                ['issued_at' => now(), 'certificate_code' => 'EWEXP-' . str_pad($userId, 6, '0', STR_PAD_LEFT)]
            );
        }

        // Per-module certificates for certificate_enabled modules
        $completedModuleIds = TrainingProgress::where('user_id', $userId)
            ->where('module_completed', true)->pluck('module_id');
        $enabledModules = TrainingModule::whereIn('id', $completedModuleIds)
            ->where('certificate_enabled', true)->get();
        foreach ($enabledModules as $mod) {
            Certificate::firstOrCreate(
                ['user_id' => $userId, 'module_id' => $mod->id, 'certificate_type' => 'module'],
                ['issued_at' => now(), 'certificate_code' => 'EWMOD-' . str_pad($mod->id, 4, '0', STR_PAD_LEFT) . '-' . str_pad($userId, 6, '0', STR_PAD_LEFT)]
            );
        }
    }

    public function download(Request $request)
    {
        $certId = $request->query('id');
        $userId = $request->user()->id;
        $user = $request->user();

        // Auto-issue any missing certificates the user has earned
        $this->autoIssueCertificates($userId, $user);

        $query = Certificate::where('user_id', $userId);
        if ($certId) {
            $query->where('id', $certId);
        }
        $cert = $query->orderByRaw("FIELD(certificate_type,'path','expert','module')")->first();

        if (!$cert) {
            return response()->json(['message' => 'No certificate available. Complete all modules first.'], 404);
        }

        $user = $request->user();
        $completedModules = TrainingProgress::where('user_id', $userId)
            ->where('module_completed', true)
            ->with('module:id,title')
            ->get()
            ->pluck('module.title');

        $data = [
            'user_name' => $user->name,
            'issued_at' => $cert->issued_at->format('F j, Y'),
            'certificate_id' => $cert->certificate_code ?? 'EWCERT-' . str_pad($cert->id, 6, '0', STR_PAD_LEFT),
            'certificate_type' => $cert->certificate_type,
            'completed_modules' => $completedModules,
            'total_points' => $user->points,
        ];

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

    public function downloadById(Request $request, $id)
    {
        $userId = $request->user()->id;
        $user = $request->user();

        // Auto-issue any missing earned certificates before lookup
        $this->autoIssueCertificates($userId, $user);

        $cert = Certificate::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$cert) {
            return response()->json(['message' => 'Certificate not found'], 404);
        }

        $user = $request->user();
        $completedModules = TrainingProgress::where('user_id', $user->id)
            ->where('module_completed', true)
            ->with('module:id,title')
            ->get()
            ->pluck('module.title');

        $data = [
            'user_name' => $user->name,
            'issued_at' => $cert->issued_at->format('F j, Y'),
            'certificate_id' => $cert->certificate_code ?? 'EWCERT-' . str_pad($cert->id, 6, '0', STR_PAD_LEFT),
            'certificate_type' => $cert->certificate_type,
            'completed_modules' => $completedModules,
            'total_points' => $user->points,
        ];

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

    /**
     * Direct browser download — authenticates via token query param.
     * This avoids all CORS/XHR issues by letting the browser navigate directly.
     */
    public function downloadDirect(Request $request)
    {
        try {
            $token = $request->query('token');
            $certId = $request->query('id');

            if (!$token) {
                return response('Token required', 401);
            }

            // Authenticate: set the token as Bearer and resolve user via Sanctum
            $request->headers->set('Authorization', 'Bearer ' . $token);
            $user = auth('sanctum')->user();
            if (!$user) {
                return response('Invalid token', 401);
            }

            $this->autoIssueCertificates($user->id, $user);

            $query = Certificate::where('user_id', $user->id);
            if ($certId) {
                $query->where('id', $certId);
            }
            $cert = $query->latest('issued_at')->first();

            if (!$cert) {
                return response('No certificate available. Complete modules first.', 404);
            }

            $completedModules = TrainingProgress::where('user_id', $user->id)
                ->where('module_completed', true)
                ->with('module:id,title')
                ->get()
                ->pluck('module.title');

            $data = [
                'user_name' => $user->name,
                'issued_at' => $cert->issued_at->format('F j, Y'),
                'certificate_id' => $cert->certificate_code ?? 'EWCERT-' . str_pad($cert->id, 6, '0', STR_PAD_LEFT),
                'certificate_type' => $cert->certificate_type,
                'completed_modules' => $completedModules,
                'total_points' => $user->points ?? 0,
            ];

            $pdf = Pdf::loadView('certificates.template', $data)
                ->setPaper('a4', 'landscape');

            $safeName = preg_replace('/[^a-zA-Z0-9\-]/', '-', $user->name);
            $pdfContent = $pdf->output();

            return response($pdfContent, 200)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="eWards-Certificate-' . $safeName . '.pdf"')
                ->header('Content-Length', strlen($pdfContent));
        } catch (\Exception $e) {
            Log::error('Certificate direct download error: ' . $e->getMessage());
            return response('Error generating certificate: ' . $e->getMessage(), 500);
        }
    }
}
