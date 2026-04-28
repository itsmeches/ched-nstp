<?php

namespace App\Services\Audit;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditLogService
{
    /**
     * @param array<string, mixed> $metadata
     */
    public function record(User $user, string $action, ?Model $auditable = null, array $metadata = []): AuditLog
    {
        return AuditLog::query()->create([
            'user_id' => $user->id,
            'action' => $action,
            'auditable_type' => $auditable ? $auditable::class : null,
            'auditable_id' => $auditable?->getKey(),
            'metadata' => $metadata,
        ]);
    }
}