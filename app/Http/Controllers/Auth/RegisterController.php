<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Mail\NewSignupNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\Password;

class RegisterController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:lms_users',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'nullable|in:CASHIER,CLIENT',
            'mobile' => 'nullable|string|max:20',
            'merchant_name_entered' => 'nullable|string|max:255',
            'outlet_name_entered' => 'nullable|string|max:255',
            'ewards_reference' => 'nullable|string|max:255',
            'designation' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'CASHIER',
            'mobile' => $validated['mobile'] ?? null,
            'merchant_name_entered' => $validated['merchant_name_entered'] ?? null,
            'outlet_name_entered' => $validated['outlet_name_entered'] ?? null,
            'ewards_reference' => $validated['ewards_reference'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'approved' => true,
        ]);

        // Send email notification to admin
        try {
            $adminEmail = config('lms.admin_notification_email', 'admin@ewards.com');
            Mail::to($adminEmail)->send(new NewSignupNotification($user));
            Log::info("Signup notification sent to {$adminEmail} for user {$user->email}");
        } catch (\Exception $e) {
            Log::error("Failed to send signup notification: " . $e->getMessage());
            // Don't fail registration if email fails
        }

        return response()->json([
            'message' => 'Registration successful. Please login to continue.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'approved' => $user->approved,
            ],
        ], 201);
    }
}
