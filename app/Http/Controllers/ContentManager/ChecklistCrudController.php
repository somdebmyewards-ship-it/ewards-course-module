<?php

namespace App\Http\Controllers\ContentManager;

use App\Http\Controllers\Controller;
use App\Models\TrainingChecklist;
use Illuminate\Http\Request;

class ChecklistCrudController extends Controller
{
    public function store(Request $request, int $moduleId)
    {
        $validated = $request->validate([
            'label' => 'required|string|max:500',
            'display_order' => 'nullable|integer',
        ]);

        $validated['module_id'] = $moduleId;
        $validated['display_order'] = $validated['display_order'] ?? (TrainingChecklist::where('module_id', $moduleId)->max('display_order') + 1);

        $item = TrainingChecklist::create($validated);
        return response()->json($item, 201);
    }

    public function update(Request $request, int $id)
    {
        $item = TrainingChecklist::findOrFail($id);
        $item->update($request->only(['label', 'display_order']));
        return response()->json($item->fresh());
    }

    public function destroy(int $id)
    {
        TrainingChecklist::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}
