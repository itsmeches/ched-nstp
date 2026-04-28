<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        collect([
            ['name' => 'admin', 'label' => 'CHED Administrator'],
            ['name' => 'superadmin', 'label' => 'System Super Administrator'],
            ['name' => 'ched_staff', 'label' => 'CHED Staff'],
            ['name' => 'school', 'label' => 'School Account'],
        ])->each(fn (array $role) => Role::query()->updateOrCreate(['name' => $role['name']], $role));
    }
}