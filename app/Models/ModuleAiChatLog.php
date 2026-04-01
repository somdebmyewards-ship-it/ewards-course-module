<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModuleAiChatLog extends Model
{
    protected $table = 'lms_module_ai_chat_logs';

    protected $fillable = [
        'user_id',
        'module_id',
        'question',
        'answer',
        'sources',
        'retrieved_chunk_ids',
        'chunks_retrieved',
        'answer_found',
        'tokens_used',
    ];

    protected $casts = [
        'sources'             => 'array',
        'retrieved_chunk_ids' => 'array',
        'answer_found'        => 'boolean',
    ];
}
