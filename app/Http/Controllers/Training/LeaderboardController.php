<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Services\LeaderboardService;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    public function __construct(private LeaderboardService $leaderboard) {}

    public function index(Request $request)
    {
        $entries = $this->leaderboard->getForUser($request->user());
        return response()->json($entries);
    }
}
