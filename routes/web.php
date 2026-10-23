<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PresentationController;
use App\Http\Controllers\PresentationContentController;
use App\Http\Controllers\PracticeController;
use App\Http\Controllers\TelemetryController;
use App\Http\Controllers\GestureSettingController;
use App\Http\Controllers\TwoFactorAuthenticationController;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::resource('presentations', PresentationController::class)->only([
        'index', 'show', 'store', 'update', 'destroy'
    ]);
    Route::post('/presentations/{presentation}/content', [PresentationContentController::class, 'store'])->name('presentations.content.store');
    Route::put('/presentations/{presentation}/slides', [PresentationContentController::class, 'reorder'])->name('presentations.slides.reorder');
    Route::delete('/presentations/{presentation}/slides/{key}', [PresentationContentController::class, 'destroySlide'])->name('presentations.slides.destroy');
    Route::get('/presentations/{presentation}/assets/{asset}/file', [PresentationContentController::class, 'file'])->name('presentations.assets.file');
    Route::post('/presentations/{presentation}/assets/{asset}/ready', [PresentationContentController::class, 'ready'])->name('presentations.assets.ready');
    Route::delete('/presentations/{presentation}/assets/{asset}', [PresentationContentController::class, 'destroyAsset'])->name('presentations.assets.destroy');

    // Telemetry runs in the logged-in session so every recorded session belongs to its user.
    Route::post('/telemetry/start', [TelemetryController::class, 'startSession'])->name('telemetry.start');
    Route::post('/telemetry/log', [TelemetryController::class, 'logGesture'])->name('telemetry.log');
    Route::post('/telemetry/end', [TelemetryController::class, 'endSession'])->name('telemetry.end');

    Route::get('/practice', [PracticeController::class, 'index'])->name('practice.index');
    Route::get('/analytics', [TelemetryController::class, 'analytics'])->name('analytics.index');
    Route::post('/settings', [GestureSettingController::class, 'update'])->name('settings.update');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/user/two-factor', [TwoFactorAuthenticationController::class, 'store'])->name('two-factor.enable');
    Route::post('/user/two-factor/confirm', [TwoFactorAuthenticationController::class, 'confirm'])->name('two-factor.confirm');
    Route::post('/user/two-factor/recovery-codes', [TwoFactorAuthenticationController::class, 'regenerateRecoveryCodes'])->name('two-factor.recovery-codes');
    Route::delete('/user/two-factor', [TwoFactorAuthenticationController::class, 'destroy'])->name('two-factor.disable');
});

require __DIR__.'/auth.php';
