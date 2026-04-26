<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    public function store(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        // Always return 200 to avoid email enumeration
        if (!$user) {
            return response()->json(['message' => 'If that email is registered, a reset link has been sent.']);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->upsert(
            ['email' => $user->email, 'token' => hash('sha256', $token), 'created_at' => now()],
            ['email'],
            ['token', 'created_at']
        );

        try {
            Mail::to($user->email)->send(new PasswordResetMail($user->email, $token, $user->name));
        } catch (\Exception $e) {
            Log::error('Password reset mail failed: ' . $e->getMessage());
            return response()->json(['message' => 'Could not send reset email. Please try again later.'], 500);
        }

        return response()->json(['message' => 'If that email is registered, a reset link has been sent.']);
    }
}
