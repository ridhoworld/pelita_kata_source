<?php

namespace App\Http\Controllers\Api\V1\Cms;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\ContactMessage;
use App\Models\Page;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Services\HtmlSanitizer;
use App\Services\RevalidationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    private function requireAdmin(Request $request): ?JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return ApiResponse::error('Akses ini hanya tersedia untuk Admin.', [], 403);
        }

        return null;
    }

    // --- PAGES ---
    public function pages(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        return ApiResponse::ok(Page::with('updater:id,name')->orderBy('title')->get());
    }

    public function storePage(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'slug' => ['nullable', 'string', 'max:120', 'unique:pages,slug'],
            'content_html' => ['required', 'string'],
            'is_published' => ['boolean'],
        ]);

        $page = Page::create([
            'title' => $validated['title'],
            'slug' => Str::slug($validated['slug'] ?? $validated['title']),
            'content_html' => HtmlSanitizer::sanitize($validated['content_html']),
            'is_published' => $validated['is_published'] ?? true,
            'updated_by' => $request->user()->id,
        ]);

        RevalidationService::trigger(["/{$page->slug}", '/sitemap.xml']);

        return ApiResponse::ok($page, [], 201);
    }

    public function updatePage(Request $request, Page $page): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'slug' => ['nullable', 'string', 'max:120', "unique:pages,slug,{$page->id}"],
            'content_html' => ['required', 'string'],
            'is_published' => ['boolean'],
        ]);

        $page->update([
            'title' => $validated['title'],
            'slug' => !empty($validated['slug']) ? Str::slug($validated['slug']) : $page->slug,
            'content_html' => HtmlSanitizer::sanitize($validated['content_html']),
            'is_published' => $validated['is_published'] ?? $page->is_published,
            'updated_by' => $request->user()->id,
        ]);

        RevalidationService::trigger(["/{$page->slug}", '/sitemap.xml']);

        return ApiResponse::ok($page);
    }

    public function destroyPage(Request $request, Page $page): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        if (in_array($page->slug, ['tentang-kami', 'pedoman-media-siber', 'kontak'], true)) {
            return ApiResponse::error('Halaman kebijakan inti tidak dapat dihapus.', [], 422);
        }

        $page->delete();

        return ApiResponse::ok(['message' => 'Halaman dihapus.']);
    }

    // --- USERS & ROLES ---
    public function roles(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        return ApiResponse::ok(Role::all());
    }

    public function users(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        $users = User::with(['role:id,name', 'avatar'])
            ->withCount('articles')
            ->orderBy('name')
            ->get();

        return ApiResponse::ok($users);
    }

    public function storeUser(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'username' => ['required', 'string', 'max:60', 'alpha_dash', 'unique:users,username'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ], [
            'password.min' => 'Kata sandi minimal 12 karakter sesuai standar keamanan redaksi.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'username' => Str::lower($validated['username']),
            'email' => Str::lower($validated['email']),
            'password_hash' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
            'bio' => $validated['bio'] ?? null,
            'is_active' => true,
        ]);

        ActivityLog::record($request->user()->id, 'user.created', User::class, $user->id, ['role_id' => $user->role_id]);

        return ApiResponse::ok($user->load('role:id,name'), [], 201);
    }

    public function updateUser(Request $request, User $user): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'username' => ['sometimes', 'required', 'string', 'max:60', 'alpha_dash', "unique:users,username,{$user->id}"],
            'email' => ['sometimes', 'required', 'email', 'max:190', "unique:users,email,{$user->id}"],
            'password' => ['nullable', 'string', 'min:12'],
            'role_id' => ['sometimes', 'required', 'integer', 'exists:roles,id'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $oldRole = $user->role_id;
        $data = collect($validated)->except('password')->all();
        if (!empty($validated['password'])) {
            $data['password_hash'] = Hash::make($validated['password']);
        }
        $user->update($data);

        if (isset($validated['is_active']) && !$validated['is_active']) {
            $user->tokens()->delete();
        }

        if (isset($validated['role_id']) && (int) $validated['role_id'] !== (int) $oldRole) {
            ActivityLog::record($request->user()->id, 'user.role_changed', User::class, $user->id, [
                'from_role_id' => $oldRole,
                'to_role_id' => $validated['role_id'],
            ]);
        }

        return ApiResponse::ok($user->load('role:id,name'));
    }

    // --- SETTINGS ---
    public function settings(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        $settings = Setting::all()->mapWithKeys(fn ($s) => [$s->key => $s->value]);

        return ApiResponse::ok($settings);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        $validated = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        foreach ($validated['settings'] as $key => $value) {
            Setting::updateOrCreate(
                ['key' => Str::limit((string) $key, 100, '')],
                ['value' => $value]
            );
        }

        ActivityLog::record($request->user()->id, 'settings.updated', Setting::class, null, [
            'keys' => array_keys($validated['settings']),
        ]);

        RevalidationService::trigger(['/']);

        return ApiResponse::ok(Setting::all()->mapWithKeys(fn ($s) => [$s->key => $s->value]));
    }

    // --- ACTIVITY LOGS ---
    public function activityLogs(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        $logs = ActivityLog::with('user:id,name,username')
            ->orderByDesc('created_at')
            ->paginate(30);

        return ApiResponse::ok($logs->items(), [
            'current_page' => $logs->currentPage(),
            'last_page' => $logs->lastPage(),
            'total' => $logs->total(),
        ]);
    }

    // --- CONTACT / HAK JAWAB INBOX ---
    public function messages(Request $request): JsonResponse
    {
        if (!$request->user()->isEditor()) {
            return ApiResponse::error('Hanya editor atau admin yang dapat melihat pesan pembaca.', [], 403);
        }

        $query = ContactMessage::orderByDesc('created_at');
        if ($topic = $request->query('topic')) {
            $query->where('topic', $topic);
        }
        if ($request->query('unread') === '1') {
            $query->where('is_read', false);
        }

        $paginated = $query->paginate(25);
        $unreadCount = ContactMessage::where('is_read', false)->count();

        return ApiResponse::ok($paginated->items(), [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
            'unread_count' => $unreadCount,
        ]);
    }

    public function markMessageRead(Request $request, ContactMessage $message): JsonResponse
    {
        if (!$request->user()->isEditor()) {
            return ApiResponse::error('Hanya editor atau admin yang dapat memperbarui status pesan.', [], 403);
        }

        $message->update(['is_read' => (bool) $request->boolean('is_read', true)]);

        return ApiResponse::ok($message);
    }

    public function deleteMessage(Request $request, ContactMessage $message): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) {
            return $err;
        }

        $message->delete();

        return ApiResponse::ok(['message' => 'Pesan dihapus.']);
    }
}

