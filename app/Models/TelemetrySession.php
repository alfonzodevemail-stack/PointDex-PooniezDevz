<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TelemetrySession extends Model
{
    protected $fillable = [
        'user_id',
        'presentation_id',
        'session_code',
        'mode',
        'lighting_condition',
        'distance_meters',
        'total_frames_processed',
        'avg_fps',
        'avg_latency_ms',
        'total_gestures_detected',
        'false_positives_reported',
        'duration_seconds',
        'notes',
    ];

    protected $casts = [
        'distance_meters' => 'float',
        'total_frames_processed' => 'integer',
        'avg_fps' => 'float',
        'avg_latency_ms' => 'float',
        'total_gestures_detected' => 'integer',
        'false_positives_reported' => 'integer',
        'duration_seconds' => 'integer',
    ];

    /**
     * Sessions where the camera actually processed frames, so FPS and latency are real values.
     */
    public function scopeMeasured($query)
    {
        return $query->where('total_frames_processed', '>', 0);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function presentation()
    {
        return $this->belongsTo(Presentation::class);
    }

    public function logs()
    {
        return $this->hasMany(GestureLog::class);
    }
}
