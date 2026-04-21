<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModuleAiSetting extends Model
{
    protected $table = 'lms_ai_settings';

    protected $fillable = [
        'module_id',
        'assistant_enabled',
        'use_cross_module_fallback',
        'last_indexed_at',
        'index_status',
    ];

    protected $casts = [
        'assistant_enabled'         => 'boolean',
        'use_cross_module_fallback' => 'boolean',
        'last_indexed_at'           => 'datetime',
    ];
}
