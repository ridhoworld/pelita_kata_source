<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RevalidationService
{
    public static function trigger(array $paths = ['/']): void
    {
        $frontendUrl = rtrim((string) env('FRONTEND_URL', ''), '/');
        $secret = (string) env('REVALIDATE_SECRET', '');

        if ($frontendUrl === '' || $secret === '') {
            return;
        }

        try {
            Http::timeout(2)->post("{$frontendUrl}/api/revalidate", [
                'secret' => $secret,
                'paths' => array_values(array_unique($paths)),
            ]);
        } catch (\Throwable $e) {
            Log::debug('Revalidation webhook skipped: ' . $e->getMessage());
        }
    }
}

