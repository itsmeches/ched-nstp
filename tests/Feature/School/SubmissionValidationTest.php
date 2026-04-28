<?php

namespace Tests\Feature\School;

use App\Models\Submission;
use App\Models\ValidationResult;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SubmissionValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_phase_3_validation_flags_missing_and_name_variation_issues(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('school.submissions.store'), [
            'semester' => '2026 - Midyear',
            'status' => 'draft',
            'nstp_1_enrollment' => $this->csvUpload('nstp1.csv', [
                ['1', '2026-9001', 'Santos', 'Maria', 'Lopez', 'BSIT', 'Female', '2004-02-10', 'Barangay Uno', 'Calamba', 'Laguna', '09170000001', 'maria1@example.com'],
                ['2', '2026-9002', 'Garcia', 'Juan', 'Cruz', 'BSBA', 'Male', '2004-03-11', 'Barangay Dos', 'Calamba', 'Laguna', '09170000002', 'juan@example.com'],
            ]),
            'nstp_2_enrollment' => $this->csvUpload('nstp2.csv', [
                ['1', '2026-9901', 'Santos', 'Mariah', 'Lopez', 'BSIT', 'Female', '2004-02-10', 'Barangay Uno', 'Calamba', 'Laguna', '09170000001', 'maria2@example.com'],
                ['2', '2026-9002', 'Garcia', 'Juan', 'Cruz', 'BSBA', 'Male', '2004-03-11', 'Barangay Dos', 'Calamba', 'Laguna', '09170000002', 'juan@example.com'],
            ]),
            'graduates_list' => $this->csvUpload('graduates.csv', [
                ['1', '2026-9002', 'Garcia', 'Juan', 'Cruz', 'BSBA', 'Male', '2004-03-11', 'Barangay Dos', 'Calamba', 'Laguna', '09170000002', 'juan@example.com'],
            ]),
        ]);

        $response->assertRedirect(route('school.submissions.index', absolute: false));

        $submission = Submission::query()->firstOrFail();

        $this->assertDatabaseCount('validation_results', $submission->students()->count());
        $this->assertGreaterThan(0, data_get($submission->parsed_summary, 'validation.invalid_count'));
        $this->assertGreaterThan(0, data_get($submission->parsed_summary, 'validation.fuzzy_match_count'));

        $invalidRow = ValidationResult::query()
            ->where('submission_id', $submission->id)
            ->where('status', 'invalid')
            ->firstOrFail();

        $issueCodes = collect($invalidRow->issues)->pluck('code')->all();

        $this->assertContains('missing_form_2b', $issueCodes);
        $this->assertContains('name_mismatch_possible', $issueCodes);
    }

    public function test_transferee_mismatch_requires_proof_when_marked_transferee(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('school.submissions.store'), [
            'semester' => '2026 - 1st Semester',
            'status' => 'draft',
            'nstp_2_enrollment' => $this->csvUpload('nstp2-transferee.csv', [
                ['1', '2026-8111', 'Rivera', 'Paolo', 'Tan', 'CWTS', 'Male', '2004-06-20', 'Brgy A', 'Pasig', 'NCR', '09170000111', 'paolo@example.com', 'YES'],
            ]),
            'graduates_list' => $this->csvUpload('graduates-transferee.csv', [
                ['1', '2026-8111', 'Rivera', 'Paolo', 'Tan', 'CWTS', 'Male', '2004-06-20', 'Brgy A', 'Pasig', 'NCR', '09170000111', 'paolo@example.com', 'YES'],
            ]),
        ]);

        $response->assertRedirect(route('school.submissions.index', absolute: false));

        $submission = Submission::query()->firstOrFail();

        $invalidRows = ValidationResult::query()
            ->where('submission_id', $submission->id)
            ->where('status', 'invalid')
            ->get();

        $this->assertTrue(
            $invalidRows->contains(function (ValidationResult $result): bool {
                return collect($result->issues)->contains(fn ($issue) => ($issue['code'] ?? null) === 'transferee_proof_required');
            }),
        );
    }

    public function test_transferee_with_proof_can_pass_without_missing_nstp_1_issue(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('school.submissions.store'), [
            'semester' => '2026 - 2nd Semester',
            'status' => 'draft',
            'nstp_2_enrollment' => $this->csvUpload('nstp2-transferee-proof.csv', [
                ['1', '2026-8222', 'Dela Cruz', 'Marie', 'Lim', 'CWTS', 'Female', '2004-07-12', 'Brgy B', 'Makati', 'NCR', '09170000222', 'marie@example.com', 'YES'],
            ]),
            'graduates_list' => $this->csvUpload('graduates-transferee-proof.csv', [
                ['1', '2026-8222', 'Dela Cruz', 'Marie', 'Lim', 'CWTS', 'Female', '2004-07-12', 'Brgy B', 'Makati', 'NCR', '09170000222', 'marie@example.com', 'YES'],
            ]),
            'transferee_proof' => UploadedFile::fake()->create('tor-proof.pdf', 32, 'application/pdf'),
        ]);

        $response->assertRedirect(route('school.submissions.index', absolute: false));

        $submission = Submission::query()->firstOrFail();

        $validRows = ValidationResult::query()
            ->where('submission_id', $submission->id)
            ->where('status', 'valid')
            ->get();

        $this->assertTrue($validRows->isNotEmpty());

        $hasMissingNstpIssue = $validRows->contains(function (ValidationResult $result): bool {
            return collect($result->issues)->contains(fn ($issue) => ($issue['code'] ?? null) === 'missing_nstp_1');
        });

        $this->assertFalse($hasMissingNstpIssue);
    }

    public function test_direct_submitted_upload_with_transferee_without_proof_is_rejected(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->from(route('school.submissions.index'))
            ->post(route('school.submissions.store'), [
                'semester' => '2026 - Midyear',
                'status' => 'submitted',
                'nstp_2_enrollment' => $this->csvUpload('nstp2-direct-submit.csv', [
                    ['1', '2026-8333', 'Rivera', 'Paolo', 'Tan', 'CWTS', 'Male', '2004-06-20', 'Brgy A', 'Pasig', 'NCR', '09170000333', 'paolo-submit@example.com', 'YES'],
                ]),
                'graduates_list' => $this->csvUpload('graduates-direct-submit.csv', [
                    ['1', '2026-8333', 'Rivera', 'Paolo', 'Tan', 'CWTS', 'Male', '2004-06-20', 'Brgy A', 'Pasig', 'NCR', '09170000333', 'paolo-submit@example.com', 'YES'],
                ]),
            ]);

        $response
            ->assertRedirect(route('school.submissions.index', absolute: false))
            ->assertSessionHasErrors('transferee_proof');

        $this->assertDatabaseCount('submissions', 0);
    }

    /**
     * @param list<list<string>> $rows
     */
    private function csvUpload(string $filename, array $rows): UploadedFile
    {
        $lines = [
            'Republic of the Philippines',
            'Commission on Higher Education',
            'NSTP Enrollment List',
            'No.,Student No.,Surname,First Name,Middle Name,Program,Sex,Birthdate,Street / Barangay,Municipality / City,Province,Contact Number,Email Address,Is Transferee',
        ];

        foreach ($rows as $row) {
            $lines[] = implode(',', $row);
        }

        $lines[] = 'Grand Total:,'.count($rows);

        return UploadedFile::fake()->createWithContent($filename, implode("\n", $lines));
    }
}