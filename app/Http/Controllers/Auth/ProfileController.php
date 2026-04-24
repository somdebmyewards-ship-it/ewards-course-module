<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id'          => $user->id,
            'name'        => $user->name,
            'email'       => $user->email,
            'mobile'      => $user->mobile,
            'designation' => $user->designation,
            'role'        => $user->role,
            'points'      => $user->points,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'mobile'           => 'nullable|string|max:20',
            'designation'      => 'nullable|string|max:255',
            'current_password' => 'nullable|string',
            'new_password'     => ['nullable', 'confirmed', Password::min(8)],
        ]);

        $user = $request->user();

        if (!empty($validated['current_password'])) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json(['message' => 'Current password is incorrect.'], 422);
            }
            $user->password = Hash::make($validated['new_password']);
        }

        $user->name        = $validated['name'];
        $user->mobile      = $validated['mobile'] ?? $user->mobile;
        $user->designation = $validated['designation'] ?? $user->designation;
        $user->save();

        return response()->json(['message' => 'Profile updated successfully.']);
    }
}
