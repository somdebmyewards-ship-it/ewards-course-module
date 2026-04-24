<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\PointsLedger;
use Illuminate\Http\Request;

class PointsController extends Controller
{
    public function ledger(Request $request)
    {
        $entries = PointsLedger::where('user_id', $request->user()->id)
            ->with('module:id,title,slug,icon')
            ->orderByDesc('created_at')
            ->take(50)
            ->get()
            ->map(fn($e) => [
                'id'            => $e->id,
                'points'        => $e->points,
                'reason'        => $e->reason,
                'balance_after' => $e->balance_after,
                'module_title'  => $e->module?->title,
                'module_slug'   => $e->module?->slug,
                'module_icon'   => $e->module?->icon,
                'created_at'    => $e->created_at,
            ]);

        return response()->json($entries);
    }
}
