<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function ok(mixed $data = null, array $meta = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'data' => $data,
            'meta' => (object) $meta,
            'errors' => null,
        ], $status);
    }

    public static function error(string $message, array $errors = [], int $status = 422): JsonResponse
    {
        return response()->json([
            'data' => null,
            'meta' => (object) [],
            'errors' => [
                'message' => $message,
                'details' => (object) $errors,
            ],
        ], $status);
    }
}

