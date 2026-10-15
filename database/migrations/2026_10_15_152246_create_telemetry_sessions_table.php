<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('telemetry_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('presentation_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_code')->unique();
            $table->string('mode')->default('presentation'); // presentation, practice, benchmark
            $table->string('lighting_condition')->default('indoor_office'); // low_light, indoor_office, bright_sunlight
            $table->float('distance_meters')->default(1.5); // 1.0 to 3.5m
            $table->integer('total_frames_processed')->default(0);
            $table->float('avg_fps')->default(0.0);
            $table->float('avg_latency_ms')->default(0.0);
            $table->integer('total_gestures_detected')->default(0);
            $table->integer('false_positives_reported')->default(0);
            $table->integer('duration_seconds')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('telemetry_sessions');
    }
};
