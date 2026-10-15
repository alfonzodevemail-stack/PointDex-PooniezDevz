<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GestureSetting extends Model
{
    protected $fillable = [
        'user_id',
        'sensitivity',
        'cooldown_ms',
        'swipe_pixel_threshold',
        'fist_hold_seconds',
        'show_landmark_canvas',
        'audio_feedback',
        'preferred_camera_id',
    ];

    protected $casts = [
        'sensitivity' => 'integer',
        'cooldown_ms' => 'integer',
        'swipe_pixel_threshold' => 'integer',
        'fist_hold_seconds' => 'float',
        'show_landmark_canvas' => 'boolean',
        'audio_feedback' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
