<?php

namespace App\Services\Validation;

use App\Models\Submission;
use App\Models\ValidationResult;
use Illuminate\Support\Collection;

class ValidateSubmissionService
{
    public function validate(Submission $submission): array
    {
        $submission->loadMissing('user');
        $students = $submission->students()->get();
        $hasTransfereeProof = filled(data_get($submission->files, 'transferee_proof.path'));

        $sourceBuckets = [
            'nstp_1_enrollment' => collect(),
            'nstp_2_enrollment' => collect(),
            'graduates_list' => collect(),
        ];

        foreach (array_keys($sourceBuckets) as $sourceFile) {
            $sourceBuckets[$sourceFile] = $students
                ->where('source_file', $sourceFile)
                ->groupBy(fn ($student) => $this->matchKey($student->full_name, $student->birthdate?->format('Y-m-d')));
        }

        ValidationResult::query()
            ->where('submission_id', $submission->id)
            ->delete();

        $records = [];
        $validCount = 0;
        $invalidCount = 0;
        $fuzzyMatchedCount = 0;
        $issueCounts = [];

        foreach ($students as $student) {
            $key = $this->matchKey($student->full_name, $student->birthdate?->format('Y-m-d'));
            $issues = [];

            $inNstp1 = $sourceBuckets['nstp_1_enrollment']->has($key);
            $inNstp2 = $sourceBuckets['nstp_2_enrollment']->has($key);
            $inForm2b = $sourceBuckets['graduates_list']->has($key);
            $isSchoolMismatch = ! $inNstp1 && ($inNstp2 || $inForm2b);

            if ($isSchoolMismatch && ! $student->is_transferee) {
                $issues[] = [
                    'code' => 'transferee_flag_required',
                    'message' => 'Student appears to have NSTP records from another school. Mark as transferee and provide proof.',
                ];
            }

            if ($isSchoolMismatch && $student->is_transferee && ! $hasTransfereeProof) {
                $issues[] = [
                    'code' => 'transferee_proof_required',
                    'message' => 'Transferee proof (TOR or equivalent) is required for cross-school NSTP records.',
                ];
            }

            if (! $inNstp1 && ! ($isSchoolMismatch && $student->is_transferee && $hasTransfereeProof)) {
                $issues[] = [
                    'code' => 'missing_nstp_1',
                    'message' => 'Student was not found in NSTP 1.',
                ];
            }

            if (! $inNstp2) {
                $issues[] = [
                    'code' => 'missing_nstp_2',
                    'message' => 'Student was not found in NSTP 2.',
                ];
            }

            if (! $inForm2b) {
                $issues[] = [
                    'code' => 'missing_form_2b',
                    'message' => 'Student was not found in Form 2B.',
                ];
            }

            foreach (['nstp_1_enrollment', 'nstp_2_enrollment', 'graduates_list'] as $sourceFile) {
                $duplicateCount = $sourceBuckets[$sourceFile]->get($key, collect())->count();

                if ($duplicateCount > 1) {
                    $issues[] = [
                        'code' => 'duplicate_student',
                        'source_file' => $sourceFile,
                        'count' => $duplicateCount,
                        'message' => sprintf('Student appears %d times in %s.', $duplicateCount, $sourceFile),
                    ];
                }
            }

            $fuzzyMatches = $this->fuzzyMatches($student, $sourceBuckets);

            if ($fuzzyMatches->isNotEmpty()) {
                $issues[] = [
                    'code' => 'name_mismatch_possible',
                    'message' => 'Possible name variation detected for the same birthdate.',
                    'matches' => $fuzzyMatches->values()->all(),
                ];
                $fuzzyMatchedCount++;
            }

            $status = $issues === [] ? 'valid' : 'invalid';

            if ($status === 'valid') {
                $validCount++;
            } else {
                $invalidCount++;

                foreach ($issues as $issue) {
                    $code = (string) ($issue['code'] ?? 'unknown_issue');
                    $issueCounts[$code] = ($issueCounts[$code] ?? 0) + 1;
                }
            }

            $records[] = [
                'submission_id' => $submission->id,
                'student_id' => $student->id,
                'status' => $status,
                'issues' => json_encode($issues, JSON_THROW_ON_ERROR),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        if ($records !== []) {
            ValidationResult::query()->insert($records);
        }

        return [
            'valid_count' => $validCount,
            'invalid_count' => $invalidCount,
            'fuzzy_match_count' => $fuzzyMatchedCount,
            'evaluated_count' => $students->count(),
            'issue_counts' => collect($issueCounts)
                ->sortDesc()
                ->all(),
        ];
    }

    private function matchKey(string $fullName, ?string $birthdate): string
    {
        return $this->normalizeName($fullName).'|'.($birthdate ?? '');
    }

    private function normalizeName(string $value): string
    {
        return preg_replace('/[^A-Z0-9]/', '', strtoupper(trim($value))) ?? '';
    }

    private function fuzzyMatches(object $student, array $sourceBuckets): Collection
    {
        $rawBirthdate = $student->birthdate?->format('Y-m-d');

        if ($rawBirthdate === null || trim($student->full_name) === '') {
            return collect();
        }

        $studentSource = $student->source_file;
        $studentName = strtoupper($student->full_name);

        $matches = collect();

        foreach (['nstp_1_enrollment', 'nstp_2_enrollment', 'graduates_list'] as $sourceFile) {
            if ($sourceFile === $studentSource) {
                continue;
            }

            foreach ($sourceBuckets[$sourceFile] as $bucketStudents) {
                foreach ($bucketStudents as $candidate) {
                    if ($candidate->birthdate?->format('Y-m-d') !== $rawBirthdate) {
                        continue;
                    }

                    if ($this->matchKey($candidate->full_name, $rawBirthdate) === $this->matchKey($student->full_name, $rawBirthdate)) {
                        continue;
                    }

                    similar_text($studentName, strtoupper($candidate->full_name), $similarity);

                    if ($similarity < 85) {
                        continue;
                    }

                    $matches->push([
                        'source_file' => $sourceFile,
                        'student_id' => $candidate->id,
                        'full_name' => $candidate->full_name,
                        'birthdate' => $rawBirthdate,
                        'similarity' => round($similarity, 2),
                    ]);
                }
            }
        }

        return $matches
            ->sortByDesc('similarity')
            ->values()
            ->take(3);
    }
}