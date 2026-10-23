<?php

namespace Tests\Feature;

use App\Models\TelemetrySession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PointDexTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    protected function signIn(): User
    {
        $user = User::first();
        $this->actingAs($user);

        return $user;
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_dashboard_can_be_rendered(): void
    {
        $this->signIn();
        $response = $this->get('/dashboard');
        $response->assertStatus(200);
    }

    public function test_presentations_index_can_be_rendered(): void
    {
        $this->signIn();
        $response = $this->get('/presentations');
        $response->assertStatus(200);
    }

    public function test_own_presentation_can_be_viewed(): void
    {
        $user = $this->signIn();
        $presentation = $user->presentations()->create(['title' => 'Deck', 'slides_data' => []]);

        $response = $this->get("/presentations/{$presentation->id}");
        $response->assertStatus(200);
    }

    public function test_practice_mode_can_be_rendered(): void
    {
        $this->signIn();
        $response = $this->get('/practice');
        $response->assertStatus(200);
    }

    public function test_analytics_page_can_be_rendered(): void
    {
        $this->signIn();
        $response = $this->get('/analytics');
        $response->assertStatus(200);
    }

    public function test_telemetry_session_can_be_started_and_logged(): void
    {
        $user = $this->signIn();
        $presentation = $user->presentations()->create(['title' => 'Deck', 'slides_data' => []]);

        // 1. Start telemetry session
        $startResponse = $this->postJson('/telemetry/start', [
            'presentation_id' => $presentation->id,
            'mode' => 'presentation',
            'lighting_condition' => 'indoor_office',
            'distance_meters' => 1.5,
        ]);

        $startResponse->assertStatus(200);
        $startResponse->assertJson(['success' => true]);

        $sessionCode = $startResponse->json('session.session_code');
        $this->assertNotEmpty($sessionCode);
        $this->assertSame($user->id, TelemetrySession::firstWhere('session_code', $sessionCode)->user_id);

        // 2. Log gesture event
        $logResponse = $this->postJson('/telemetry/log', [
            'session_code' => $sessionCode,
            'gesture_type' => 'swipe_right',
            'confidence' => 0.95,
            'latency_ms' => 42.0,
            'dispatched_key' => 'ArrowRight',
            'is_successful' => true,
        ]);

        $logResponse->assertStatus(200);
        $logResponse->assertJson(['success' => true]);

        // 3. End session
        $endResponse = $this->postJson('/telemetry/end', [
            'session_code' => $sessionCode,
            'avg_fps' => 29.8,
            'avg_latency_ms' => 41.5,
        ]);

        $endResponse->assertStatus(200);
        $endResponse->assertJson(['success' => true]);
    }

    public function test_analytics_only_shows_the_users_own_data(): void
    {
        $user = $this->signIn();
        $mine = $user->telemetrySessions()->create(['session_code' => 'PDX-MINE01']);
        $mine->logs()->create(['gesture_type' => 'swipe_right']);

        $other = User::factory()->create();
        $theirs = $other->telemetrySessions()->create(['session_code' => 'PDX-THEIRS']);
        $theirs->logs()->create(['gesture_type' => 'fist']);
        $theirs->logs()->create(['gesture_type' => 'fist']);

        $this->get('/analytics')->assertInertia(fn (Assert $page) => $page
            ->has('sessions', 1)
            ->where('sessions.0.session_code', 'PDX-MINE01')
            ->where('metrics.totalSessions', 1)
            ->where('metrics.totalGestures', 1)
            ->has('metrics.gestureDistribution', 1)
        );

        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('stats.totalSessions', 1)
            ->has('recentSessions', 1)
        );
    }

    public function test_fps_and_latency_averages_only_use_measured_sessions(): void
    {
        $user = $this->signIn();
        $user->telemetrySessions()->create(['session_code' => 'PDX-EMPTY1']); // camera never ran

        $code = $this->postJson('/telemetry/start', ['mode' => 'practice'])->json('session.session_code');
        $this->postJson('/telemetry/end', [
            'session_code' => $code,
            'total_frames_processed' => 900,
            'avg_fps' => 29.6,
            'avg_latency_ms' => 41.2,
            'duration_seconds' => 30,
        ])->assertOk();

        $this->get('/dashboard')->assertInertia(fn (Assert $page) => $page
            ->where('stats.avgFps', 29.6)
            ->where('stats.avgLatency', 41.2)
        );

        $this->get('/analytics')->assertInertia(fn (Assert $page) => $page
            ->where('metrics.avgFps', 29.6)
            ->where('metrics.avgLatency', 41.2)
        );
    }

    public function test_users_cannot_log_gestures_into_another_users_session(): void
    {
        $other = User::factory()->create();
        $other->telemetrySessions()->create(['session_code' => 'PDX-THEIRS']);

        $this->signIn();

        $this->postJson('/telemetry/log', [
            'session_code' => 'PDX-THEIRS',
            'gesture_type' => 'swipe_right',
        ])->assertNotFound();
    }
}
