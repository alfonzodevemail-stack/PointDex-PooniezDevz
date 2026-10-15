<?php

namespace Tests\Feature;

use App\Models\Presentation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PointDexTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_dashboard_can_be_rendered(): void
    {
        $response = $this->get('/dashboard');
        $response->assertStatus(200);
    }

    public function test_presentations_index_can_be_rendered(): void
    {
        $response = $this->get('/presentations');
        $response->assertStatus(200);
    }

    public function test_sample_presentation_can_be_viewed(): void
    {
        $presentation = Presentation::first();
        $response = $this->get("/presentations/{$presentation->id}");
        $response->assertStatus(200);
    }

    public function test_practice_mode_can_be_rendered(): void
    {
        $response = $this->get('/practice');
        $response->assertStatus(200);
    }

    public function test_analytics_page_can_be_rendered(): void
    {
        $response = $this->get('/analytics');
        $response->assertStatus(200);
    }

    public function test_telemetry_session_can_be_started_and_logged(): void
    {
        $presentation = Presentation::first();

        // 1. Start telemetry session
        $startResponse = $this->postJson('/api/telemetry/start', [
            'presentation_id' => $presentation->id,
            'mode' => 'presentation',
            'lighting_condition' => 'indoor_office',
            'distance_meters' => 1.5,
        ]);

        $startResponse->assertStatus(200);
        $startResponse->assertJson(['success' => true]);

        $sessionCode = $startResponse->json('session.session_code');
        $this->assertNotEmpty($sessionCode);

        // 2. Log gesture event
        $logResponse = $this->postJson('/api/telemetry/log', [
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
        $endResponse = $this->postJson('/api/telemetry/end', [
            'session_code' => $sessionCode,
            'avg_fps' => 29.8,
            'avg_latency_ms' => 41.5,
        ]);

        $endResponse->assertStatus(200);
        $endResponse->assertJson(['success' => true]);
    }
}
