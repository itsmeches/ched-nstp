<?php

namespace App\Services\Imports;

use App\Imports\SubmissionStudentsImport;
use App\Models\Submission;
use App\Services\Audit\AuditLogService;
use App\Services\Validation\ValidateSubmissionService;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;

class SubmissionImportService
{
    /**
     * @var list<string>
     */
    private const STUDENT_FILE_KEYS = [
        'nstp_1_enrollment',
        'nstp_2_enrollment',
        'graduates_list',
    ];

    public function __construct(
        private readonly AuditLogService $auditLogService,
        private readonly ValidateSubmissionService $validateSubmissionService,
    ) {
    }

    public function importStudents(Submission $submission): void
    {
        $files = $submission->files ?? [];
        $fileSummaries = [];

        $submission->students()->delete();

        $overall = [
            'student_count' => 0,
            'male_total' => 0,
            'female_total' => 0,
            'grand_total' => 0,
            'transferee_count' => 0,
            'duplicate_rows' => 0,
            'skipped_rows' => 0,
            'parse_error_count' => 0,
        ];

        foreach ($files as $fileKey => $fileMeta) {
            if (! in_array($fileKey, self::STUDENT_FILE_KEYS, true)) {
                continue;
            }

            $import = new SubmissionStudentsImport($submission, $fileKey);
            Excel::import($import, Storage::disk('local')->path((string) Arr::get($fileMeta, 'path')));

            $summary = $import->summary();
            $fileSummaries[$fileKey] = $summary;
            $overall['student_count'] += $summary['computed']['grand_total'];
            $overall['male_total'] += $summary['computed']['male_total'];
            $overall['female_total'] += $summary['computed']['female_total'];
            $overall['grand_total'] += $summary['computed']['grand_total'];
            $overall['transferee_count'] += $summary['computed']['transferee_count'] ?? 0;
            $overall['duplicate_rows'] += $summary['duplicate_rows'];
            $overall['skipped_rows'] += $summary['skipped_rows'];
            $overall['parse_error_count'] += count($summary['parse_errors']);
        }

        $validationSummary = $this->validateSubmissionService->validate($submission);

        $submission->update([
            'parsed_summary' => [
                'files' => $fileSummaries,
                'overall' => $overall,
                'validation' => $validationSummary,
            ],
            'parsed_at' => now(),
        ]);

        $this->auditLogService->record(
            $submission->user,
            'school.submission.parsed',
            $submission,
            [
                'student_count' => $overall['student_count'],
                'file_count' => count($files),
                'duplicate_rows' => $overall['duplicate_rows'],
                'parse_error_count' => $overall['parse_error_count'],
                'invalid_count' => $validationSummary['invalid_count'],
            ],
        );
    }
}