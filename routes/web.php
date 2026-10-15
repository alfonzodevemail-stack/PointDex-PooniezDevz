<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PresentationController;
use App\Http\Controllers\PracticeController;
use App\Http\Controllers\TelemetryController;
use App\Http\Controllers\GestureSettingController;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

Route::resource('presentations', PresentationController::class)->only([
    'index', 'show', 'store', 'update', 'destroy'
]);

Route::get('/practice', [PracticeController::class, 'index'])->name('practice.index');
Route::get('/analytics', [TelemetryController::class, 'analytics'])->name('analytics.index');
Route::post('/settings', [GestureSettingController::class, 'update'])->name('settings.update');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
