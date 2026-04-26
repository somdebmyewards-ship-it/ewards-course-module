<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingQuiz extends Model
{
    protected $table = 'lms_quizzes';
    protected $fillable = ['module_id', 'question', 'options', 'correct_answer', 'explanation', 'display_order'];

    protected $casts = ['options' => 'array'];

    public function module() { return $this->belongsTo(TrainingModule::class, 'module_id'); }
}
