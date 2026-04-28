<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user()?->loadMissing('role');

        abort_unless($user && in_array($user->role?->name, $roles, true), Response::HTTP_FORBIDDEN);

        return $next($request);
    }
}