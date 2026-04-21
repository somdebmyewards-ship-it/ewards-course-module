<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Merchant extends Model
{
    protected $table = 'lms_merchants';
    protected $fillable = ['name'];

    public function outlets() { return $this->hasMany(Outlet::class); }
    public function users() { return $this->hasMany(User::class); }
}
