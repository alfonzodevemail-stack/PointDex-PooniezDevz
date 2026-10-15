<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\TelemetryController;
use App\Http\Controllers\GestureSettingController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('telemetry')->group(function () {
    Route::post('/start', [TelemetryController::class, 'startSession']);
    Route::post('/log', [TelemetryController::class, 'logGesture']);
    Route::post('/end', [TelemetryController::class, 'endSession']);
});

Route::post('/settings', [GestureSettingController::class, 'update']);
