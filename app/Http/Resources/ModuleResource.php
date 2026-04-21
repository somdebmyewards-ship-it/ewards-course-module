<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'icon' => $this->icon,
            'display_order' => $this->display_order,
            'video_url' => $this->video_url,
            'image_urls' => $this->image_urls,
            'document_urls' => $this->document_urls,
            'points_reward' => $this->points_reward,
            'estimated_minutes' => $this->estimated_minutes,
            'is_published' => $this->is_published,
            'quiz_enabled' => $this->quiz_enabled,
            'certificate_enabled' => $this->certificate_enabled,
            'require_help_viewed' => $this->require_help_viewed,
            'require_checklist' => $this->require_checklist,
            'require_quiz' => $this->require_quiz,
            'page_route' => $this->page_route,
            'sections_count' => $this->whenCounted('sections'),
            'checklists_count' => $this->whenCounted('checklists'),
            'quizzes_count' => $this->whenCounted('quizzes'),
            'sections' => SectionResource::collection($this->whenLoaded('sections')),
            'checklists' => $this->whenLoaded('checklists'),
            'quizzes' => $this->whenLoaded('quizzes'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
