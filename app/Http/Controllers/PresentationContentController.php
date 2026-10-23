<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ImportsPresentationContent;
use App\Models\Presentation;
use App\Models\PresentationAsset;
use App\Services\PresentationImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Editing a deck's content: adding or replacing files, ordering and removing slides.
 */
class PresentationContentController extends Controller
{
    use ImportsPresentationContent;

    /**
     * Add files or a link to the end of the deck, or replace everything when "replace" is set.
     */
    public function store(Request $request, Presentation $presentation, PresentationImporter $importer)
    {
        $this->authorizeOwner($request, $presentation);

        $request->validate([
            'replace' => 'nullable|boolean',
            ...$this->contentRules(),
        ], $this->contentMessages());

        $previousAssets = $request->boolean('replace') ? $presentation->assets()->get() : collect();

        $this->importContent($request, $presentation, $importer);

        if ($previousAssets->isNotEmpty()) {
            $removedIds = $previousAssets->pluck('id')->all();
            $presentation->update([
                'slides_data' => collect($presentation->slides_data)
                    ->reject(fn ($slide) => in_array($slide['asset_id'], $removedIds, true))
                    ->values()
                    ->all(),
            ]);

            foreach ($previousAssets as $asset) {
                $importer->delete($asset->file_path);
                $asset->delete();
            }
        }

        return back()->with('success', $previousAssets->isNotEmpty() ? 'Presentation replaced.' : 'Content added.');
    }

    public function file(Request $request, Presentation $presentation, PresentationAsset $asset, PresentationImporter $importer)
    {
        $this->authorizeOwner($request, $presentation, $asset);

        return response()->file($importer->absolutePath($asset->file_path), [
            'Content-Type' => $asset->contentType(),
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /**
     * The browser reports how many pages a PDF / PowerPoint has; its slides are then added to the deck.
     */
    public function ready(Request $request, Presentation $presentation, PresentationAsset $asset): JsonResponse
    {
        $this->authorizeOwner($request, $presentation, $asset);

        $validated = $request->validate([
            'page_count' => 'required|integer|min:1|max:1000',
        ]);

        if ($asset->page_count === null) {
            $asset->update(['page_count' => $validated['page_count']]);
            $presentation->expandPlaceholderFor($asset);
        }

        return $this->content($presentation);
    }

    public function destroyAsset(Request $request, Presentation $presentation, PresentationAsset $asset, PresentationImporter $importer): JsonResponse
    {
        $this->authorizeOwner($request, $presentation, $asset);

        $this->removeSlidesWhere($presentation, fn ($slide) => $slide['asset_id'] === $asset->id);
        $importer->delete($asset->file_path);
        $asset->delete();

        return $this->content($presentation);
    }

    public function reorder(Request $request, Presentation $presentation): JsonResponse
    {
        $this->authorizeOwner($request, $presentation);

        $validated = $request->validate([
            'order' => 'required|array',
            'order.*' => 'string',
        ]);

        $slides = collect($presentation->slides_data)->keyBy('key');
        $order = $validated['order'];

        if (count($order) !== $slides->count() || count(array_unique($order)) !== count($order) || $slides->keys()->diff($order)->isNotEmpty()) {
            throw ValidationException::withMessages(['order' => 'The slide list changed. Reload the page and try again.']);
        }

        $presentation->update([
            'slides_data' => array_map(fn ($key) => $slides[$key], $order),
        ]);

        return $this->content($presentation);
    }

    public function destroySlide(Request $request, Presentation $presentation, string $key, PresentationImporter $importer): JsonResponse
    {
        $this->authorizeOwner($request, $presentation);

        $this->removeSlidesWhere($presentation, fn ($slide) => $slide['key'] === $key);

        // Drop files that no longer have any slide in the deck.
        $usedAssetIds = collect($presentation->slides_data)->pluck('asset_id')->unique()->all();
        foreach ($presentation->assets()->whereNotIn('id', $usedAssetIds)->get() as $asset) {
            $importer->delete($asset->file_path);
            $asset->delete();
        }

        return $this->content($presentation);
    }

    private function removeSlidesWhere(Presentation $presentation, callable $matches): void
    {
        $presentation->update([
            'slides_data' => collect($presentation->slides_data)->reject($matches)->values()->all(),
        ]);
    }

    private function content(Presentation $presentation): JsonResponse
    {
        return response()->json([
            'slides' => $presentation->slides_data ?? [],
            'assets' => $presentation->assets()->get(),
        ]);
    }

    private function authorizeOwner(Request $request, Presentation $presentation, ?PresentationAsset $asset = null): void
    {
        abort_unless($presentation->isViewableBy($request->user()), 403);
        abort_if($asset && $asset->presentation_id !== $presentation->id, 404);
    }
}
