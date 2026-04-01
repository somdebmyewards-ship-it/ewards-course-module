<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizMetadata extends Model
{
    protected $table = 'lms_quiz_metadata';
    protected $fillable = ['module_id', 'title', 'passing_percent', 'is_active'];

    public function module() { return $this->belongsTo(TrainingModule::class, 'module_id'); }
    public function questions() { return $this->hasMany(TrainingQuiz::class, 'quiz_metadata_id'); }
}
