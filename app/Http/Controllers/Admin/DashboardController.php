<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $pendingSchools = User::query()
            ->whereHas('role', fn ($query) => $query->where('name', 'school'))
            ->where('approval_status', 'pending')
            ->count();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                ['label' => 'Pending school approvals', 'value' => (string) $pendingSchools],
                ['label' => 'Total submissions', 'value' => (string) Submission::query()->count()],
                ['label' => 'Submitted records', 'value' => (string) Submission::query()->where('status', 'submitted')->count()],
            ],
        ]);
    }
}