<?php

namespace App\Policies;

use App\Models\User;

class SchoolApprovalPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasRole('superadmin');
    }

    public function update(User $user, User $schoolUser): bool
    {
        return ($user->hasRole('admin') || $user->hasRole('superadmin')) && $schoolUser->hasRole('school');
    }
}