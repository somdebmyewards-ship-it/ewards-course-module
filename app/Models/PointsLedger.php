<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PointsLedger extends Model
{
    protected $table = 'lms_points_ledger';

    protected $fillable = [
        'user_id', 'points', 'reason', 'module_id', 'balance_after',
    ];

    public function user() { return $this->belongsTo(User::class); }

    /**
     * H2: Record a points transaction. Call AFTER incrementing user.points.
     */
    public static function record(int $userId, int $points, string $reason, ?int $moduleId = null): self
    {
        $balance = User::where('id', $userId)->value('points') ?? 0;

        return self::create([
            'user_id' => $userId,
            'points' => $points,
            'reason' => $reason,
            'module_id' => $moduleId,
            'balance_after' => $balance,
        ]);
    }
}
