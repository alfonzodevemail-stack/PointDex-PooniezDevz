<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Presentation;
use App\Models\GestureSetting;
use App\Services\PresentationImporter;
use Inertia\Inertia;

class PresentationController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()?->id;

        $presentations = Presentation::when($userId, function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhere('is_sample', true);
        }, function ($q) {
            $q->where('is_sample', true);
        })->latest()->get();

        return Inertia::render('Presentations/Index', [
            'presentations' => $presentations,
        ]);
    }

    public function show(Presentation $presentation, Request $request)
    {
        abort_unless($presentation->isViewableBy($request->user()), 403);

        $userId = $request->user()?->id;
        $settings = $userId
            ? GestureSetting::firstOrCreate(['user_id' => $userId])
            : (GestureSetting::first() ?? new GestureSetting());

        return Inertia::render('Presentations/Show', [
            'presentation' => $presentation,
            'fileUrl' => $presentation->file_path ? route('presentations.file', $presentation) : null,
            'settings' => $settings,
        ]);
    }

    public function file(Presentation $presentation, Request $request, PresentationImporter $importer)
    {
        abort_unless($presentation->isViewableBy($request->user()) && $presentation->file_path, 404);

        $contentType = $presentation->source_type === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

        return response()->file($importer->absolutePath($presentation->file_path), [
            'Content-Type' => $contentType,
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    public function store(Request $request, PresentationImporter $importer)
    {
        $validated = $request->validate([
            'source' => 'nullable|string|in:blank,file,link',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'aspect_ratio' => 'nullable|string|in:16:9,4:3',
            'file' => 'required_if:source,file|nullable|file|extensions:pptx,ppt,pdf|max:'.(PresentationImporter::MAX_BYTES / 1024),
            'presentation_url' => 'required_if:source,link|nullable|url:http,https|max:2048',
            'slides_data' => 'nullable|array',
        ], [
            'file.required_if' => 'Choose a PowerPoint or PDF file to upload.',
            'file.extensions' => 'Only .pptx, .ppt and .pdf files are supported.',
            'file.max' => 'The file must be 100 MB or smaller.',
            'presentation_url.required_if' => 'Paste a link to your presentation.',
        ]);

        $source = $validated['source'] ?? 'blank';
        unset($validated['source'], $validated['file']);

        if ($source === 'file') {
            $validated = [...$validated, ...$importer->importUpload($request->file('file'))];
        } elseif ($source === 'link') {
            $validated = [...$validated, ...$importer->importLink($validated['presentation_url'])];
        } elseif (empty($validated['slides_data'])) {
            $validated['slides_data'] = [
                [
                    'id' => 1,
                    'title' => $validated['title'],
                    'subtitle' => 'Created with PointDex',
                    'bullets' => ['First slide', 'Navigate with Swipe Right / Left'],
                ]
            ];
        }

        $presentation = $request->user()->presentations()->create($validated);

        return redirect()->route('presentations.show', $presentation->id)
            ->with('success', 'Presentation created successfully!');
    }

    public function update(Request $request, Presentation $presentation)
    {
        abort_unless($presentation->user_id === $request->user()->id, 403);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'aspect_ratio' => 'nullable|string|in:16:9,4:3',
            'slides_data' => 'nullable|array',
        ]);

        $presentation->update($validated);

        return back()->with('success', 'Presentation updated!');
    }

    public function destroy(Presentation $presentation, Request $request, PresentationImporter $importer)
    {
        abort_unless($presentation->user_id === $request->user()->id, 403);

        $importer->delete($presentation->file_path);
        $presentation->delete();

        return redirect()->route('presentations.index')->with('success', 'Presentation deleted.');
    }
}
