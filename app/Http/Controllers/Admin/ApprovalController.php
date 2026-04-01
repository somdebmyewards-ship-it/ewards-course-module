<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    public function index()
    {
        $pending = User::where('approved', false)
            ->select('id', 'name', 'email', 'role', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($pending);
    }

    public function approve(Request $request, int $id)
    {
        $user = User::findOrFail($id);
        $user->update([
            'approved' => true,
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);
        return response()->json(['success' => true, 'user' => $user->fresh()]);
    }

    public function reject(Request $request, $id)
    {
        $user = User::where('approved', false)->findOrFail($id);
        $user->update([
            'rejection_reason' => $request->input('rejection_reason', 'Application rejected'),
        ]);
        return response()->json(['message' => 'User rejected']);
    }
}
