<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PresentationAsset extends Model
{
    protected $fillable = [
        'presentation_id',
        'type',
        'file_path',
        'original_filename',
        'source_url',
        'page_count',
    ];

    protected $hidden = [
        'file_path',
    ];

    protected $casts = [
        'page_count' => 'integer',
    ];

    protected $appends = [
        'url',
    ];

    public function getUrlAttribute(): string
    {
        return route('presentations.assets.file', [$this->presentation_id, $this->id]);
    }

    public function contentType(): string
    {
        return match ($this->type) {
            'pdf' => 'application/pdf',
            'pptx' => 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            default => match (pathinfo($this->file_path, PATHINFO_EXTENSION)) {
                'png' => 'image/png',
                'gif' => 'image/gif',
                'webp' => 'image/webp',
                default => 'image/jpeg',
            },
        };
    }

    public function presentation()
    {
        return $this->belongsTo(Presentation::class);
    }
}
