<?php

namespace App\Http\Controllers\Ched;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use App\Models\User;
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
            'school_id' => $request->integer('school_id') ?: null,
        ];

        return Inertia::render('Ched/Dashboard', [
            'metrics' => $this->buildMetrics($filters),
            'trend' => $this->buildTrend($filters),
            'filters' => $filters,
            'schools' => $this->schoolOptions(),
            'semesters' => Submission::query()
                ->whereNotNull('semester')
                ->distinct()
                ->orderByDesc('semester')
                ->pluck('semester')
                ->values()
                ->all(),
        ]);
    }

    public function metrics(Request $request): JsonResponse
    {
        $filters = [
            'semester' => $request->string('semester')->toString(),
            'school_id' => $request->integer('school_id') ?: null,
        ];

        return response()->json([
            'metrics' => $this->buildMetrics($filters),
            'trend' => $this->buildTrend($filters),
        ]);
    }

    /**
     * @param array{semester:string,school_id:int|null} $filters
     * @return array<string,int>
     */
    private function buildMetrics(array $filters): array
    {
        $baseQuery = Submission::query();

        if ($filters['semester'] !== '') {
            $baseQuery->where('semester', $filters['semester']);
        }

        if ($filters['school_id'] !== null) {
            $baseQuery->where('user_id', $filters['school_id']);
        }

        $statusCounts = (clone $baseQuery)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $submitted = (int) ($statusCounts['submitted'] ?? 0);
        $underReview = (int) ($statusCounts['under_review'] ?? 0);
        $approved = (int) ($statusCounts['approved'] ?? 0);
        $rejected = (int) ($statusCounts['needs_correction'] ?? 0);

        return [
            'total_submissions' => (int) (clone $baseQuery)->count(),
            'pending_reviews' => $submitted + $underReview,
            'approved' => $approved,
            'rejected' => $rejected,
        ];
    }

    /**
     * @return array<int,array{id:int,name:string,school_code:string|null}>
     */
    private function schoolOptions(): array
    {
        return User::query()
            ->whereHas('role', fn ($query) => $query->where('name', 'school'))
            ->orderByRaw('COALESCE(school_name, name) asc')
            ->get(['id', 'name', 'school_name', 'school_code'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->school_name ?: $user->name,
                'school_code' => $user->school_code,
            ])
            ->values()
            ->all();
    }

    /**
     * @param array{semester:string,school_id:int|null} $filters
     * @return array<int,array<string,mixed>>
     */
    private function buildTrend(array $filters): array
    {
        $query = Submission::query();

        if ($filters['school_id'] !== null) {
            $query->where('user_id', $filters['school_id']);
        }

        $rows = $query
            ->whereNotNull('semester')
            ->selectRaw('semester, status, COUNT(*) as aggregate')
            ->groupBy('semester', 'status')
            ->orderBy('semester')
            ->get();

        return $rows
            ->groupBy('semester')
            ->map(function (Collection $semesterRows, string $semester): array {
                $counts = $semesterRows->pluck('aggregate', 'status');
                $submitted = (int) ($counts['submitted'] ?? 0);
                $underReview = (int) ($counts['under_review'] ?? 0);
                $approved = (int) ($counts['approved'] ?? 0);
                $rejected = (int) ($counts['needs_correction'] ?? 0);

                return [
                    'semester' => $semester,
                    'total_submissions' => (int) $semesterRows->sum('aggregate'),
                    'pending_reviews' => $submitted + $underReview,
                    'approved' => $approved,
                    'rejected' => $rejected,
                ];
            })
            ->values()
            ->all();
    }
}
