<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\ModuleFeedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(Request $request, $moduleId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
            'improvement_suggestion' => 'nullable|string|max:1000',
        ]);

        $feedback = ModuleFeedback::updateOrCreate(
            ['user_id' => $request->user()->id, 'module_id' => $moduleId],
            [
                'rating' => $request->rating,
                'comment' => $request->comment,
                'improvement_suggestion' => $request->improvement_suggestion,
            ]
        );

        return response()->json(['message' => 'Feedback submitted', 'feedback' => $feedback]);
    }

    public function show(Request $request, $moduleId)
    {
        $feedback = ModuleFeedback::where('user_id', $request->user()->id)
            ->where('module_id', $moduleId)
            ->first();

        return response()->json($feedback);
    }

    // Admin: Get all feedback for a module
    public function index(Request $request, $moduleId)
    {
        $feedback = ModuleFeedback::where('module_id', $moduleId)
            ->with('user:id,name,email')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($feedback);
    }
}
