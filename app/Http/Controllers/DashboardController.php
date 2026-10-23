<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\GestureSetting;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $presentations = $user->presentations()->latest()->get();

        $recentSessions = $user->telemetrySessions()->latest()->take(5)->get();

        $stats = [
            'totalPresentations' => $presentations->count(),
            'totalSessions' => $user->telemetrySessions()->count(),
            'avgLatency' => round($user->telemetrySessions()->measured()->avg('avg_latency_ms') ?? 0, 1),
            'avgFps' => round($user->telemetrySessions()->measured()->avg('avg_fps') ?? 0, 1),
        ];

        $settings = GestureSetting::firstOrCreate(['user_id' => $user->id]);

        return Inertia::render('Dashboard', [
            'presentations' => $presentations,
            'recentSessions' => $recentSessions,
            'stats' => $stats,
            'settings' => $settings,
        ]);
    }
}
