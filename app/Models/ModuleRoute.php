<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ModuleRoute extends Model
{
    protected $table = 'lms_module_routes';
    protected $fillable = ['module_id', 'route_path', 'section_id', 'context_label'];

    public function module() { return $this->belongsTo(TrainingModule::class, 'module_id'); }
    public function section() { return $this->belongsTo(TrainingSection::class, 'section_id'); }
}
