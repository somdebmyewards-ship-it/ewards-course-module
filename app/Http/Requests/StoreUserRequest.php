<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:lms_users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:ADMIN,TRAINER,CASHIER,CLIENT',
            'merchant_id' => 'nullable|exists:lms_merchants,id',
            'outlet_id' => 'nullable|exists:lms_outlets,id',
        ];
    }
}
