<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class SystemHealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'name' => 'NSTP Serial Number Processing System',
            'version' => 'phase-0',
            'status' => 'ok',
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
