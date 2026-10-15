<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GestureLog extends Model
{
    protected $fillable = [
        'telemetry_session_id',
        'gesture_type',
        'confidence',
        'latency_ms',
        'dispatched_key',
        'is_successful',
        'frame_index',
        'delta_x',
        'delta_y',
    ];

    protected $casts = [
        'confidence' => 'float',
        'latency_ms' => 'float',
        'is_successful' => 'boolean',
        'frame_index' => 'integer',
        'delta_x' => 'float',
        'delta_y' => 'float',
    ];

    public function session()
    {
        return $this->belongsTo(TelemetrySession::class, 'telemetry_session_id');
    }
}
