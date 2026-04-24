<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $table = 'lms_audit_logs';

    protected $fillable = [
        'user_id', 'action', 'target_type', 'target_id', 'metadata', 'ip_address',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function user() { return $this->belongsTo(User::class); }

    /**
     * H1: Log an admin action.
     */
    public static function record(string $action, ?int $userId = null, ?string $targetType = null, ?int $targetId = null, ?array $metadata = null): self
    {
        return self::create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'metadata' => $metadata,
            'ip_address' => request()->ip(),
        ]);
    }
}
