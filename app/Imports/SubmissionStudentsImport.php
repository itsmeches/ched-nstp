<?php

namespace App\Imports;

use App\Models\Student;
use App\Models\Submission;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithCustomCsvSettings;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Throwable;

class SubmissionStudentsImport implements SkipsEmptyRows, ToCollection, WithCalculatedFormulas, WithChunkReading, WithCustomCsvSettings
{
    private bool $headerFound = false;

    private int $importedCount = 0;

    private int $duplicateRows = 0;

    private int $skippedRows = 0;

    /**
     * @var list<string>
     */
    private array $parseErrors = [];

    /**
     * @var array<string, int>
     */
    private array $computedTotals = [
        'male_total' => 0,
        'female_total' => 0,
        'grand_total' => 0,
        'transferee_count' => 0,
    ];

    /**
     * @var array<string, int|null>
     */
    private array $declaredTotals = [
        'male_total' => null,
        'female_total' => null,
        'grand_total' => null,
    ];

    /**
     * @var array<string, bool>
     */
    private array $seenInCurrentFile = [];

    public function __construct(
        private readonly Submission $submission,
        private readonly string $sourceFile,
    ) {
    }

    public function collection(Collection $rows): void
    {
        $studentRows = [];

        foreach ($rows as $row) {
            $cells = collect($row)
                ->map(fn ($value) => is_string($value) ? trim($value) : $value)
                ->values();

            if (! $this->headerFound) {
                if ($this->looksLikeStudentHeader($cells)) {
                    $this->headerFound = true;
                }

                continue;
            }

            if ($this->isTotalRow($cells)) {
                $this->captureDeclaredTotals($cells);
                continue;
            }

            if (! $this->looksLikeStudentData($cells)) {
                continue;
            }

            $student = $this->mapStudent($cells);

            if ($student === null) {
                $this->skippedRows++;
                $this->addParseError('Skipped a row because the student name could not be resolved.');
                continue;
            }

            $studentKey = $this->studentKey($student);

            if ($studentKey !== null && isset($this->seenInCurrentFile[$studentKey])) {
                $this->duplicateRows++;
                $this->addParseError(sprintf(
                    'Detected duplicate student %s in %s.',
                    $student['student_number'] ?? $student['full_name'],
                    $this->sourceFile,
                ));
            }

            if ($studentKey !== null) {
                $this->seenInCurrentFile[$studentKey] = true;
            }

            $studentRows[] = $student;
            $this->incrementComputedTotals($student['sex']);
            $this->incrementTransfereeCount((bool) ($student['is_transferee'] ?? false));
            $this->importedCount++;
        }

        if (! $this->headerFound) {
            $this->addParseError('Student header row was not found in the uploaded file.');
        }

        if ($studentRows !== []) {
            Student::query()->insert($studentRows);
        }
    }

    public function chunkSize(): int
    {
        return 500;
    }

    /**
     * @return array<string, mixed>
     */
    public function getCsvSettings(): array
    {
        return [
            'delimiter' => ',',
            'enclosure' => '"',
            'escape_character' => '\\',
            'contiguous' => false,
            'input_encoding' => 'UTF-8',
        ];
    }

    /**
     * @return array<string, array<string, int>>
     */
    public function summary(): array
    {
        return [
            'computed' => $this->computedTotals,
            'declared' => [
                'male_total' => $this->declaredTotals['male_total'] ?? $this->computedTotals['male_total'],
                'female_total' => $this->declaredTotals['female_total'] ?? $this->computedTotals['female_total'],
                'grand_total' => $this->declaredTotals['grand_total'] ?? $this->computedTotals['grand_total'],
            ],
            'imported_count' => $this->importedCount,
            'duplicate_rows' => $this->duplicateRows,
            'skipped_rows' => $this->skippedRows,
            'parse_errors' => $this->parseErrors,
        ];
    }

    private function looksLikeStudentHeader(Collection $cells): bool
    {
        $normalized = $cells
            ->map(fn ($value) => is_string($value) ? strtolower((string) preg_replace('/\s+/', ' ', $value)) : '')
            ->filter();

        return $normalized->contains('student no.')
            && $normalized->contains('surname')
            && $normalized->contains('first name');
    }

    private function looksLikeStudentData(Collection $cells): bool
    {
        return filled($cells->get(1)) || filled($cells->get(2)) || filled($cells->get(3));
    }

    private function isTotalRow(Collection $cells): bool
    {
        $joined = strtolower($cells->take(3)->implode(' '));

        return str_contains($joined, 'male')
            || str_contains($joined, 'female')
            || str_contains($joined, 'grand total');
    }

    private function captureDeclaredTotals(Collection $cells): void
    {
        $joined = strtolower($cells->implode(' '));
        $numericValue = $this->lastNumericValue($cells);

        if ($numericValue === null) {
            return;
        }

        if (str_contains($joined, 'male')) {
            $this->declaredTotals['male_total'] = $numericValue;
        }

        if (str_contains($joined, 'female')) {
            $this->declaredTotals['female_total'] = $numericValue;
        }

        if (str_contains($joined, 'grand total')) {
            $this->declaredTotals['grand_total'] = $numericValue;
        }
    }

    private function lastNumericValue(Collection $cells): ?int
    {
        foreach ($cells->reverse() as $value) {
            if (is_numeric($value)) {
                return (int) $value;
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapStudent(Collection $cells): ?array
    {
        $rowNumber = is_numeric($cells->get(0)) ? (int) $cells->get(0) : null;
        $surname = $this->normalizeName($cells->get(2));
        $firstName = $this->normalizeName($cells->get(3));
        $middleName = $this->normalizeName($cells->get(4));
        $fullName = trim(collect([$surname, trim(collect([$firstName, $middleName])->filter()->implode(' '))])
            ->filter()
            ->implode(', '));
        $rawSex = $this->normalizeText($cells->get(6));
        $sex = $this->normalizeSex($cells->get(6));
        $rawBirthdate = $this->normalizeText($cells->get(7));
        $birthdate = $this->normalizeBirthdate($cells->get(7));

        $missingFields = [];

        if ($surname === null) {
            $missingFields[] = 'surname';
        }

        if ($firstName === null) {
            $missingFields[] = 'first_name';
        }

        if ($sex === null) {
            $missingFields[] = 'sex';
        }

        if ($birthdate === null) {
            $missingFields[] = 'birthdate';
        }

        if ($fullName === '') {
            $this->addParseError(sprintf(
                'Row %s skipped: student name could not be resolved.',
                $rowNumber ?? 'N/A',
            ));

            return null;
        }

        if ($missingFields !== []) {
            $this->addParseError(sprintf(
                'Row %s skipped: missing or invalid required fields (%s).',
                $rowNumber ?? 'N/A',
                implode(', ', $missingFields),
            ));

            if ($rawSex !== null && $sex === null) {
                $this->addParseError(sprintf(
                    'Row %s has invalid sex value "%s". Expected MALE/FEMALE or M/F.',
                    $rowNumber ?? 'N/A',
                    $rawSex,
                ));
            }

            if ($rawBirthdate !== null && $birthdate === null) {
                $this->addParseError(sprintf(
                    'Row %s has invalid birthdate value "%s".',
                    $rowNumber ?? 'N/A',
                    $rawBirthdate,
                ));
            }

            return null;
        }

        return [
            'submission_id' => $this->submission->id,
            'source_file' => $this->sourceFile,
            'is_transferee' => $this->normalizeBoolean($cells->get(13)) ?? false,
            'row_number' => $rowNumber,
            'student_number' => $this->normalizeText($cells->get(1)),
            'surname' => $surname,
            'first_name' => $firstName,
            'middle_name' => $middleName,
            'full_name' => $fullName,
            'program' => $this->normalizeText($cells->get(5)),
            'sex' => $sex,
            'birthdate' => $birthdate,
            'street_barangay' => $this->normalizeText($cells->get(8)),
            'municipality_city' => $this->normalizeText($cells->get(9)),
            'province' => $this->normalizeText($cells->get(10)),
            'contact_number' => $this->normalizeText($cells->get(11)),
            'email_address' => $this->normalizeEmail($cells->get(12)),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    private function incrementComputedTotals(?string $sex): void
    {
        $this->computedTotals['grand_total']++;

        if ($sex === 'M' || $sex === 'MALE') {
            $this->computedTotals['male_total']++;
        }

        if ($sex === 'F' || $sex === 'FEMALE') {
            $this->computedTotals['female_total']++;
        }
    }

    private function incrementTransfereeCount(bool $isTransferee): void
    {
        if ($isTransferee) {
            $this->computedTotals['transferee_count']++;
        }
    }

    /**
     * @param array<string, mixed> $student
     */
    private function studentKey(array $student): ?string
    {
        $studentNumber = strtoupper((string) ($student['student_number'] ?? ''));

        if ($studentNumber !== '') {
            return 'student_number:'.$studentNumber;
        }

        $fullName = strtoupper((string) ($student['full_name'] ?? ''));
        $birthdate = (string) ($student['birthdate'] ?? '');

        if ($fullName === '') {
            return null;
        }

        return 'identity:'.$fullName.'|'.$birthdate;
    }

    private function addParseError(string $message): void
    {
        if (count($this->parseErrors) >= 10) {
            return;
        }

        $this->parseErrors[] = $message;
    }

    private function normalizeName(mixed $value): ?string
    {
        $normalized = $this->normalizeText($value);

        return $normalized ? strtoupper($normalized) : null;
    }

    private function normalizeBoolean(mixed $value): ?bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        $normalized = strtolower((string) $this->normalizeText($value));

        if ($normalized === '') {
            return null;
        }

        if (in_array($normalized, ['1', 'true', 'yes', 'y', 'transferee'], true)) {
            return true;
        }

        if (in_array($normalized, ['0', 'false', 'no', 'n'], true)) {
            return false;
        }

        return null;
    }

    private function normalizeText(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = preg_replace('/\s+/', ' ', trim((string) $value));

        return $text === '' ? null : $text;
    }

    private function normalizeEmail(mixed $value): ?string
    {
        $email = $this->normalizeText($value);

        return $email ? strtolower($email) : null;
    }

    private function normalizeSex(mixed $value): ?string
    {
        $sex = strtoupper((string) $this->normalizeText($value));

        if ($sex === 'M' || $sex === 'MALE') {
            return 'MALE';
        }

        if ($sex === 'F' || $sex === 'FEMALE') {
            return 'FEMALE';
        }

        return null;
    }

    private function normalizeBirthdate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
        }

        try {
            return Carbon::parse((string) $value)->format('Y-m-d');
        } catch (Throwable) {
            return null;
        }
    }
}