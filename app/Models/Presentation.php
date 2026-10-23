<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Presentation extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'aspect_ratio',
        'slides_data',
        'presentation_url',
    ];

    /**
     * slides_data is the ordered slide list: [{key, asset_id, page}, ...]
     */
    protected $casts = [
        'slides_data' => 'array',
    ];

    public function isViewableBy(?User $user): bool
    {
        return $user && $this->user_id === $user->id;
    }

    /**
     * Add the asset's slides to the end of the deck. A PDF / PowerPoint whose pages
     * haven't been counted yet gets one placeholder slide (page null) that keeps its spot.
     */
    public function appendSlidesFor(PresentationAsset $asset): void
    {
        $this->update(['slides_data' => [...($this->slides_data ?? []), ...$this->slidesFor($asset)]]);
    }

    /**
     * Swap the asset's saved placeholder (if any) for its real slides, in the same position.
     */
    public function expandPlaceholderFor(PresentationAsset $asset): void
    {
        $slides = $this->slides_data ?? [];

        foreach ($slides as $index => $slide) {
            if ($slide['asset_id'] === $asset->id && $slide['page'] === null) {
                array_splice($slides, $index, 1, $this->slidesFor($asset));
                $this->update(['slides_data' => $slides]);

                return;
            }
        }
    }

    /**
     * @return list<array{key: string, asset_id: int, page: ?int}>
     */
    private function slidesFor(PresentationAsset $asset): array
    {
        if ($asset->page_count === null) {
            return [['key' => Str::random(12), 'asset_id' => $asset->id, 'page' => null]];
        }

        return array_map(
            fn ($page) => ['key' => Str::random(12), 'asset_id' => $asset->id, 'page' => $page],
            range(0, $asset->page_count - 1)
        );
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function assets()
    {
        return $this->hasMany(PresentationAsset::class);
    }

    public function telemetrySessions()
    {
        return $this->hasMany(TelemetrySession::class);
    }
}
