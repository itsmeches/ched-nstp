<?php

namespace Tests\Feature\School;

use App\Models\SerialNumber;
use App\Models\Submission;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_school_dashboard_metrics_return_status_errors_and_serial_counts(): void
    {
        $school = User::factory()->create([
            'school_code' => 'SCH-04AA',
        ]);

        $otherSchool = User::factory()->create([
            'school_code' => 'SCH-05BB',
        ]);

        $draftSubmission = Submission::query()->create([
            'user_id' => $school->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'draft',
            'files' => [],
            'parsed_summary' => [
                'validation' => [
                    'invalid_count' => 2,
                ],
            ],
        ]);

        $approvedSubmission = Submission::query()->create([
            'user_id' => $school->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'approved',
            'files' => [],
            'parsed_summary' => [
                'validation' => [
                    'invalid_count' => 1,
                ],
            ],
        ]);

        Submission::query()->create([
            'user_id' => $otherSchool->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'approved',
            'files' => [],
            'parsed_summary' => [
                'validation' => [
                    'invalid_count' => 9,
                ],
            ],
        ]);

        $student = Student::query()->create([
            'submission_id' => $approvedSubmission->id,
            'source_file' => 'graduates_list',
            'full_name' => 'DELA CRUZ, JUAN SANTOS',
            'sex' => 'M',
            'birthdate' => '2004-03-11',
        ]);

        SerialNumber::query()->create([
            'submission_id' => $approvedSubmission->id,
            'student_id' => $student->id,
            'serial_number' => 'CWTS-04-000001-26',
            'component' => 'CWTS',
            'region_code' => '04',
            'sequence' => 1,
            'year' => '26',
            'issued_at' => now(),
        ]);

        $response = $this->actingAs($school)->getJson(route('school.dashboard.metrics', [
            'semester' => '2026 - 1st Semester',
        ]));

        $response
            ->assertOk()
            ->assertJsonPath('metrics.total_submissions', 2)
            ->assertJsonPath('metrics.errors_found', 3)
            ->assertJsonPath('metrics.serial_numbers_issued', 1)
            ->assertJsonPath('metrics.status_breakdown.draft', 1)
            ->assertJsonPath('metrics.status_breakdown.approved', 1)
            ->assertJsonPath('metrics.latest_submission_status', 'approved')
            ->assertJsonPath('trend.0.semester', '2026 - 1st Semester')
            ->assertJsonPath('trend.0.total_submissions', 2)
            ->assertJsonPath('trend.0.errors_found', 3)
            ->assertJsonPath('trend.0.serial_numbers_issued', 1)
            ->assertJsonPath('trend.0.approved', 1)
            ->assertJsonPath('trend.0.needs_correction', 0);

        $this->assertDatabaseHas('submissions', [
            'id' => $draftSubmission->id,
            'status' => 'draft',
        ]);
    }
}
