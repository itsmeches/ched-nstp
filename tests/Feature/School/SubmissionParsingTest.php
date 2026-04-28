<?php

namespace Tests\Feature\School;

use App\Models\Submission;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SubmissionParsingTest extends TestCase
{
    use RefreshDatabase;

    public function test_csv_upload_is_parsed_and_students_are_saved(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $file = UploadedFile::fake()->createWithContent(
            'nstp-1.csv',
            implode("\n", [
                'Republic of the Philippines',
                'Commission on Higher Education',
                'NSTP 1 Enrollment List',
                'Semester,2026 - 1st Semester',
                '',
                'No.,Student No.,Surname,First Name,Middle Name,Program,Sex,Birthdate,Street / Barangay,Municipality / City,Province,Contact Number,Email Address',
                '1,2026-0001, Dela Cruz , Juan , Santos , BSIT , Male , 2004-01-15 , Barangay Uno , Calamba City , Laguna , 09171234567 , juan@example.com',
                '2,2026-0002, Reyes, Ana, Lopez, BSBA, Female, 2003-06-01, Barangay Dos, Santa Rosa City, Laguna, 09998887777, ANA@EXAMPLE.COM',
                'Sub-total:,Male:,1',
                'Female:,1',
                'Grand Total:,2',
            ]),
        );

        $response = $this->actingAs($user)->post(route('school.submissions.store'), [
            'semester' => '2026 - 1st Semester',
            'status' => 'draft',
            'nstp_1_enrollment' => $file,
        ]);

        $response->assertRedirect(route('school.submissions.index', absolute: false));

        $submission = Submission::query()->firstOrFail();

        $this->assertSame(2, Student::query()->count());
        $this->assertSame(2, data_get($submission->parsed_summary, 'overall.student_count'));
        $this->assertDatabaseHas('students', [
            'submission_id' => $submission->id,
            'source_file' => 'nstp_1_enrollment',
            'student_number' => '2026-0001',
            'surname' => 'DELA CRUZ',
            'first_name' => 'JUAN',
            'middle_name' => 'SANTOS',
            'full_name' => 'DELA CRUZ, JUAN SANTOS',
            'sex' => 'MALE',
            'email_address' => 'juan@example.com',
        ]);
        $this->assertDatabaseHas('students', [
            'submission_id' => $submission->id,
            'student_number' => '2026-0002',
            'surname' => 'REYES',
            'first_name' => 'ANA',
            'middle_name' => 'LOPEZ',
            'full_name' => 'REYES, ANA LOPEZ',
            'sex' => 'FEMALE',
            'email_address' => 'ana@example.com',
        ]);
    }

    public function test_rows_with_blank_fields_are_imported_and_reported_as_parse_issues(): void
    {
        Storage::fake('local');

        $user = User::factory()->create();

        $file = UploadedFile::fake()->createWithContent(
            'nstp-blank-fields.csv',
            implode("\n", [
                'Republic of the Philippines',
                'Commission on Higher Education',
                'NSTP 1 Enrollment List',
                'No.,Student No.,Surname,First Name,Middle Name,Program,Sex,Birthdate,Street / Barangay,Municipality / City,Province,Contact Number,Email Address',
                '1,2026-7001,,John,Reyes,BSIT,,2004-02-10,Barangay Uno,Calamba City,Laguna,09170000001,john@example.com',
                '2,2026-7002,Garcia,Ana,Lopez,BSBA,Female,,Barangay Dos,Santa Rosa City,Laguna,09170000002,ana@example.com',
            ]),
        );

        $response = $this->actingAs($user)->post(route('school.submissions.store'), [
            'semester' => '2026 - Midyear',
            'status' => 'draft',
            'nstp_1_enrollment' => $file,
        ]);

        $response->assertRedirect(route('school.submissions.index', absolute: false));

        $submission = Submission::query()->firstOrFail();

        $this->assertSame(2, Student::query()->count());
        $this->assertSame(2, data_get($submission->parsed_summary, 'overall.student_count'));
        $this->assertSame(2, data_get($submission->parsed_summary, 'overall.parse_error_count'));
        $this->assertDatabaseHas('students', [
            'submission_id' => $submission->id,
            'student_number' => '2026-7001',
            'surname' => null,
            'first_name' => 'JOHN',
            'middle_name' => 'REYES',
            'full_name' => 'JOHN REYES',
            'sex' => null,
        ]);
        $this->assertDatabaseHas('students', [
            'submission_id' => $submission->id,
            'student_number' => '2026-7002',
            'surname' => 'GARCIA',
            'first_name' => 'ANA',
            'middle_name' => 'LOPEZ',
            'birthdate' => null,
        ]);
    }
}