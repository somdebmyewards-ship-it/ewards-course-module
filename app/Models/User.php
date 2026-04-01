<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'lms_users';

    protected $fillable = [
        'name', 'email', 'password', 'role', 'approved',
        'merchant_id', 'outlet_id', 'points', 'approved_at', 'approved_by',
        'merchant_name_entered', 'outlet_name_entered', 'ewards_reference',
        'designation', 'mobile', 'rejection_reason',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'approved' => 'boolean',
        'approved_at' => 'datetime',
        'points' => 'integer',
    ];

    public function merchant() { return $this->belongsTo(Merchant::class); }
    public function outlet() { return $this->belongsTo(Outlet::class); }
    public function approvedByUser() { return $this->belongsTo(User::class, 'approved_by'); }
    public function progress() { return $this->hasMany(TrainingProgress::class); }
    public function bookmarks() { return $this->hasMany(Bookmark::class); }
    public function certificates() { return $this->hasMany(Certificate::class); }
    public function uploadedMedia() { return $this->hasMany(Media::class, 'uploaded_by'); }
    public function sectionViews() { return $this->hasMany(SectionView::class); }
    public function quizAttempts() { return $this->hasMany(QuizAttempt::class); }

    public function isAdmin(): bool { return $this->role === 'ADMIN'; }
    public function isTrainer(): bool { return $this->role === 'TRAINER'; }
    public function hasRole(string ...$roles): bool { return in_array($this->role, $roles); }
}
