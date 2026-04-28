<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\SchoolApprovalController;
use App\Http\Controllers\Admin\SubmissionReviewController;
use App\Http\Controllers\Ched\DashboardController as ChedDashboardController;
use App\Http\Controllers\Ched\SubmissionReviewController as ChedSubmissionReviewController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\School\DashboardController as SchoolDashboardController;
use App\Http\Controllers\School\SubmissionController as SchoolSubmissionController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified', 'role:admin,superadmin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', AdminDashboardController::class)->name('dashboard');
    Route::get('/school-approvals', [SchoolApprovalController::class, 'index'])->name('school-approvals.index');
    Route::patch('/school-approvals/{user}/approve', [SchoolApprovalController::class, 'approve'])->name('school-approvals.approve');
    Route::patch('/school-approvals/{user}/reject', [SchoolApprovalController::class, 'reject'])->name('school-approvals.reject');
    Route::get('/submissions', [SubmissionReviewController::class, 'index'])->name('submissions.index');
    Route::get('/submissions/{submission}/parser-report', [SubmissionReviewController::class, 'downloadParserReport'])->name('submissions.report');
});

Route::middleware(['auth', 'verified', 'role:admin,superadmin,ched_staff'])->prefix('ched')->name('ched.')->group(function () {
    Route::get('/dashboard', ChedDashboardController::class)->name('dashboard');
    Route::get('/dashboard/metrics', [ChedDashboardController::class, 'metrics'])->name('dashboard.metrics');
    Route::get('/submissions', [ChedSubmissionReviewController::class, 'index'])->name('submissions.index');
    Route::patch('/submissions/{submission}/transition', [ChedSubmissionReviewController::class, 'transition'])->name('submissions.transition');
    Route::get('/submissions/{submission}/parser-report', [ChedSubmissionReviewController::class, 'downloadParserReport'])->name('submissions.report');
});

Route::middleware(['auth', 'verified', 'role:school'])->prefix('school')->name('school.')->group(function () {
    Route::get('/dashboard', SchoolDashboardController::class)->name('dashboard');
    Route::get('/dashboard/metrics', [SchoolDashboardController::class, 'metrics'])->name('dashboard.metrics');

    Route::middleware('school.approved')->group(function () {
        Route::get('/submissions', [SchoolSubmissionController::class, 'index'])->name('submissions.index');
        Route::post('/submissions', [SchoolSubmissionController::class, 'store'])->name('submissions.store');
        Route::patch('/submissions/{submission}/submit', [SchoolSubmissionController::class, 'submit'])->name('submissions.submit');
        Route::get('/submissions/{submission}/parser-report', [SchoolSubmissionController::class, 'downloadParserReport'])->name('submissions.report');
    });
});

require __DIR__.'/auth.php';
