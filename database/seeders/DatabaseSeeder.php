<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $user = User::factory()->create([
            'name' => 'Alfonzo Balagapo',
            'email' => 'alfonzo@pointdex.test',
            'password' => bcrypt('password'),
        ]);

        \App\Models\GestureSetting::create([
            'user_id' => $user->id,
            'sensitivity' => 5,
            'cooldown_ms' => 800,
            'swipe_pixel_threshold' => 60,
            'fist_hold_seconds' => 1.5,
            'show_landmark_canvas' => true,
            'audio_feedback' => true,
        ]);

        \App\Models\Presentation::create([
            'user_id' => $user->id,
            'title' => 'TASK TAMER',
            'description' => 'Final Project Presentation in Application Development - Yearners Group',
            'aspect_ratio' => '16:9',
            'is_sample' => true,
            'slides_data' => [
                [
                    'id' => 1,
                    'title' => 'TASK TAMER',
                    'subtitle' => 'Final Project Presentation in Application Development',
                    'tag' => 'Yearners Group',
                    'bg_gradient' => 'from-slate-900 via-indigo-950 to-slate-900',
                    'content' => 'Gesture-Controlled Presentation Showcase powered by PointDex client-side event bus.',
                    'bullets' => [
                        'Zero-latency browser vision inference',
                        'Decoupled Pub/Sub event pipeline',
                        'Hardware clicker-free presentation navigation',
                    ],
                ],
                [
                    'id' => 2,
                    'title' => 'PROJECT OBJECTIVES',
                    'subtitle' => 'High-Concurrency & Non-Blocking Design',
                    'tag' => 'Architecture',
                    'bg_gradient' => 'from-indigo-950 via-purple-950 to-slate-900',
                    'content' => 'Eliminating input lag and request-response bottlenecks through browser-native event loops.',
                    'bullets' => [
                        'Continuous webcam video frame ingestion via requestAnimationFrame',
                        'MediaPipe 21-point 3D hand landmark inference',
                        'Sub-100ms response time from gesture swipe to DOM slide change',
                    ],
                ],
                [
                    'id' => 3,
                    'title' => 'GESTURE STATE MACHINE',
                    'subtitle' => 'Deterministic Vector Analysis',
                    'tag' => 'Inference Engine',
                    'bg_gradient' => 'from-slate-900 via-blue-950 to-slate-900',
                    'content' => 'Cartesian displacement and velocity heuristics mapped to presentation actions.',
                    'bullets' => [
                        'Swipe Right (Open Hand -> Right) = Next Slide (ArrowRight)',
                        'Swipe Left (Open Hand -> Left) = Previous Slide (ArrowLeft)',
                        'Closed Fist (Held 1.5s) = Fullscreen Toggle (F5)',
                        'Open Palm facing camera = Pause / Blank Screen',
                    ],
                ],
                [
                    'id' => 4,
                    'title' => 'COOLDOWN & DEBOUNCE',
                    'subtitle' => 'Refractory Period Protection',
                    'tag' => 'Event Bus',
                    'bg_gradient' => 'from-purple-950 via-slate-900 to-indigo-950',
                    'content' => 'Software debounce prevents accidental double-slide skips and jitter.',
                    'bullets' => [
                        'Configurable 600ms to 1500ms refractory cooldown window',
                        'Smoothing queue buffering consecutive landmark coordinates',
                        'Instant visual feedback toasts with active cooldown indicators',
                    ],
                ],
                [
                    'id' => 5,
                    'title' => 'EMPIRICAL BENCHMARKING',
                    'subtitle' => 'Real-Time Telemetry & Usability',
                    'tag' => 'Evaluation',
                    'bg_gradient' => 'from-slate-900 via-emerald-950 to-slate-900',
                    'content' => 'Automated telemetry logger recording latency, FPS, and gesture success rates.',
                    'bullets' => [
                        'Frame rate target: 28-30 FPS on integrated laptop GPUs',
                        'Accuracy benchmark: >= 90% across 100 trials',
                        'Full compliance with RA 10173 (Data Privacy Act of 2012)',
                    ],
                ],
            ],
        ]);
    }
}
