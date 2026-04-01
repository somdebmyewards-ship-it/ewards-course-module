<?php
namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    public function index(Request $request)
    {
        $bookmarks = Bookmark::where('user_id', $request->user()->id)
            ->with(['module:id,title,slug,icon', 'section:id,title,display_order'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($bookmarks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'module_id' => 'required|exists:lms_training_modules,id',
            'section_id' => 'nullable|exists:lms_training_sections,id',
        ]);

        $bookmark = Bookmark::firstOrCreate([
            'user_id' => $request->user()->id,
            'module_id' => $request->module_id,
            'section_id' => $request->section_id,
        ]);

        return response()->json($bookmark, 201);
    }

    public function destroy(Request $request, int $id)
    {
        Bookmark::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['success' => true]);
    }
}
