<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreModuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('ADMIN', 'TRAINER') ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'icon' => 'nullable|string|max:50',
            'display_order' => 'nullable|integer',
            'video_url' => 'nullable|string|max:500',
            'points_reward' => 'nullable|integer|min:0',
            'is_published' => 'nullable|boolean',
            'page_route' => 'nullable|string|max:255',
        ];
    }
}
