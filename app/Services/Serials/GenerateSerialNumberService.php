<?php

namespace App\Services\Serials;

use App\Models\SerialNumber;
use App\Models\Student;
use App\Models\Submission;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GenerateSerialNumberService
{
    /**
     * @return array{generated_count:int,region_code:string}
     */
    public function generateForSubmission(Submission $submission): array
    {
        $submission->loadMissing('user');

        $regionCode = $this->resolveRegionCode($submission);
        $year = now()->format('y');

        /** @var Collection<int, Student> $students */
        $students = Student::query()
            ->where('submission_id', $submission->id)
            ->whereHas('validationResult', fn ($query) => $query->where('status', 'valid'))
            ->whereDoesntHave('serialNumber')
            ->orderBy('id')
            ->get();

        if ($students->isEmpty()) {
            return [
                'generated_count' => 0,
                'region_code' => $regionCode,
            ];
        }

        DB::transaction(function () use ($students, $submission, $regionCode, $year): void {
            $currentSequence = SerialNumber::query()
                ->where('region_code', $regionCode)
                ->lockForUpdate()
                ->max('sequence') ?? 0;

            foreach ($students as $student) {
                $currentSequence++;
                $component = $this->resolveComponent($student);

                SerialNumber::query()->create([
                    'submission_id' => $submission->id,
                    'student_id' => $student->id,
                    'component' => $component,
                    'region_code' => $regionCode,
                    'sequence' => $currentSequence,
                    'year' => $year,
                    'serial_number' => sprintf('%s-%s-%06d-%s', $component, $regionCode, $currentSequence, $year),
                    'issued_at' => now(),
                ]);
            }
        });

        return [
            'generated_count' => $students->count(),
            'region_code' => $regionCode,
        ];
    }

    private function resolveRegionCode(Submission $submission): string
    {
        $schoolCode = strtoupper((string) $submission->user?->school_code);

        if (preg_match('/(\d{2})/', $schoolCode, $matches) === 1) {
            return $matches[1];
        }

        return '00';
    }

    private function resolveComponent(Student $student): string
    {
        $program = strtoupper((string) $student->program);

        if (str_contains($program, 'ROTC')) {
            return 'ROTC';
        }

        if (str_contains($program, 'LTS')) {
            return 'LTS';
        }

        if (str_contains($program, 'CWTS')) {
            return 'CWTS';
        }

        return 'CWTS';
    }
}
