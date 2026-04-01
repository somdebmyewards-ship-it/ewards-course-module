<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModuleFeedback extends Model
{
    protected $table = 'lms_module_feedback';

    protected $fillable = [
        'user_id', 'module_id', 'rating', 'comment', 'improvement_suggestion',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function module()
    {
        return $this->belongsTo(TrainingModule::class, 'module_id');
    }
}
