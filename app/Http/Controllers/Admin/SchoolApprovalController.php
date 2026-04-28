<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Audit\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolApprovalController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLogService)
    {
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        return Inertia::render('Admin/SchoolApprovals/Index', [
            'schools' => User::query()
                ->whereHas('role', fn ($query) => $query->where('name', 'school'))
                ->orderByRaw("FIELD(approval_status, 'pending', 'rejected', 'approved')")
                ->orderByDesc('created_at')
                ->get([
                    'id',
                    'name',
                    'email',
                    'school_name',
                    'school_code',
                    'approval_status',
                    'approved_at',
                ]),
        ]);
    }

    public function approve(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $user->update([
            'approval_status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        $this->auditLogService->record(
            $request->user(),
            'admin.school.approved',
            $user,
            ['school_code' => $user->school_code],
        );

        return back()->with('success', 'School account approved.');
    }

    public function reject(Request $request, User $user): RedirectResponse
    {
        $this->authorize('update', $user);

        $user->update([
            'approval_status' => 'rejected',
            'approved_at' => null,
            'approved_by' => $request->user()->id,
        ]);

        $this->auditLogService->record(
            $request->user(),
            'admin.school.rejected',
            $user,
            ['school_code' => $user->school_code],
        );

        return back()->with('success', 'School account rejected.');
    }
}