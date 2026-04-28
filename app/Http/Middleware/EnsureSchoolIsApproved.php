<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSchoolIsApproved
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user()?->loadMissing('role');

        abort_unless($user && $user->canSubmitNstpFiles(), Response::HTTP_FORBIDDEN, 'School account is awaiting CHED approval.');

        return $next($request);
    }
}