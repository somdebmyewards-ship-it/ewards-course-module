<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function index()
    {
        $pending = User::where('approved', false)
            ->whereNull('rejection_reason')
            ->select('id', 'name', 'email', 'role', 'merchant_name_entered', 'outlet_name_entered', 'designation', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($pending);
    }

    // E2: Atomic approval with merchant/outlet mapping
    public function approve(Request $request, int $id)
    {
        $request->validate([
            'merchant_id' => 'nullable|exists:lms_merchants,id',
            'outlet_id' => 'nullable|exists:lms_outlets,id',
        ]);

        $user = User::where('approved', false)->findOrFail($id);
        $user->update(array_filter([
            'approved' => true,
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
            'merchant_id' => $request->input('merchant_id'),
            'outlet_id' => $request->input('outlet_id'),
        ], fn($v) => $v !== null));

        // H1: Audit log
        AuditLog::record('user.approve', $request->user()->id, 'user', $id);

        return response()->json(['success' => true, 'user' => $user->fresh()]);
    }

    // E1: Proper rejection — mark as rejected, clean up tokens
    public function reject(Request $request, $id)
    {
        $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $user = User::where('approved', false)->findOrFail($id);
        $user->update([
            'rejection_reason' => $request->input('rejection_reason', 'Application rejected'),
        ]);
        // Revoke any tokens so rejected user can't call API
        $user->tokens()->delete();

        // H1: Audit log
        AuditLog::record('user.reject', $request->user()->id, 'user', $id, [
            'reason' => $request->input('rejection_reason'),
        ]);

        return response()->json(['message' => 'User rejected', 'user' => $user->fresh()]);
    }
}
