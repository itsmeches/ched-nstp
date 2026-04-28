<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\SerialNumber;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $filters = [
            'semester' => $request->string('semester')->toString(),
        ];

        $metrics = $this->buildMetrics($request->user()->id, $filters['semester']);

        return Inertia::render('School/Dashboard', [
            'metrics' => $metrics,
            'trend' => $this->buildTrend($request->user()->id),
            'filters' => $filters,
            'semesters' => Submission::query()
                ->where('user_id', $request->user()->id)
                ->whereNotNull('semester')
                ->distinct()
                ->orderByDesc('semester')
                ->pluck('semester')
                ->values()
                ->all(),
            'school' => [
                'name' => $request->user()?->school_name,
                'code' => $request->user()?->school_code,
                'approval_status' => $request->user()?->approval_status,
            ],
        ]);
    }

    public function metrics(Request $request): JsonResponse
    {
        $semester = $request->string('semester')->toString();

        return response()->json([
            'metrics' => $this->buildMetrics($request->user()->id, $semester),
            'trend' => $this->buildTrend($request->user()->id),
        ]);
    }

    /**
     * @return array<string,mixed>
     */
    private function buildMetrics(int $userId, string $semester): array
    {
        $submissionQuery = Submission::query()->where('user_id', $userId);

        if ($semester !== '') {
            $submissionQuery->where('semester', $semester);
        }

        $statusCounts = (clone $submissionQuery)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $submissions = (clone $submissionQuery)
            ->select(['id', 'status', 'parsed_summary', 'submitted_at'])
            ->latest('id')
            ->get();

        $invalidCount = $submissions->sum(fn (Submission $submission) => (int) data_get($submission->parsed_summary, 'validation.invalid_count', 0));

        $serialQuery = SerialNumber::query()
            ->whereHas('submission', function ($query) use ($userId, $semester) {
                $query->where('user_id', $userId);

                if ($semester !== '') {
                    $query->where('semester', $semester);
                }
            });

        return [
            'total_submissions' => (int) $submissions->count(),
            'errors_found' => $invalidCount,
            'serial_numbers_issued' => (int) $serialQuery->count(),
            'status_breakdown' => [
                'draft' => (int) ($statusCounts['draft'] ?? 0),
                'submitted' => (int) ($statusCounts['submitted'] ?? 0),
                'under_review' => (int) ($statusCounts['under_review'] ?? 0),
                'needs_correction' => (int) ($statusCounts['needs_correction'] ?? 0),
                'approved' => (int) ($statusCounts['approved'] ?? 0),
            ],
            'latest_submission_status' => $submissions->first()?->status,
        ];
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function buildTrend(int $userId): array
    {
        $statusRows = Submission::query()
            ->where('user_id', $userId)
            ->whereNotNull('semester')
            ->selectRaw('semester, status, COUNT(*) as aggregate')
            ->groupBy('semester', 'status')
            ->orderBy('semester')
            ->get();

        $errorRows = Submission::query()
            ->where('user_id', $userId)
            ->whereNotNull('semester')
            ->select(['semester', 'parsed_summary'])
            ->get()
            ->groupBy('semester')
            ->map(fn (Collection $semesterRows): int => (int) $semesterRows->sum(
                fn (Submission $submission): int => (int) data_get($submission->parsed_summary, 'validation.invalid_count', 0),
            ));

        $serialRows = SerialNumber::query()
            ->join('submissions', 'submissions.id', '=', 'serial_numbers.submission_id')
            ->where('submissions.user_id', $userId)
            ->whereNotNull('submissions.semester')
            ->selectRaw('submissions.semester as semester, COUNT(serial_numbers.id) as aggregate')
            ->groupBy('submissions.semester')
            ->pluck('aggregate', 'semester');

        return $statusRows
            ->groupBy('semester')
            ->map(function (Collection $semesterRows, string $semester) use ($errorRows, $serialRows): array {
                $counts = $semesterRows->pluck('aggregate', 'status');

                return [
                    'semester' => $semester,
                    'total_submissions' => (int) $semesterRows->sum('aggregate'),
                    'errors_found' => (int) ($errorRows[$semester] ?? 0),
                    'serial_numbers_issued' => (int) ($serialRows[$semester] ?? 0),
                    'approved' => (int) ($counts['approved'] ?? 0),
                    'needs_correction' => (int) ($counts['needs_correction'] ?? 0),
                ];
            })
            ->values()
            ->all();
    }
}