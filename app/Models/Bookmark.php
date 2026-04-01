<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bookmark extends Model
{
    protected $table = 'lms_bookmarks';
    protected $fillable = ['user_id', 'module_id', 'section_id'];

    public function user() { return $this->belongsTo(User::class); }
    public function module() { return $this->belongsTo(TrainingModule::class, 'module_id'); }
    public function section() { return $this->belongsTo(TrainingSection::class, 'section_id'); }
}
