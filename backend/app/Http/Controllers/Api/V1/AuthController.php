<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with(['role', 'avatar'])->where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password_hash)) {
            return ApiResponse::error('Email atau kata sandi tidak valid.', [], 401);
        }

        if (!$user->is_active) {
            return ApiResponse::error('Akun Anda telah dinonaktifkan. Hubungi admin redaksi.', [], 403);
        }

        if ($user->roleName() === 'contributor') {
            return ApiResponse::error('Peran kontributor belum diaktifkan pada versi ini.', [], 403);
        }

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken('cms-token')->plainTextToken;

        ActivityLog::record($user->id, 'auth.login', User::class, $user->id);

        return ApiResponse::ok([
            'token' => $token,
            'user' => $this->formatUser($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $user?->currentAccessToken()?->delete();
        if ($user) {
            ActivityLog::record($user->id, 'auth.logout', User::class, $user->id);
        }

        return ApiResponse::ok(['message' => 'Berhasil keluar.']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['role', 'avatar']);

        return ApiResponse::ok($this->formatUser($user));
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'bio' => $user->bio,
            'is_active' => $user->is_active,
            'last_login_at' => $user->last_login_at?->toIso8601String(),
            'role' => [
                'id' => $user->role?->id,
                'name' => $user->role?->name,
                'permissions' => $user->role?->permissions ?? [],
            ],
            'avatar' => $user->avatar ? [
                'id' => $user->avatar->id,
                'file_url' => $user->avatar->file_url,
                'alt_text' => $user->avatar->alt_text,
            ] : null,
        ];
    }
}

