<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Presentation;
use App\Services\PresentationImporter;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

trait ImportsPresentationContent
{
    protected function contentRules(): array
    {
        return [
            'source' => 'required|string|in:file,link',
            'files' => 'required_if:source,file|nullable|array|max:50',
            'files.*' => 'file|extensions:'.implode(',', PresentationImporter::EXTENSIONS).'|max:'.(PresentationImporter::MAX_BYTES / 1024),
            'presentation_url' => 'required_if:source,link|nullable|url:http,https|max:2048',
        ];
    }

    protected function contentMessages(): array
    {
        return [
            'files.required_if' => 'Choose at least one PowerPoint, PDF or picture to upload.',
            'files.max' => 'You can upload up to 50 files at a time.',
            'files.*.extensions' => 'Only PowerPoint (.pptx, .ppt), PDF and picture (.jpg, .png, .gif, .webp) files are supported.',
            'files.*.max' => 'Each file must be 100 MB or smaller.',
            'presentation_url.required_if' => 'Paste a link to your presentation.',
        ];
    }

    /**
     * Store the uploaded files (or the linked file) as assets and add their slides to the end of the deck.
     */
    protected function importContent(Request $request, Presentation $presentation, PresentationImporter $importer): void
    {
        $imported = [];

        try {
            if ($request->input('source') === 'link') {
                $imported[] = $importer->importLink($request->input('presentation_url'));
            } else {
                foreach ($request->file('files', []) as $file) {
                    $imported[] = $importer->importUpload($file);
                }
            }
        } catch (ValidationException $e) {
            foreach ($imported as $attributes) {
                $importer->delete($attributes['file_path']);
            }

            throw $e;
        }

        // Pictures are one slide each; PDF and PowerPoint pages are counted by the browser,
        // so they hold their place with a placeholder until then.
        foreach ($imported as $attributes) {
            $presentation->appendSlidesFor($presentation->assets()->create($attributes));
        }
    }
}
