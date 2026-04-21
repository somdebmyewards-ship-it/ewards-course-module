<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Outlet extends Model
{
    protected $table = 'lms_outlets';
    protected $fillable = ['merchant_id', 'name'];

    public function merchant() { return $this->belongsTo(Merchant::class); }
    public function users() { return $this->hasMany(User::class); }
}
