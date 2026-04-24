<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBadge extends Model
{
    protected $table = 'lms_user_badges';
    public $timestamps = false;

    protected $fillable = ['user_id', 'badge_id', 'awarded_at'];

    protected $casts = ['awarded_at' => 'datetime'];

    public function badge() { return $this->belongsTo(Badge::class); }
    public function user() { return $this->belongsTo(User::class); }
}
