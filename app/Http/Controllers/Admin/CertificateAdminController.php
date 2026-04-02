<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CertificateAdminController extends Controller
{
    public function issue(Request $request, int $userId)
    {
        $user = User::findOrFail($userId);

        // Determine certificate type
        $certificateType = $request->input('certificate_type', 'module');
        $moduleId = $request->input('module_id');

        if ($certificateType === 'module' && $moduleId) {
            // Individual module certificate
            $cert = Certificate::updateOrCreate(
                ['user_id' => $userId, 'module_id' => $moduleId, 'certificate_type' => 'module'],
                [
                    'issued_at' => now(),
                    'enabled_by_admin' => true,
                    'certificate_code' => 'EW-MOD-' . strtoupper(Str::random(10)),
                ]
            );
        } elseif ($certificateType === 'path') {
            // Path certificate - all modules completed
            $totalPublished = TrainingModule::where('is_published', true)->count();
            $completedCount = TrainingProgress::where('user_id', $userId)->where('module_completed', true)->count();

            if ($completedCount < $totalPublished) {
                return response()->json(['error' => 'User has not completed all modules'], 422);
            }

            $cert = Certificate::updateOrCreate(
                ['user_id' => $userId, 'certificate_type' => 'path'],
                [
                    'issued_at' => now(),
                    'enabled_by_admin' => true,
                    'certificate_code' => 'EW-PATH-' . strtoupper(Str::random(10)),
                ]
            );
        } elseif ($certificateType === 'expert') {
            // Expert certificate - 300+ points
            if ($user->points < 300) {
                return response()->json(['error' => 'User does not have 300+ points'], 422);
            }

            $cert = Certificate::updateOrCreate(
                ['user_id' => $userId, 'certificate_type' => 'expert'],
                [
                    'issued_at' => now(),
                    'enabled_by_admin' => true,
                    'certificate_code' => 'EW-EXP-' . strtoupper(Str::random(10)),
                ]
            );
        } else {
            // Default module certificate without specific module
            $cert = Certificate::updateOrCreate(
                ['user_id' => $userId],
                [
                    'issued_at' => now(),
                    'enabled_by_admin' => true,
                    'certificate_type' => $certificateType,
                ]
            );
        }

        return response()->json(['success' => true, 'certificate' => $cert]);
    }
}
