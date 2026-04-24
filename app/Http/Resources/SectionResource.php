<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'module_id' => $this->module_id,
            'title' => $this->title,
            'body' => $this->body,
            'content_type' => $this->content_type,
            'media_url' => $this->media_url,
            'display_order' => $this->display_order,
            'key_takeaway' => $this->key_takeaway,
            'is_required' => $this->is_required,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
