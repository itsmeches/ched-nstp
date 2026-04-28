<?php

namespace App\Providers;

use App\Models\Submission;
use App\Models\User;
use App\Policies\SchoolApprovalPolicy;
use App\Policies\SubmissionPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Submission::class, SubmissionPolicy::class);
        Gate::policy(User::class, SchoolApprovalPolicy::class);

        Vite::prefetch(concurrency: 3);
    }
}
