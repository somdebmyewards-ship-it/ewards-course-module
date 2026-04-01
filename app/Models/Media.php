<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Media extends Model
{
    protected $table = 'lms_media';
    protected $fillable = ['filename', 'original_name', 'mime_type', 'size', 'disk', 'path', 'url', 'uploaded_by'];

    protected $casts = ['size' => 'integer'];

    public function uploader() { return $this->belongsTo(User::class, 'uploaded_by'); }
}
