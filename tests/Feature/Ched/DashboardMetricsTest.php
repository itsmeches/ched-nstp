<?php

namespace Tests\Feature\Ched;

use App\Models\Role;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardMetricsTest extends TestCase
{
    use RefreshDatabase;

    public function test_ched_dashboard_metrics_support_semester_and_school_filters(): void
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

        $schoolA = User::factory()->create([
            'school_name' => 'School A',
            'school_code' => 'SCH-04AA',
        ]);

        $schoolB = User::factory()->create([
            'school_name' => 'School B',
            'school_code' => 'SCH-05BB',
        ]);

        Submission::query()->create([
            'user_id' => $schoolA->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'submitted',
            'files' => [],
        ]);

        Submission::query()->create([
            'user_id' => $schoolA->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'under_review',
            'files' => [],
        ]);

        Submission::query()->create([
            'user_id' => $schoolA->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'approved',
            'files' => [],
        ]);

        Submission::query()->create([
            'user_id' => $schoolA->id,
            'semester' => '2026 - 1st Semester',
            'status' => 'needs_correction',
            'files' => [],
        ]);

        Submission::query()->create([
            'user_id' => $schoolB->id,
            'semester' => '2026 - 2nd Semester',
            'status' => 'submitted',
            'files' => [],
        ]);

        $response = $this->actingAs($ched)->getJson(route('ched.dashboard.metrics', [
            'semester' => '2026 - 1st Semester',
            'school_id' => $schoolA->id,
        ]));

        $response
            ->assertOk()
            ->assertJsonPath('metrics.total_submissions', 4)
            ->assertJsonPath('metrics.pending_reviews', 2)
            ->assertJsonPath('metrics.approved', 1)
            ->assertJsonPath('metrics.rejected', 1)
            ->assertJsonPath('trend.0.semester', '2026 - 1st Semester')
            ->assertJsonPath('trend.0.total_submissions', 4)
            ->assertJsonPath('trend.0.pending_reviews', 2)
            ->assertJsonPath('trend.0.approved', 1)
            ->assertJsonPath('trend.0.rejected', 1);
    }
}
