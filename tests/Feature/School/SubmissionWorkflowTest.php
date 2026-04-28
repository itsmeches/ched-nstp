<?php

namespace Tests\Feature\School;

use App\Models\Submission;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SubmissionWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_reupload_replaces_existing_draft_for_same_semester_and_preserves_other_files(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $initialResponse = $this->actingAs($user)->post(route('school.submissions.store'), [
            'semester' => '2026 - 1st Semester',
            'status' => 'draft',
            'nstp_1_enrollment' => $this->csvUpload('nstp-1-initial.csv', [
                ['1', '2026-1001', 'Cruz', 'Lia', 'Mae', 'BSIT', 'Female', '2004-01-01', 'Barangay 1', 'Calamba', 'Laguna', '09170000001', 'lia@example.com'],
            ]),
            'nstp_2_enrollment' => $this->csvUpload('nstp-2.csv', [
                ['1', '2026-2001', 'Garcia', 'Noel', 'Tan', 'BSED', 'Male', '2004-02-01', 'Barangay 2', 'Biñan', 'Laguna', '09170000002', 'noel@example.com'],
            ]),
        ]);

        $initialResponse->assertRedirect(route('school.submissions.index', absolute: false));

        $submission = Submission::query()->firstOrFail();
        $initialSubmissionId = $submission->id;

        $replacementResponse = $this->actingAs($user)->post(route('school.submissions.store'), [
            'semester' => '2026 - 1st Semester',
            'status' => 'draft',
            'nstp_1_enrollment' => $this->csvUpload('nstp-1-replacement.csv', [
                ['1', '2026-3001', 'Santos', 'Mika', 'Lee', 'BSCS', 'Female', '2004-03-01', 'Barangay 3', 'Los Baños', 'Laguna', '09170000003', 'mika@example.com'],
            ]),
        ]);

        $replacementResponse->assertRedirect(route('school.submissions.index', absolute: false));

        $submission->refresh();

        $this->assertSame(1, Submission::query()->count());
        $this->assertSame($initialSubmissionId, $submission->id);
        $this->assertCount(2, $submission->files);
        $this->assertSame(2, Student::query()->count());
        $this->assertDatabaseHas('students', [
            'submission_id' => $submission->id,
            'student_number' => '2026-3001',
            'source_file' => 'nstp_1_enrollment',
        ]);
        $this->assertDatabaseHas('students', [
            'submission_id' => $submission->id,
            'student_number' => '2026-2001',
            'source_file' => 'nstp_2_enrollment',
        ]);
        $this->assertDatabaseMissing('students', [
            'submission_id' => $submission->id,
            'student_number' => '2026-1001',
        ]);
    }

    public function test_duplicate_students_are_skipped_and_reported_in_summary(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('school.submissions.store'), [
            'semester' => '2026 - 2nd Semester',
            'status' => 'draft',
            'nstp_1_enrollment' => $this->csvUpload('nstp-duplicates.csv', [
                ['1', '2026-5001', 'Reyes', 'Ana', 'Lopez', 'BSBA', 'Female', '2003-06-01', 'Barangay Dos', 'Santa Rosa City', 'Laguna', '09998887777', 'ana@example.com'],
                ['2', '2026-5001', 'Reyes', 'Ana', 'Lopez', 'BSBA', 'Female', '2003-06-01', 'Barangay Dos', 'Santa Rosa City', 'Laguna', '09998887777', 'ana@example.com'],
                ['3', '2026-5002', 'Mendoza', 'Karl', 'Uy', 'BSIT', 'Male', '2004-04-04', 'Barangay Tres', 'Cabuyao', 'Laguna', '09171112222', 'karl@example.com'],
            ]),
        ]);

        $response->assertRedirect(route('school.submissions.index', absolute: false));

        $submission = Submission::query()->firstOrFail();

        $this->assertSame(2, Student::query()->count());
        $this->assertSame(1, data_get($submission->parsed_summary, 'overall.duplicate_rows'));
        $this->assertSame(1, data_get($submission->parsed_summary, 'files.nstp_1_enrollment.duplicate_rows'));
        $this->assertNotEmpty(data_get($submission->parsed_summary, 'files.nstp_1_enrollment.parse_errors'));
    }

    public function test_needs_correction_submission_can_be_resubmitted(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $submission = Submission::query()->create([
            'user_id' => $user->id,
            'semester' => '2026 - 2nd Semester',
            'status' => 'needs_correction',
            'files' => [
                'nstp_1_enrollment' => [
                    'label' => 'NSTP 1 Enrollment',
                    'original_name' => 'old.csv',
                    'path' => 'submissions/old.csv',
                ],
            ],
            'review_notes' => 'Please correct invalid records.',
            'reviewed_at' => now(),
        ]);

        $response = $this->actingAs($user)
            ->patch(route('school.submissions.submit', ['submission' => $submission->id]));

        $response->assertRedirect(route('school.submissions.index', absolute: false));

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => 'submitted',
            'reviewed_by' => null,
            'review_notes' => null,
        ]);
    }

    public function test_submit_is_blocked_when_transferee_students_exist_without_proof(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $submission = Submission::query()->create([
            'user_id' => $user->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'draft',
            'files' => [
                'nstp_2_enrollment' => [
                    'label' => 'NSTP 2 Enrollment',
                    'original_name' => 'nstp2.csv',
                    'path' => 'submissions/nstp2.csv',
                ],
            ],
        ]);

        Student::query()->create([
            'submission_id' => $submission->id,
            'source_file' => 'nstp_2_enrollment',
            'is_transferee' => true,
            'full_name' => 'RIVERA, PAOLO TAN',
            'sex' => 'M',
            'birthdate' => '2004-06-20',
        ]);

        $response = $this->actingAs($user)
            ->from(route('school.submissions.index'))
            ->patch(route('school.submissions.submit', ['submission' => $submission->id]));

        $response
            ->assertRedirect(route('school.submissions.index', absolute: false))
            ->assertSessionHasErrors('transferee_proof');

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => 'draft',
        ]);
    }

    public function test_submit_succeeds_when_transferee_students_have_proof(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $submission = Submission::query()->create([
            'user_id' => $user->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'draft',
            'files' => [
                'nstp_2_enrollment' => [
                    'label' => 'NSTP 2 Enrollment',
                    'original_name' => 'nstp2.csv',
                    'path' => 'submissions/nstp2.csv',
                ],
                'transferee_proof' => [
                    'label' => 'Transferee Proof (TOR / Equivalent)',
                    'original_name' => 'tor-proof.pdf',
                    'path' => 'submissions/tor-proof.pdf',
                ],
            ],
        ]);

        Student::query()->create([
            'submission_id' => $submission->id,
            'source_file' => 'nstp_2_enrollment',
            'is_transferee' => true,
            'full_name' => 'DELA CRUZ, MARIE LIM',
            'sex' => 'F',
            'birthdate' => '2004-07-12',
        ]);

        $response = $this->actingAs($user)
            ->patch(route('school.submissions.submit', ['submission' => $submission->id]));

        $response->assertRedirect(route('school.submissions.index', absolute: false));

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => 'submitted',
        ]);
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
            'No.,Student No.,Surname,First Name,Middle Name,Program,Sex,Birthdate,Street / Barangay,Municipality / City,Province,Contact Number,Email Address',
        ];

        foreach ($rows as $row) {
            $lines[] = implode(',', $row);
        }

        $lines[] = 'Grand Total:,'.count($rows);

        return UploadedFile::fake()->createWithContent($filename, implode("\n", $lines));
    }
}