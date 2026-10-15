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
        Schema::create('gesture_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->integer('sensitivity')->default(5);
            $table->integer('cooldown_ms')->default(800);
            $table->integer('swipe_pixel_threshold')->default(60);
            $table->float('fist_hold_seconds')->default(1.5);
            $table->boolean('show_landmark_canvas')->default(true);
            $table->boolean('audio_feedback')->default(true);
            $table->string('preferred_camera_id')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gesture_settings');
    }
};
