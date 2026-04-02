<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingSection extends Model
{
    protected $table = 'lms_sections';

    protected $fillable = ['module_id', 'title', 'body', 'content_type', 'media_url', 'video_url', 'image_urls', 'document_urls', 'display_order', 'key_takeaway', 'try_this_action', 'is_required', 'status'];

    protected $casts = [
        'image_urls' => 'array',
        'document_urls' => 'array',
        'is_required' => 'boolean',
    ];

    public function module() { return $this->belongsTo(TrainingModule::class, 'module_id'); }
}
