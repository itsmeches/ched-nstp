<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Services\Auth\RoleService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(private readonly RoleService $roleService)
    {
    }

    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'school_name' => 'required|string|max:255',
            'school_code' => 'required|string|max:50|unique:'.User::class.',school_code',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $role = Role::query()->firstOrCreate(
            ['name' => $this->roleService->defaultRegistrationRole()],
            ['label' => 'School Account'],
        );

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'role_id' => $role->id,
            'school_name' => $request->school_name,
            'school_code' => strtoupper((string) $request->school_code),
            'password' => Hash::make($request->password),
            'approval_status' => 'pending', // Set to pending for school accounts
        ]);

        event(new Registered($user));

        // Don't auto-login, show pending approval message
        return redirect(route('login'))->with('status', 
            'Registration successful! Your account is pending approval from a CHED administrator. Please log in once it has been approved.'
        );
    }
}
