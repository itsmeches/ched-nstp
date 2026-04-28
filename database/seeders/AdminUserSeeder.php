<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $adminRoleId = Role::query()->where('name', 'admin')->valueOrFail('id');
        $superAdminRoleId = Role::query()->where('name', 'superadmin')->valueOrFail('id');
        $schoolRoleId = Role::query()->where('name', 'school')->valueOrFail('id');

        User::query()->updateOrCreate(
            ['email' => 'ched@cris.gov.ph'],
            [
                'name' => 'CHED Administrator',
                'role_id' => $adminRoleId,
                'school_name' => null,
                'school_code' => null,
                'approval_status' => 'approved',
                'approved_at' => now(),
                'approved_by' => null,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'superadmin@cris.gov.ph'],
            [
                'name' => 'System SuperAdmin',
                'role_id' => $superAdminRoleId,
                'school_name' => null,
                'school_code' => null,
                'approval_status' => 'approved',
                'approved_at' => now(),
                'approved_by' => null,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'hei@edu.ph'],
            [
                'name' => 'HEI Account',
                'role_id' => $schoolRoleId,
                'school_name' => 'Higher Education Institution',
                'school_code' => 'HEI001',
                'approval_status' => 'approved',
                'approved_at' => now(),
                'approved_by' => null,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );
    }
}