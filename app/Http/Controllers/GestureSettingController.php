<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\GestureSetting;

class GestureSettingController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'sensitivity' => 'nullable|integer|min:1|max:10',
            'cooldown_ms' => 'nullable|integer|min:300|max:3000',
            'swipe_pixel_threshold' => 'nullable|integer|min:20|max:200',
            'fist_hold_seconds' => 'nullable|numeric|min:0.5|max:5',
            'show_landmark_canvas' => 'nullable|boolean',
            'audio_feedback' => 'nullable|boolean',
            'preferred_camera_id' => 'nullable|string',
        ]);

        $userId = $request->user()?->id;

        $setting = $userId
            ? GestureSetting::firstOrCreate(['user_id' => $userId])
            : (GestureSetting::first() ?? new GestureSetting());

        $setting->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'settings' => $setting,
            ]);
        }

        return back()->with('success', 'Settings updated successfully.');
    }
}
