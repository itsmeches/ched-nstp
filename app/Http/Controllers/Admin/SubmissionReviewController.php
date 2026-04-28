<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use App\Services\Imports\SubmissionParserReportService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionReviewController extends Controller
{
    public function __construct(private readonly SubmissionParserReportService $submissionParserReportService)
    {
    }

    public function index(Request $request): Response
    {
        $filters = [
            'school' => $request->string('school')->toString(),
            'semester' => $request->string('semester')->toString(),
            'status' => $request->string('status')->toString(),
            'validation' => $request->string('validation')->toString(),
            'per_page' => max(5, min(50, $request->integer('per_page', 8))),
        ];

        $submissionQuery = Submission::query()
            ->with('user:id,name,email,school_name,school_code')
            ->withCount('students')
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

        if (in_array($filters['status'], ['draft', 'submitted'], true)) {
            $submissionQuery->where('status', $filters['status']);
        }

        if ($filters['validation'] === 'valid') {
            $submissionQuery->whereRaw(
                "COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(parsed_summary, '$.validation.invalid_count')) AS UNSIGNED), 0) = 0"
            );
        }

        if ($filters['validation'] === 'invalid') {
            $submissionQuery->whereRaw(
                "COALESCE(CAST(JSON_UNQUOTE(JSON_EXTRACT(parsed_summary, '$.validation.invalid_count')) AS UNSIGNED), 0) > 0"
            );
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
                ->with('user:id,name,email,school_name,school_code')
                ->with([
                    'students' => fn ($query) => $query->orderBy('full_name'),
                    'validationResults',
                ])
                ->find($selectedSubmissionId)
            : null;

        return Inertia::render('Admin/Submissions/Index', [
            'submissions' => $submissions,
            'selectedSubmission' => $selectedSubmission,
            'filters' => $filters,
        ]);
    }

    public function downloadParserReport(Request $request, Submission $submission): StreamedResponse
    {
        return $this->submissionParserReportService->download($submission, $request->boolean('invalid_only'));
    }
}