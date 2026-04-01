<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\TrainingModule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserManagementController extends Controller
{
    public function index()
    {
        $users = User::withCount(['progress as completed_modules_count' => function ($q) {
            $q->where('module_completed', true);
        }])->with('certificates')->orderBy('created_at', 'desc')->get();

        $totalModules = TrainingModule::where('is_published', true)->count();

        return response()->json($users->map(function ($u) use ($totalModules) {
            return [
                'id' => $u->id, 'name' => $u->name, 'email' => $u->email,
                'role' => $u->role, 'approved' => $u->approved,
                'points' => $u->points, 'merchant_id' => $u->merchant_id,
                'outlet_id' => $u->outlet_id, 'created_at' => $u->created_at,
                'completed_modules' => $u->completed_modules_count,
                'total_modules' => $totalModules,
                'progress' => $totalModules > 0 ? round(($u->completed_modules_count / $totalModules) * 100) : 0,
                'certified' => $u->certificates->isNotEmpty(),
            ];
        }));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:lms_users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:ADMIN,TRAINER,CASHIER,CLIENT',
            'merchant_id' => 'nullable|exists:lms_merchants,id',
            'outlet_id' => 'nullable|exists:lms_outlets,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'approved' => true,
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
            'merchant_id' => $validated['merchant_id'] ?? null,
            'outlet_id' => $validated['outlet_id'] ?? null,
        ]);

        return response()->json($user, 201);
    }

    public function update(Request $request, int $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'role' => 'sometimes|in:ADMIN,TRAINER,CASHIER,CLIENT',
            'approved' => 'sometimes|boolean',
            'merchant_id' => 'nullable|exists:lms_merchants,id',
            'outlet_id' => 'nullable|exists:lms_outlets,id',
        ]);

        if (isset($validated['approved']) && $validated['approved'] && !$user->approved) {
            $validated['approved_at'] = now();
            $validated['approved_by'] = $request->user()->id;
        }

        $user->update($validated);
        return response()->json($user->fresh());
    }

    public function destroy(Request $request, int $id)
    {
        if ($id == $request->user()->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 400);
        }
        $user = User::findOrFail($id);
        $user->progress()->delete();
        $user->bookmarks()->delete();
        $user->certificates()->delete();
        $user->tokens()->delete();
        $user->delete();
        return response()->json(['success' => true]);
    }
}
