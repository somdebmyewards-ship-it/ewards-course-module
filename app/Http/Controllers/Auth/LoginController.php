<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Training\ProgressController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'approved' => $user->approved,
                'points' => $user->points,
                'level' => ProgressController::getUserLevel($user->points),
                'merchant_id' => $user->merchant_id,
                'outlet_id' => $user->outlet_id,
            ],
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'approved' => $user->approved,
            'points' => $user->points,
            'level' => ProgressController::getUserLevel($user->points),
            'merchant_id' => $user->merchant_id,
            'outlet_id' => $user->outlet_id,
            'merchant_name' => $user->merchant?->name ?? $user->merchant_name_entered ?? null,
            'outlet_name' => $user->outlet?->name ?? $user->outlet_name_entered ?? null,
            'designation' => $user->designation,
        ]);
    }
}
