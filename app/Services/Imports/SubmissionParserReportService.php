<?php

namespace App\Services\Imports;

use App\Models\Submission;
use App\Support\IssueLabels;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SubmissionParserReportService
{
    public function download(Submission $submission, bool $invalidOnly = false): StreamedResponse
    {
        $submission->load([
            'students' => fn ($query) => $query
                ->with('validationResult')
                ->orderBy('source_file')
                ->orderBy('row_number')
                ->orderBy('full_name'),
        ]);

        $filename = sprintf(
            'parser-report-%s-%s%s.csv',
            $submission->id,
            Str::slug($submission->semester),
            $invalidOnly ? '-invalid-only' : '',
        );

        return response()->streamDownload(function () use ($submission, $invalidOnly): void {
            $handle = fopen('php://output', 'wb');

            if ($handle === false) {
                throw new \RuntimeException('Unable to open output stream for parser report download.');
            }

            fputcsv($handle, ['Report Type', 'Source File', 'Row Number', 'Student Number', 'Full Name', 'Status', 'Issue Code', 'Label', 'Message']);

            foreach ((array) data_get($submission->parsed_summary, 'files', []) as $sourceFile => $summary) {
                foreach ((array) ($summary['parse_errors'] ?? []) as $message) {
                    fputcsv($handle, ['parse_error', $sourceFile, '', '', '', 'warning', '', $message]);
                }
            }

            foreach ($submission->students as $student) {
                $validation = $student->validationResult;
                $issues = collect($validation?->issues ?? []);

                if ($invalidOnly && ($validation?->status !== 'invalid')) {
                    continue;
                }

                if ($issues->isEmpty()) {
                    fputcsv($handle, [
                        'validation',
                        $student->source_file,
                        $student->row_number,
                        $student->student_number,
                        $student->full_name,
                        $validation?->status ?? 'valid',
                        '',
                        '',
                        'No validation issues.',
                    ]);

                    continue;
                }

                foreach ($issues as $issue) {
                    $code = $issue['code'] ?? '';
                    fputcsv($handle, [
                        'validation',
                        $student->source_file,
                        $student->row_number,
                        $student->student_number,
                        $student->full_name,
                        $validation?->status ?? 'invalid',
                        $code,
                        $code ? IssueLabels::label($code) : '',
                        $issue['message'] ?? '',
                    ]);
                }
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }
}