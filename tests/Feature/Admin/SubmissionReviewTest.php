<?php

namespace Tests\Feature\Admin;

use App\Models\Role;
use App\Models\Submission;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SubmissionReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_parsed_submission_review_screen(): void
    {
        $this->withoutVite();

        $adminRoleId = Role::query()->firstOrCreate(
            ['name' => 'admin'],
            ['label' => 'CHED Administrator'],
        )->id;

        $admin = User::factory()->create([
            'role_id' => $adminRoleId,
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
                'files' => [
                    'nstp_1_enrollment' => [
                        'imported_count' => 1,
                        'duplicate_rows' => 0,
                        'skipped_rows' => 0,
                        'parse_errors' => [],
                    ],
                ],
                'overall' => [
                    'student_count' => 1,
                    'male_total' => 1,
                    'female_total' => 0,
                    'grand_total' => 1,
                    'duplicate_rows' => 0,
                    'skipped_rows' => 0,
                    'parse_error_count' => 0,
                ],
            ],
            'parsed_at' => now(),
            'submitted_at' => now(),
        ]);

        Student::query()->create([
            'submission_id' => $submission->id,
            'source_file' => 'nstp_1_enrollment',
            'row_number' => 1,
            'student_number' => '2026-7001',
            'surname' => 'LOPEZ',
            'first_name' => 'MARIO',
            'middle_name' => 'CRUZ',
            'full_name' => 'LOPEZ, MARIO CRUZ',
            'program' => 'BSIT',
            'sex' => 'MALE',
        ]);

        $this->actingAs($admin)
            ->get(route('admin.submissions.index', ['submission' => $submission->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Submissions/Index')
                ->has('submissions.data', 1)
                ->where('selectedSubmission.id', $submission->id)
                ->has('selectedSubmission.students', 1));
    }
}