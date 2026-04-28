<?php

namespace App\Services\Auth;

use App\Models\User;

class RoleService
{
    public function defaultRegistrationRole(): string
    {
        return 'school';
    }

    public function dashboardRouteName(User $user): string
    {
        return match ($user->role?->name) {
            'admin', 'superadmin' => 'admin.dashboard',
            'ched_staff' => 'ched.dashboard',
            default => 'school.dashboard',
        };
    }
}