<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizAttempt extends Model
{
    protected $table = 'lms_quiz_attempts';
    public $timestamps = false;
    protected $fillable = ['user_id', 'module_id', 'score_percent', 'passed', 'answers', 'attempted_at'];
    protected $casts = ['answers' => 'array', 'passed' => 'boolean', 'attempted_at' => 'datetime'];

    public function user() { return $this->belongsTo(User::class); }
    public function module() { return $this->belongsTo(TrainingModule::class, 'module_id'); }
}
