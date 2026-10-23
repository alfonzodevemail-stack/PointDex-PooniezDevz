<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Files converted from the old one-file decks have no slides yet. Give each unread
 * file a placeholder slide so its pages are added to the deck once the browser counts them.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach (DB::table('presentations')->get() as $presentation) {
            $slides = json_decode($presentation->slides_data ?? '[]', true) ?: [];
            $usedAssetIds = array_column($slides, 'asset_id');

            $unread = DB::table('presentation_assets')
                ->where('presentation_id', $presentation->id)
                ->whereNull('page_count')
                ->whereNotIn('id', $usedAssetIds)
                ->orderBy('id')
                ->pluck('id');

            if ($unread->isEmpty()) {
                continue;
            }

            foreach ($unread as $assetId) {
                $slides[] = ['key' => Str::random(12), 'asset_id' => $assetId, 'page' => null];
            }

            DB::table('presentations')->where('id', $presentation->id)->update(['slides_data' => json_encode($slides)]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
