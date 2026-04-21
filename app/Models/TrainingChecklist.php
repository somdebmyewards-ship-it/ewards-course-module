<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingChecklist extends Model
{
    protected $table = 'lms_checklists';
    protected $fillable = ['module_id', 'label', 'display_order'];

    public function module() { return $this->belongsTo(TrainingModule::class, 'module_id'); }
}
