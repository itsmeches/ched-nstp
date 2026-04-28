<?php

namespace Tests\Feature\Ched;

use App\Models\SerialNumber;
use App\Models\Role;
use App\Models\Submission;
use App\Models\Student;
use App\Models\User;
use App\Models\ValidationResult;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ReviewWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_ched_staff_can_view_review_queue(): void
    {
        $this->withoutVite();

        $chedRoleId = Role::query()->firstOrCreate(
            ['name' => 'ched_staff'],
            ['label' => 'CHED Staff'],
        )->id;

        $ched = User::factory()->create([
            'role_id' => $chedRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $school = User::factory()->create();

        $submission = Submission::query()->create([
            'user_id' => $school->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'submitted',
            'files' => [
                'nstp_1_enrollment' => [
                    'label' => 'NSTP 1 Enrollment',
                    'original_name' => 'nstp-1.csv',
                    'path' => 'submissions/demo/nstp-1.csv',
                ],
            ],
            'parsed_summary' => [
                'validation' => [
                    'valid_count' => 10,
                    'invalid_count' => 2,
                    'fuzzy_match_count' => 1,
                    'evaluated_count' => 12,
                ],
            ],
            'submitted_at' => now(),
        ]);

        $this->actingAs($ched)
            ->get(route('ched.submissions.index', ['submission' => $submission->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Ched/Submissions/Index')
                ->where('selectedSubmission.id', $submission->id)
                ->where('issueCodeOptions.0', 'missing_nstp_1'));
    }

    public function test_ched_review_queue_can_filter_by_issue_code(): void
    {
        $this->withoutVite();

        $chedRoleId = Role::query()->firstOrCreate(
            ['name' => 'ched_staff'],
            ['label' => 'CHED Staff'],
        )->id;

        $ched = User::factory()->create([
            'role_id' => $chedRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $school = User::factory()->create();

        $matchingSubmission = Submission::query()->create([
            'user_id' => $school->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'submitted',
            'files' => [],
            'parsed_summary' => [
                'validation' => [
                    'valid_count' => 0,
                    'invalid_count' => 1,
                    'fuzzy_match_count' => 0,
                    'evaluated_count' => 1,
                    'issue_counts' => ['missing_form_2b' => 1],
                ],
            ],
            'submitted_at' => now(),
        ]);

        $student = Student::query()->create([
            'submission_id' => $matchingSubmission->id,
            'source_file' => 'nstp_1_enrollment',
            'full_name' => 'LOPEZ, MARIO CRUZ',
        ]);

        ValidationResult::query()->create([
            'submission_id' => $matchingSubmission->id,
            'student_id' => $student->id,
            'status' => 'invalid',
            'issues' => [['code' => 'missing_form_2b', 'message' => 'Student was not found in Form 2B.']],
        ]);

        $otherSubmission = Submission::query()->create([
            'user_id' => $school->id,
            'semester' => '2026 - 2nd Semester',
            'status' => 'submitted',
            'files' => [],
            'parsed_summary' => [
                'validation' => [
                    'valid_count' => 0,
                    'invalid_count' => 1,
                    'fuzzy_match_count' => 0,
                    'evaluated_count' => 1,
                    'issue_counts' => ['missing_nstp_2' => 1],
                ],
            ],
            'submitted_at' => now(),
        ]);

        $otherStudent = Student::query()->create([
            'submission_id' => $otherSubmission->id,
            'source_file' => 'nstp_1_enrollment',
            'full_name' => 'SANTOS, ANA LOPEZ',
        ]);

        ValidationResult::query()->create([
            'submission_id' => $otherSubmission->id,
            'student_id' => $otherStudent->id,
            'status' => 'invalid',
            'issues' => [['code' => 'missing_nstp_2', 'message' => 'Student was not found in NSTP 2.']],
        ]);

        $this->actingAs($ched)
            ->get(route('ched.submissions.index', ['issue_code' => 'missing_form_2b']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Ched/Submissions/Index')
                ->has('submissions.data', 1)
                ->where('submissions.data.0.id', $matchingSubmission->id));
    }

    public function test_ched_staff_can_download_parser_report(): void
    {
        $chedRoleId = Role::query()->firstOrCreate(
            ['name' => 'ched_staff'],
            ['label' => 'CHED Staff'],
        )->id;

        $ched = User::factory()->create([
            'role_id' => $chedRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $submission = Submission::query()->create([
            'user_id' => User::factory()->create()->id,
            'semester' => '2026 - Summer',
            'status' => 'submitted',
            'files' => [],
            'parsed_summary' => [
                'files' => [
                    'nstp_1_enrollment' => [
                        'parse_errors' => ['Row 2 has missing or invalid fields (sex).'],
                    ],
                ],
            ],
            'submitted_at' => now(),
        ]);

        $invalidStudent = Student::query()->create([
            'submission_id' => $submission->id,
            'source_file' => 'nstp_1_enrollment',
            'row_number' => 1,
            'student_number' => '2026-9301',
            'full_name' => 'LOPEZ, MARIA CRUZ',
        ]);

        $validStudent = Student::query()->create([
            'submission_id' => $submission->id,
            'source_file' => 'nstp_1_enrollment',
            'row_number' => 2,
            'student_number' => '2026-9302',
            'full_name' => 'SANTOS, JUAN DELA CRUZ',
        ]);

        ValidationResult::query()->create([
            'submission_id' => $submission->id,
            'student_id' => $invalidStudent->id,
            'status' => 'invalid',
            'issues' => [['code' => 'missing_nstp_2', 'message' => 'Student was not found in NSTP 2.']],
        ]);

        ValidationResult::query()->create([
            'submission_id' => $submission->id,
            'student_id' => $validStudent->id,
            'status' => 'valid',
            'issues' => [],
        ]);

        $response = $this->actingAs($ched)->get(route('ched.submissions.report', ['submission' => $submission->id]));

        $response->assertOk();
        $response->assertDownload(sprintf('parser-report-%s-%s.csv', $submission->id, '2026-summer'));
        $this->assertStringContainsString('missing_nstp_2', $response->streamedContent());
        $this->assertStringContainsString('Missing NSTP 2', $response->streamedContent());
        $this->assertStringContainsString('No validation issues.', $response->streamedContent());
    }

    public function test_ched_staff_can_download_invalid_only_parser_report(): void
    {
        $chedRoleId = Role::query()->firstOrCreate(
            ['name' => 'ched_staff'],
            ['label' => 'CHED Staff'],
        )->id;

        $ched = User::factory()->create([
            'role_id' => $chedRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $submission = Submission::query()->create([
            'user_id' => User::factory()->create()->id,
            'semester' => '2026 - Summer',
            'status' => 'submitted',
            'files' => [],
            'parsed_summary' => [
                'files' => [
                    'nstp_1_enrollment' => [
                        'parse_errors' => ['Row 2 has missing or invalid fields (sex).'],
                    ],
                ],
            ],
            'submitted_at' => now(),
        ]);

        $invalidStudent = Student::query()->create([
            'submission_id' => $submission->id,
            'source_file' => 'nstp_1_enrollment',
            'row_number' => 1,
            'student_number' => '2026-9311',
            'full_name' => 'LOPEZ, MARIA CRUZ',
        ]);

        $validStudent = Student::query()->create([
            'submission_id' => $submission->id,
            'source_file' => 'nstp_1_enrollment',
            'row_number' => 2,
            'student_number' => '2026-9312',
            'full_name' => 'SANTOS, JUAN DELA CRUZ',
        ]);

        ValidationResult::query()->create([
            'submission_id' => $submission->id,
            'student_id' => $invalidStudent->id,
            'status' => 'invalid',
            'issues' => [['code' => 'missing_form_2b', 'message' => 'Student was not found in Form 2B.']],
        ]);

        ValidationResult::query()->create([
            'submission_id' => $submission->id,
            'student_id' => $validStudent->id,
            'status' => 'valid',
            'issues' => [],
        ]);

        $response = $this->actingAs($ched)->get(route('ched.submissions.report', ['submission' => $submission->id, 'invalid_only' => 1]));

        $response->assertOk();
        $response->assertDownload(sprintf('parser-report-%s-%s-invalid-only.csv', $submission->id, '2026-summer'));
        $this->assertStringContainsString('missing_form_2b', $response->streamedContent());
        $this->assertStringContainsString('Missing Form 2B', $response->streamedContent());
        $this->assertStringContainsString('Row 2 has missing or invalid fields (sex).', $response->streamedContent());
        $this->assertStringNotContainsString('No validation issues.', $response->streamedContent());
    }

    public function test_ched_staff_can_transition_submission_status(): void
    {
        $chedRoleId = Role::query()->firstOrCreate(
            ['name' => 'ched_staff'],
            ['label' => 'CHED Staff'],
        )->id;

        $ched = User::factory()->create([
            'role_id' => $chedRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $submission = Submission::query()->create([
            'user_id' => User::factory()->create()->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'submitted',
            'files' => [],
            'submitted_at' => now(),
        ]);

        $this->actingAs($ched)
            ->patch(route('ched.submissions.transition', ['submission' => $submission->id]), [
                'target_status' => 'under_review',
                'review_notes' => 'Initial review started.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => 'under_review',
            'reviewed_by' => $ched->id,
        ]);

        $this->actingAs($ched)
            ->patch(route('ched.submissions.transition', ['submission' => $submission->id]), [
                'target_status' => 'approved',
                'review_notes' => 'Approved after review.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'status' => 'approved',
            'reviewed_by' => $ched->id,
            'review_notes' => 'Approved after review.',
        ]);
    }

    public function test_invalid_transition_is_rejected(): void
    {
        $chedRoleId = Role::query()->firstOrCreate(
            ['name' => 'ched_staff'],
            ['label' => 'CHED Staff'],
        )->id;

        $ched = User::factory()->create([
            'role_id' => $chedRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $submission = Submission::query()->create([
            'user_id' => User::factory()->create()->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'approved',
            'files' => [],
            'submitted_at' => now(),
        ]);

        $this->actingAs($ched)
            ->patch(route('ched.submissions.transition', ['submission' => $submission->id]), [
                'target_status' => 'needs_correction',
                'review_notes' => 'Cannot happen from approved.',
            ])
            ->assertSessionHasErrors('target_status');
    }

    public function test_serial_numbers_are_generated_only_for_valid_students_when_submission_is_approved(): void
    {
        $chedRoleId = Role::query()->firstOrCreate(
            ['name' => 'ched_staff'],
            ['label' => 'CHED Staff'],
        )->id;

        $ched = User::factory()->create([
            'role_id' => $chedRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $school = User::factory()->create([
            'school_code' => 'SCH-04AA',
        ]);

        $firstSubmission = Submission::query()->create([
            'user_id' => $school->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'under_review',
            'files' => [],
            'submitted_at' => now(),
        ]);

        $validStudent = Student::query()->create([
            'submission_id' => $firstSubmission->id,
            'source_file' => 'graduates_list',
            'full_name' => 'DELA CRUZ, JUAN SANTOS',
            'program' => 'CWTS',
        ]);

        $invalidStudent = Student::query()->create([
            'submission_id' => $firstSubmission->id,
            'source_file' => 'graduates_list',
            'full_name' => 'REYES, ANA LOPEZ',
            'program' => 'CWTS',
        ]);

        ValidationResult::query()->create([
            'submission_id' => $firstSubmission->id,
            'student_id' => $validStudent->id,
            'status' => 'valid',
            'issues' => [],
        ]);

        ValidationResult::query()->create([
            'submission_id' => $firstSubmission->id,
            'student_id' => $invalidStudent->id,
            'status' => 'invalid',
            'issues' => [['code' => 'missing_form_2b']],
        ]);

        $this->actingAs($ched)
            ->patch(route('ched.submissions.transition', ['submission' => $firstSubmission->id]), [
                'target_status' => 'approved',
                'review_notes' => 'Approved for serial issuance.',
            ])
            ->assertRedirect();

        $this->assertSame(1, SerialNumber::query()->count());
        $this->assertDatabaseHas('serial_numbers', [
            'student_id' => $validStudent->id,
            'region_code' => '04',
            'sequence' => 1,
            'year' => now()->format('y'),
        ]);
        $this->assertDatabaseMissing('serial_numbers', [
            'student_id' => $invalidStudent->id,
        ]);

        $secondSubmission = Submission::query()->create([
            'user_id' => $school->id,
            'semester' => '2026 - 2nd Semester',
            'status' => 'under_review',
            'files' => [],
            'submitted_at' => now(),
        ]);

        $secondValidStudent = Student::query()->create([
            'submission_id' => $secondSubmission->id,
            'source_file' => 'graduates_list',
            'full_name' => 'SANTOS, MIKA LEE',
            'program' => 'CWTS',
        ]);

        ValidationResult::query()->create([
            'submission_id' => $secondSubmission->id,
            'student_id' => $secondValidStudent->id,
            'status' => 'valid',
            'issues' => [],
        ]);

        $this->actingAs($ched)
            ->patch(route('ched.submissions.transition', ['submission' => $secondSubmission->id]), [
                'target_status' => 'approved',
                'review_notes' => 'Approved second batch.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('serial_numbers', [
            'student_id' => $secondValidStudent->id,
            'region_code' => '04',
            'sequence' => 2,
        ]);
    }
}
