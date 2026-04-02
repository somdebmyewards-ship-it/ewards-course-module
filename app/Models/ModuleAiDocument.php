<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModuleAiDocument extends Model
{
    protected $table = 'lms_ai_documents';

    protected $fillable = [
        'module_id',
        'source_type',
        'source_id',
        'source_title',
        'file_path',
        'raw_text',
        'status',
        'indexed_at',
    ];

    protected $casts = [
        'indexed_at' => 'datetime',
    ];

    public function chunks()
    {
        return $this->hasMany(ModuleAiChunk::class, 'document_id');
    }
}
