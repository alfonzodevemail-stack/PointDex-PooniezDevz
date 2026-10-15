<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Presentation;
use App\Models\TelemetrySession;
use App\Models\GestureSetting;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()?->id;

        $presentations = Presentation::when($userId, function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhere('is_sample', true);
        }, function ($q) {
            $q->where('is_sample', true);
        })->latest()->get();

        $recentSessions = TelemetrySession::when($userId, function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })->latest()->take(5)->get();

        $stats = [
            'totalPresentations' => $presentations->count(),
            'totalSessions' => TelemetrySession::count(),
            'avgLatency' => round(TelemetrySession::avg('avg_latency_ms') ?? 42, 1),
            'avgFps' => round(TelemetrySession::avg('avg_fps') ?? 29.5, 1),
        ];

        $settings = $userId ? GestureSetting::firstOrCreate(['user_id' => $userId]) : GestureSetting::first();

        return Inertia::render('Dashboard', [
            'presentations' => $presentations,
            'recentSessions' => $recentSessions,
            'stats' => $stats,
            'settings' => $settings,
        ]);
    }
}
