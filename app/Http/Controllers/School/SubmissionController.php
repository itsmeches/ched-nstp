<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use App\Services\Audit\AuditLogService;
use App\Services\Imports\SubmissionImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLogService,
        private readonly SubmissionImportService $submissionImportService,
    ) {
    }

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Submission::class);

        return Inertia::render('School/Submissions/Index', [
            'submissions' => Submission::query()
                ->where('user_id', $request->user()->id)
                ->withCount('serialNumbers')
                ->with([
                    'students' => fn ($query) => $query
                        ->select(['id', 'submission_id', 'full_name'])
                        ->with('serialNumber:id,student_id,serial_number,issued_at')
                        ->orderBy('full_name'),
                ])
                ->latest()
                ->get(['id', 'semester', 'status', 'files', 'parsed_summary', 'parsed_at', 'submitted_at', 'created_at']),
            'school' => [
                'name' => $request->user()?->school_name,
                'code' => $request->user()?->school_code,
                'approval_status' => $request->user()?->approval_status,
            ],
            'statusOptions' => ['draft', 'submitted'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Submission::class);

        $validated = $request->validate([
            'semester' => 'required|string|max:120',
            'nstp_1_enrollment' => 'nullable|file|mimes:xlsx,csv|max:20480',
            'nstp_2_enrollment' => 'nullable|file|mimes:xlsx,csv|max:20480',
            'graduates_list' => 'nullable|file|mimes:xlsx,csv|max:20480',
            'transferee_proof' => 'nullable|file|mimes:pdf,jpg,jpeg,png,doc,docx|max:20480',
            'status' => 'required|in:draft,submitted',
        ]);

        if (! $request->hasFile('nstp_1_enrollment')
            && ! $request->hasFile('nstp_2_enrollment')
            && ! $request->hasFile('graduates_list')) {
            return back()->withErrors([
                'files' => 'Upload at least one file: NSTP 1 Enrollment, NSTP 2 Enrollment, or Graduates List (Form 2B).',
            ]);
        }

        $basePath = sprintf(
            'submissions/%s/%s/%s',
            $request->user()->school_code ?? 'school-'.$request->user()->id,
            Str::slug($validated['semester']),
            now()->format('YmdHis').'-'.Str::random(8),
        );

        $storedFiles = [];
        $replacedFilePaths = [];

        $existingDraft = Submission::query()
            ->where('user_id', $request->user()->id)
            ->where('semester', $validated['semester'])
            ->whereIn('status', ['draft', 'needs_correction'])
            ->latest('id')
            ->first();

        $existingFiles = $existingDraft?->files ?? [];

        foreach ([
            'nstp_1_enrollment' => 'NSTP 1 Enrollment',
            'nstp_2_enrollment' => 'NSTP 2 Enrollment',
            'graduates_list' => 'Graduates List (Form 2B)',
            'transferee_proof' => 'Transferee Proof (TOR / Equivalent)',
        ] as $field => $label) {
            if (! $request->hasFile($field)) {
                continue;
            }

            $file = $request->file($field);

            if ($existingDraft !== null && filled(Arr::get($existingFiles, $field.'.path'))) {
                $replacedFilePaths[] = Arr::get($existingFiles, $field.'.path');
            }

            $storedFiles[$field] = [
                'label' => $label,
                'original_name' => $file->getClientOriginalName(),
                'path' => $file->store($basePath, 'local'),
            ];
        }

        $mergedFiles = array_replace($existingFiles, $storedFiles);

        try {
            $submission = DB::transaction(function () use ($existingDraft, $mergedFiles, $request, $validated) {
                if ($existingDraft !== null) {
                    $existingDraft->update([
                        'status' => $validated['status'],
                        'files' => $mergedFiles,
                        'submitted_at' => $validated['status'] === 'submitted' ? now() : null,
                        'reviewed_at' => null,
                        'reviewed_by' => null,
                        'review_notes' => null,
                    ]);

                    $this->submissionImportService->importStudents($existingDraft);

                    if ($validated['status'] === 'submitted') {
                        $this->ensureTransfereeProofForSubmitted($existingDraft);
                    }

                    return $existingDraft->fresh();
                }

                $submission = Submission::query()->create([
                    'user_id' => $request->user()->id,
                    'semester' => $validated['semester'],
                    'status' => $validated['status'],
                    'files' => $mergedFiles,
                    'submitted_at' => $validated['status'] === 'submitted' ? now() : null,
                    'reviewed_at' => null,
                    'reviewed_by' => null,
                    'review_notes' => null,
                ]);

                $this->submissionImportService->importStudents($submission);

                if ($validated['status'] === 'submitted') {
                    $this->ensureTransfereeProofForSubmitted($submission);
                }

                return $submission->fresh();
            });
        } catch (ValidationException $exception) {
            foreach ($storedFiles as $fileMeta) {
                if (! empty($fileMeta['path'])) {
                    Storage::disk('local')->delete($fileMeta['path']);
                }
            }

            return back()->withErrors($exception->errors());
        } catch (Throwable $exception) {
            foreach ($storedFiles as $fileMeta) {
                if (! empty($fileMeta['path'])) {
                    Storage::disk('local')->delete($fileMeta['path']);
                }
            }

            report($exception);

            return back()->withErrors([
                'files' => 'The file upload succeeded, but the spreadsheet could not be parsed. Please verify the form structure and try again.',
            ]);
        }

        foreach ($replacedFilePaths as $replacedFilePath) {
            Storage::disk('local')->delete($replacedFilePath);
        }

        $this->auditLogService->record(
            $request->user(),
            $existingDraft !== null ? 'school.submission.updated' : 'school.submission.created',
            $submission,
            [
                'status' => $submission->status,
                'semester' => $submission->semester,
                'file_count' => count($submission->files ?? []),
                'student_count' => data_get($submission->parsed_summary, 'overall.student_count', 0),
                'duplicate_rows' => data_get($submission->parsed_summary, 'overall.duplicate_rows', 0),
                'replaced_existing_draft' => $existingDraft !== null,
            ],
        );

        return to_route('school.submissions.index')->with(
            'success',
            $existingDraft !== null
                ? 'Draft submission replaced and parsed successfully.'
                : 'Submission saved and parsed successfully.',
        );
    }

    public function submit(Request $request, Submission $submission): RedirectResponse
    {
        $this->authorize('submit', $submission);

        $this->ensureTransfereeProofForSubmitted($submission);

        $submission->update([
            'status' => 'submitted',
            'submitted_at' => now(),
            'reviewed_at' => null,
            'reviewed_by' => null,
            'review_notes' => null,
        ]);

        $this->auditLogService->record(
            $request->user(),
            'school.submission.submitted',
            $submission,
            [
                'semester' => $submission->semester,
            ],
        );

        return to_route('school.submissions.index')->with('success', 'Submission moved to submitted status.');
    }

    private function ensureTransfereeProofForSubmitted(Submission $submission): void
    {
        $hasTransferee = $submission->students()
            ->where('is_transferee', true)
            ->exists();

        if (! $hasTransferee) {
            return;
        }

        $hasProof = filled(data_get($submission->files, 'transferee_proof.path'));

        if ($hasProof) {
            return;
        }

        throw ValidationException::withMessages([
            'transferee_proof' => 'Transferee proof (TOR or equivalent) is required before submitting when transferee students are present.',
        ]);
    }
}