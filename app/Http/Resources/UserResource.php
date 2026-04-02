<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role,
            'approved' => $this->approved,
            'points' => $this->points,
            'merchant_id' => $this->merchant_id,
            'outlet_id' => $this->outlet_id,
            'designation' => $this->designation,
            'merchant_name_entered' => $this->merchant_name_entered,
            'outlet_name_entered' => $this->outlet_name_entered,
            'created_at' => $this->created_at,
        ];
    }
}
