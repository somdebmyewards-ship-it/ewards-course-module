<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\TrainingModule;
use App\Models\TrainingProgress;
use App\Models\User;
use Illuminate\Http\Request;

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
                    'certificate_code' => 'EWMOD-' . str_pad($moduleId, 4, '0', STR_PAD_LEFT) . '-' . str_pad($userId, 6, '0', STR_PAD_LEFT),
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
                    'certificate_code' => 'EWPATH-' . str_pad($userId, 6, '0', STR_PAD_LEFT),
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
                    'certificate_code' => 'EWEXP-' . str_pad($userId, 6, '0', STR_PAD_LEFT),
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
