<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Presentation extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'aspect_ratio',
        'slides_data',
        'presentation_url',
        'is_sample',
        'source_type',
        'file_path',
        'original_filename',
    ];

    protected $hidden = [
        'file_path',
    ];

    protected $casts = [
        'slides_data' => 'array',
        'is_sample' => 'boolean',
    ];

    public function isViewableBy(?User $user): bool
    {
        return $this->is_sample || ($user && $this->user_id === $user->id);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function telemetrySessions()
    {
        return $this->hasMany(TelemetrySession::class);
    }
}
