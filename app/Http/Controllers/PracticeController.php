<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\GestureSetting;
use Inertia\Inertia;

class PracticeController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()?->id;
        $settings = $userId 
            ? GestureSetting::firstOrCreate(['user_id' => $userId]) 
            : (GestureSetting::first() ?? new GestureSetting());

        return Inertia::render('Practice/Index', [
            'settings' => $settings,
        ]);
    }
}
