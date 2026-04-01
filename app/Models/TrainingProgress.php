<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingProgress extends Model
{
    protected $table = 'lms_training_progress';

    protected $fillable = [
        'user_id', 'module_id', 'help_viewed', 'help_viewed_at',
        'checklist_state', 'checklist_completed', 'checklist_completed_at',
        'quiz_completed', 'quiz_completed_at', 'quiz_score', 'quiz_answers',
        'module_completed', 'module_completed_at', 'last_section_id',
    ];

    protected $casts = [
        'help_viewed' => 'boolean',
        'checklist_completed' => 'boolean',
        'quiz_completed' => 'boolean',
        'module_completed' => 'boolean',
        'checklist_state' => 'array',
        'quiz_score' => 'integer',
        'quiz_answers' => 'array',
        'help_viewed_at' => 'datetime',
        'checklist_completed_at' => 'datetime',
        'quiz_completed_at' => 'datetime',
        'module_completed_at' => 'datetime',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function module() { return $this->belongsTo(TrainingModule::class, 'module_id'); }
    public function lastSection() { return $this->belongsTo(TrainingSection::class, 'last_section_id'); }
}
