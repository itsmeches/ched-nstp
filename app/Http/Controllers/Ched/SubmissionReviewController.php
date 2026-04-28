<?php

namespace App\Http\Controllers\Ched;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use App\Services\Audit\AuditLogService;
use App\Services\Serials\GenerateSerialNumberService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionReviewController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService,
        private readonly GenerateSerialNumberService $generateSerialNumberService,
    ) {
    }

    public function index(Request $request): Response
    {
        $filters = [
            'school' => $request->string('school')->toString(),
            'semester' => $request->string('semester')->toString(),
            'status' => $request->string('status')->toString(),
            'per_page' => max(5, min(50, $request->integer('per_page', 8))),
        ];

        $submissionQuery = Submission::query()
            ->with('user:id,name,email,school_name,school_code')
            ->withCount('students')
            ->whereIn('status', ['submitted', 'under_review', 'needs_correction', 'approved'])
            ->latest();

        if ($filters['school'] !== '') {
            $submissionQuery->whereHas('user', function ($query) use ($filters) {
                $query
                    ->where('school_name', 'like', '%'.$filters['school'].'%')
                    ->orWhere('school_code', 'like', '%'.$filters['school'].'%')
                    ->orWhere('name', 'like', '%'.$filters['school'].'%');
            });
        }

        if ($filters['semester'] !== '') {
            $submissionQuery->where('semester', 'like', '%'.$filters['semester'].'%');
        }

        if (in_array($filters['status'], ['submitted', 'under_review', 'needs_correction', 'approved'], true)) {
            $submissionQuery->where('status', $filters['status']);
        }

        $submissions = $submissionQuery
            ->paginate($filters['per_page'])
            ->withQueryString();

        $selectedSubmissionId = $request->integer('submission');

        if (! $selectedSubmissionId) {
            $selectedSubmissionId = $submissions->getCollection()->first()?->id;
        }

        $selectedSubmission = $selectedSubmissionId
            ? Submission::query()
                ->with([
                    'user:id,name,email,school_name,school_code',
                    'reviewer:id,name,email',
                    'students' => fn ($query) => $query->with('serialNumber')->orderBy('full_name'),
                    'validationResults',
                ])
                ->find($selectedSubmissionId)
            : null;

        return Inertia::render('Ched/Submissions/Index', [
            'submissions' => $submissions,
            'selectedSubmission' => $selectedSubmission,
            'filters' => $filters,
        ]);
    }

    public function transition(Request $request, Submission $submission): RedirectResponse
    {
        $validated = $request->validate([
            'target_status' => 'required|in:under_review,needs_correction,approved',
            'review_notes' => 'nullable|string|max:1000',
        ]);

        $targetStatus = $validated['target_status'];
        $allowedTransitions = [
            'submitted' => ['under_review', 'needs_correction', 'approved'],
            'under_review' => ['needs_correction', 'approved'],
            'needs_correction' => [],
            'approved' => [],
            'draft' => [],
        ];

        if (! in_array($targetStatus, $allowedTransitions[$submission->status] ?? [], true)) {
            throw ValidationException::withMessages([
                'target_status' => sprintf('Cannot transition submission from %s to %s.', $submission->status, $targetStatus),
            ]);
        }

        if ($targetStatus === 'needs_correction' && blank($validated['review_notes'] ?? null)) {
            throw ValidationException::withMessages([
                'review_notes' => 'Revision notes are required when requesting correction.',
            ]);
        }

        $serialSummary = ['generated_count' => 0, 'region_code' => '00'];

        DB::transaction(function () use ($submission, $targetStatus, $validated, $request, &$serialSummary): void {
            $submission->update([
                'status' => $targetStatus,
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
                'review_notes' => $validated['review_notes'] ?? null,
            ]);

            if ($targetStatus === 'approved') {
                $serialSummary = $this->generateSerialNumberService->generateForSubmission($submission->fresh());
            }
        });

        $this->auditLogService->record(
            $request->user(),
            'ched.submission.status_changed',
            $submission,
            [
                'target_status' => $targetStatus,
                'semester' => $submission->semester,
                'serial_generated_count' => $serialSummary['generated_count'],
                'serial_region_code' => $serialSummary['region_code'],
            ],
        );

        return back()->with('success', 'Submission status updated successfully.');
    }
}
