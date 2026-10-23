<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ImportsPresentationContent;
use App\Models\Presentation;
use App\Models\PresentationAsset;
use App\Services\PresentationImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Editing a deck's content. Uploaded files are kept with the presentation (its library)
 * so removed slides can be added back; the slide order only changes when the user saves.
 */
class PresentationContentController extends Controller
{
    use ImportsPresentationContent;

    /**
     * Upload files or import a link into the presentation's library.
     * The page then adds the new slides to its unsaved working copy.
     */
    public function store(Request $request, Presentation $presentation, PresentationImporter $importer)
    {
        $this->authorizeOwner($request, $presentation);

        $request->validate([
            'replace' => 'nullable|boolean',
            ...$this->contentRules(),
        ], $this->contentMessages());

        $assets = $this->importAssets($request, $presentation, $importer);

        return back()->with('content_added', [
            'asset_ids' => $assets->pluck('id')->all(),
            'replace' => $request->boolean('replace'),
            'nonce' => Str::random(8),
        ]);
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
     * The browser reports how many pages a PDF / PowerPoint has; a saved placeholder
     * slide for it is swapped for its real slides.
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

    /**
     * Permanently delete a file from the library, along with any saved slides that use it.
     */
    public function destroyAsset(Request $request, Presentation $presentation, PresentationAsset $asset, PresentationImporter $importer): JsonResponse
    {
        $this->authorizeOwner($request, $presentation, $asset);

        $presentation->update([
            'slides_data' => collect($presentation->slides_data)
                ->reject(fn ($slide) => $slide['asset_id'] === $asset->id)
                ->values()
                ->all(),
        ]);
        $importer->delete($asset->file_path);
        $asset->delete();

        return $this->content($presentation);
    }

    /**
     * Save the working slide list: its order, removed slides and slides added back.
     */
    public function save(Request $request, Presentation $presentation): JsonResponse
    {
        $this->authorizeOwner($request, $presentation);

        $validated = $request->validate([
            'slides' => 'present|array|max:2000',
            'slides.*.key' => 'required|string|max:40|distinct',
            'slides.*.asset_id' => 'required|integer',
            'slides.*.page' => 'nullable|integer|min:0',
        ]);

        $assets = $presentation->assets()->get()->keyBy('id');
        $slides = [];

        foreach ($validated['slides'] as $index => $slide) {
            $asset = $assets->get($slide['asset_id']);
            $page = $slide['page'] ?? null;

            $valid = $asset && ($asset->page_count === null
                ? $page === null
                : $page !== null && $page < $asset->page_count);

            if (! $valid) {
                throw ValidationException::withMessages([
                    "slides.$index" => 'One of the slides no longer exists. Reload the page and try again.',
                ]);
            }

            $slides[] = ['key' => $slide['key'], 'asset_id' => $asset->id, 'page' => $page];
        }

        $presentation->update(['slides_data' => $slides]);

        return $this->content($presentation);
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
