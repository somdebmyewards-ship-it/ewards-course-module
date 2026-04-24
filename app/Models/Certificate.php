<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    protected $table = 'lms_certificates';
    protected $fillable = ['user_id', 'issued_at', 'enabled_by_admin', 'certificate_url', 'module_id', 'certificate_type', 'certificate_code'];

    protected $casts = [
        'issued_at' => 'datetime',
        'enabled_by_admin' => 'boolean',
    ];

    public function user() { return $this->belongsTo(User::class); }
    public function module() { return $this->belongsTo(\App\Models\TrainingModule::class, 'module_id'); }
}
