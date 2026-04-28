<?php

namespace Tests\Feature\Auth;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('school.dashboard', absolute: false));
    }

    public function test_school_users_are_redirected_to_the_school_dashboard_after_login(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('school.dashboard', absolute: false));
    }

    public function test_admin_users_are_redirected_to_the_admin_dashboard_after_login(): void
    {
        $adminRoleId = Role::query()->firstOrCreate(
            ['name' => 'admin'],
            ['label' => 'CHED Administrator'],
        )->id;

        $user = User::factory()->create([
            'role_id' => $adminRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('admin.dashboard', absolute: false));
    }

    public function test_superadmin_users_are_redirected_to_the_admin_dashboard_after_login(): void
    {
        $superAdminRoleId = Role::query()->firstOrCreate(
            ['name' => 'superadmin'],
            ['label' => 'System Super Administrator'],
        )->id;

        $user = User::factory()->create([
            'role_id' => $superAdminRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('admin.dashboard', absolute: false));
    }

    public function test_school_users_can_access_dashboard_route_and_are_redirected_to_school_dashboard(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect(route('school.dashboard', absolute: false));
    }

    public function test_admin_users_can_access_dashboard_route_and_are_redirected_to_admin_dashboard(): void
    {
        $adminRoleId = Role::query()->firstOrCreate(
            ['name' => 'admin'],
            ['label' => 'CHED Administrator'],
        )->id;

        $user = User::factory()->create([
            'role_id' => $adminRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect(route('admin.dashboard', absolute: false));
    }

    public function test_superadmin_users_can_access_dashboard_route_and_are_redirected_to_admin_dashboard(): void
    {
        $superAdminRoleId = Role::query()->firstOrCreate(
            ['name' => 'superadmin'],
            ['label' => 'System Super Administrator'],
        )->id;

        $user = User::factory()->create([
            'role_id' => $superAdminRoleId,
            'school_name' => null,
            'school_code' => null,
        ]);

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect(route('admin.dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
