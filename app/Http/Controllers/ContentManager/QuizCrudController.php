<?php

namespace App\Http\Controllers\ContentManager;

use App\Http\Controllers\Controller;
use App\Models\TrainingQuiz;
use Illuminate\Http\Request;

class QuizCrudController extends Controller
{
    public function store(Request $request, int $moduleId)
    {
        // Frontend sends options as a JSON string — decode before validation
        if ($request->has('options') && is_string($request->input('options'))) {
            $request->merge(['options' => json_decode($request->input('options'), true)]);
        }

        $validated = $request->validate([
            'question'      => 'required|string',
            'options'       => 'required|array|min:2',
            'correct_answer'=> 'required|string',
            'explanation'   => 'nullable|string',
            'display_order' => 'nullable|integer',
        ]);

        $validated['module_id']     = $moduleId;
        $validated['display_order'] = $validated['display_order'] ?? (TrainingQuiz::where('module_id', $moduleId)->max('display_order') + 1);

        $quiz = TrainingQuiz::create($validated);
        return response()->json($quiz, 201);
    }

    public function update(Request $request, int $id)
    {
        // Frontend sends options as a JSON string — decode before saving
        if ($request->has('options') && is_string($request->input('options'))) {
            $request->merge(['options' => json_decode($request->input('options'), true)]);
        }

        $quiz = TrainingQuiz::findOrFail($id);
        $data = array_filter(
            $request->only(['question', 'options', 'correct_answer', 'explanation', 'display_order']),
            fn($v) => $v !== null
        );
        $quiz->update($data);
        return response()->json($quiz->fresh());
    }

    public function destroy(int $id)
    {
        TrainingQuiz::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
