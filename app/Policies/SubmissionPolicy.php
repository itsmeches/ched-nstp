<?php

namespace App\Policies;

use App\Models\Submission;
use App\Models\User;

class SubmissionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole('school');
    }

    public function create(User $user): bool
    {
        return $user->canSubmitNstpFiles();
    }

    public function update(User $user, Submission $submission): bool
    {
        return $user->id === $submission->user_id
            && in_array($submission->status, ['draft', 'needs_correction'], true)
            && $user->canSubmitNstpFiles();
    }

    public function submit(User $user, Submission $submission): bool
    {
        return $this->update($user, $submission);
    }
}