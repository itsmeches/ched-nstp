<?php

namespace App\Http\Controllers;

use App\Services\Auth\RoleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(private readonly RoleService $roleService)
    {
    }

    public function __invoke(Request $request): RedirectResponse
    {
        return redirect()->route($this->roleService->dashboardRouteName($request->user()));
    }
}