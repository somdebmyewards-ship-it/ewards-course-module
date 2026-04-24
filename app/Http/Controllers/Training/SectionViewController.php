<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\SectionView;
use App\Services\BadgeService;
use Illuminate\Http\Request;

class SectionViewController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'module_id' => 'required|exists:lms_modules,id',
            'section_id' => 'required|exists:lms_sections,id',
        ]);

        $userId = auth()->id();

        SectionView::updateOrCreate(
            ['user_id' => $userId, 'section_id' => $validated['section_id']],
            ['module_id' => $validated['module_id'], 'viewed_at' => now()]
        );

        app(BadgeService::class)->onSectionViewed($userId);

        return response()->json(['message' => 'Section view recorded']);
    }

    public function index(Request $request)
    {
        $views = SectionView::where('user_id', auth()->id())
            ->with(['module:id,title', 'section:id,title'])
            ->get();
        return response()->json($views);
    }
}
