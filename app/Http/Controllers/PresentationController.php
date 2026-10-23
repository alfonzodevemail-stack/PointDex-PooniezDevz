<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Http\Controllers\Concerns\ImportsPresentationContent;
use App\Models\Presentation;
use App\Models\GestureSetting;
use App\Services\PresentationImporter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PresentationController extends Controller
{
    use ImportsPresentationContent;

    public function index(Request $request)
    {
        $presentations = $request->user()->presentations()
            ->with('assets')
            ->latest()
            ->get();

        return Inertia::render('Presentations/Index', [
            'presentations' => $presentations,
        ]);
    }

    public function show(Presentation $presentation, Request $request)
    {
        abort_unless($presentation->isViewableBy($request->user()), 403);

        $settings = GestureSetting::firstOrCreate(['user_id' => $request->user()->id]);

        return Inertia::render('Presentations/Show', [
            'presentation' => $presentation,
            'assets' => $presentation->assets()->get(),
            'contentAdded' => session('content_added'),
            'settings' => $settings,
        ]);
    }

    public function store(Request $request, PresentationImporter $importer)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            ...$this->contentRules(),
        ], $this->contentMessages());

        $presentation = $request->user()->presentations()->create([
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'slides_data' => [],
        ]);

        try {
            foreach ($this->importAssets($request, $presentation, $importer) as $asset) {
                $presentation->appendSlidesFor($asset);
            }
        } catch (ValidationException $e) {
            $presentation->delete();

            throw $e;
        }

        return redirect()->route('presentations.show', $presentation->id)
            ->with('success', 'Presentation created successfully!');
    }

    public function update(Request $request, Presentation $presentation)
    {
        abort_unless($presentation->isViewableBy($request->user()), 403);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $presentation->update($validated);

        return back()->with('success', 'Presentation updated!');
    }

    public function destroy(Presentation $presentation, Request $request, PresentationImporter $importer)
    {
        abort_unless($presentation->isViewableBy($request->user()), 403);

        foreach ($presentation->assets as $asset) {
            $importer->delete($asset->file_path);
        }
        $presentation->delete();

        return redirect()->route('presentations.index')->with('success', 'Presentation deleted.');
    }
}
