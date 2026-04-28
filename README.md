# NSTP Serial Number Processing System

Phase 0 establishes the production-ready foundation for a centralized workflow where schools submit NSTP data, the platform validates student completion, and CHED issues verified serial numbers.

## Stack

- Laravel 12
- Inertia.js + React + TypeScript
- Ant Design
- MySQL-ready configuration
- Sanctum-ready API surface

## Phase 0 Scope

- Admin and School authentication roles
- Modular Laravel folder structure
- Inertia React dashboards for both roles
- Service-layer-based role routing
- API-ready route registration with versioned health endpoint
- MySQL-oriented environment defaults

## Folder Structure

```text
app/
├── Domain/
│   ├── Accounts/
│   ├── NSTP/
│   ├── Shared/
│   └── README.md
├── Http/
│   ├── Controllers/
│   │   ├── Admin/
│   │   ├── Api/V1/
│   │   ├── Auth/
│   │   └── School/
│   └── Middleware/
├── Models/
│   ├── Role.php
│   └── User.php
└── Services/
    └── Auth/
        └── RoleService.php

database/
├── migrations/
│   └── 0001_01_01_000000_create_users_table.php
└── seeders/
    ├── AdminUserSeeder.php
    ├── DatabaseSeeder.php
    └── RoleSeeder.php

resources/js/
├── Layouts/
├── Pages/
│   ├── Admin/
│   ├── Auth/
│   └── School/
└── types/

routes/
├── api.php
├── auth.php
└── web.php
```

## Key Files

### Routing

- `routes/web.php` defines the public landing page, the authenticated dashboard redirect, and role-protected admin and school dashboard routes.
- `routes/api.php` exposes the versioned API entry point at `/api/v1/system/health`.
- `bootstrap/app.php` registers both web and API route files and aliases the custom `role` middleware.

### Controllers

- `app/Http/Controllers/DashboardController.php` centralizes post-login role redirection.
- `app/Http/Controllers/Admin/DashboardController.php` serves the CHED admin dashboard.
- `app/Http/Controllers/School/DashboardController.php` serves the school dashboard.
- `app/Http/Controllers/Api/V1/SystemHealthController.php` provides a baseline API endpoint for health checks.
- `app/Http/Controllers/Auth/RegisteredUserController.php` creates school accounts by default.
- `app/Http/Controllers/Auth/AuthenticatedSessionController.php` redirects users to the correct dashboard after login.

### Models and Services

- `app/Models/User.php` owns the user-role relationship and school account fields.
- `app/Models/Role.php` defines the role catalog used by the auth layer.
- `app/Services/Auth/RoleService.php` provides the default registration role and dashboard route resolution.
- `app/Http/Middleware/EnsureUserHasRole.php` enforces role-based access for route groups.

## Database Design

### Roles

The `roles` table stores the canonical account types:

- `admin` for CHED administrators
- `school` for school accounts

### Users

The `users` table includes:

- basic identity fields from Laravel auth
- `role_id` foreign key
- `school_name` for school account display
- `school_code` as the external account identifier

### Seeders

- `RoleSeeder` inserts `admin` and `school`
- `AdminUserSeeder` creates the default CHED admin account

Default seeded admin credentials:

- Email: `admin@ched.gov.ph`
- Password: `password`

Change this immediately outside local development.

## Setup Instructions

1. Use PHP 8.2+.
2. Use Node 20.19+.
3. Copy `.env.example` to `.env`.
4. Update the MySQL credentials in `.env`.
5. Create the MySQL database named `nstp_serial_processing` or change the name in `.env`.
6. Run `composer install`.
7. Run `npm install`.
8. Run `php artisan key:generate`.
9. Run `php artisan migrate --seed`.
10. Run `php artisan serve`.
11. Run `npm run dev`.

## Validation Notes

Validated in this workspace:

- `php artisan migrate:fresh --seed`
- TypeScript compilation reached Vite successfully

Current local blocker:

- Frontend production build requires Node 20.19+ because Vite 7 does not support the installed Node 18 runtime.
