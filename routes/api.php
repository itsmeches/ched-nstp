<?php

use App\Http\Controllers\Api\V1\SystemHealthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {
    Route::get('/system/health', SystemHealthController::class)->name('system.health');
});
