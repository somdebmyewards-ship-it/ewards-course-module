<?php

namespace App\Http\Controllers\Training;

use App\Http\Controllers\Controller;
use App\Models\ModuleRoute;
use Illuminate\Http\Request;

class ModuleRouteController extends Controller
{
    public function lookup(Request $request)
    {
        $routePath = $request->query('route');
        if (!$routePath) return response()->json(['error' => 'route parameter required'], 400);

        $mapping = ModuleRoute::where('route_path', $routePath)
            ->with(['module:id,title,slug', 'section:id,title'])
            ->first();

        if (!$mapping) return response()->json(null);
        return response()->json($mapping);
    }
}
