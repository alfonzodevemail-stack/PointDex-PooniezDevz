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
        Schema::create('gesture_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('telemetry_session_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('gesture_type'); // swipe_right, swipe_left, fist, open_palm, unrecognized
            $table->float('confidence')->nullable();
            $table->float('latency_ms')->nullable();
            $table->string('dispatched_key')->nullable(); // ArrowRight, ArrowLeft, F5, Pause
            $table->boolean('is_successful')->default(true);
            $table->integer('frame_index')->nullable();
            $table->float('delta_x')->nullable();
            $table->float('delta_y')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gesture_logs');
    }
};
