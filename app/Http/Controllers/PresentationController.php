<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Presentation;
use App\Models\GestureSetting;
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
        $userId = $request->user()?->id;
        $settings = $userId 
            ? GestureSetting::firstOrCreate(['user_id' => $userId]) 
            : (GestureSetting::first() ?? new GestureSetting());

        return Inertia::render('Presentations/Show', [
            'presentation' => $presentation,
            'settings' => $settings,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'aspect_ratio' => 'nullable|string|in:16:9,4:3',
            'presentation_url' => 'nullable|url',
            'slides_data' => 'nullable|array',
        ]);

        if (empty($validated['slides_data']) && empty($validated['presentation_url'])) {
            $validated['slides_data'] = [
                [
                    'id' => 1,
                    'title' => $validated['title'],
                    'subtitle' => 'Created with PointDex',
                    'bullets' => ['First slide', 'Navigate with Swipe Right / Left'],
                ]
            ];
        }

        $presentation = $request->user() 
            ? $request->user()->presentations()->create($validated)
            : Presentation::create($validated);

        return redirect()->route('presentations.show', $presentation->id)
            ->with('success', 'Presentation created successfully!');
    }

    public function update(Request $request, Presentation $presentation)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'aspect_ratio' => 'nullable|string|in:16:9,4:3',
            'presentation_url' => 'nullable|url',
            'slides_data' => 'nullable|array',
        ]);

        $presentation->update($validated);

        return back()->with('success', 'Presentation updated!');
    }

    public function destroy(Presentation $presentation)
    {
        $presentation->delete();
        return redirect()->route('presentations.index')->with('success', 'Presentation deleted.');
    }
}
