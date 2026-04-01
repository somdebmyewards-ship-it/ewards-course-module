<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModuleAiChunk extends Model
{
    protected $table = 'lms_module_ai_chunks';

    protected $fillable = [
        'document_id',
        'module_id',
        'chunk_text',
        'embedding',
        'chunk_index',
        'source_type',
        'source_title',
    ];

    protected $casts = [
        'embedding' => 'array',  // JSON float[] stored in MySQL longText
    ];
}
