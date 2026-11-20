<?php

namespace App\Http\Controllers\Api\V1\Cms;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Media;
use App\Models\User;
use App\Services\MediaProcessor;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(60, max(1, (int) $request->integer('per_page', 24)));
        $query = Media::with('uploader:id,name')->orderByDesc('created_at');

        if ($q = trim((string) $request->query('q', ''))) {
            $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $q) . '%';
            $query->where(function ($sub) use ($like) {
                $sub->where('caption', 'LIKE', $like)
                    ->orWhere('credit_source', 'LIKE', $like)
                    ->orWhere('alt_text', 'LIKE', $like);
            });
        }

        $paginated = $query->paginate($perPage);

        return ApiResponse::ok($paginated->items(), [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function store(Request $request, MediaProcessor $processor): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:5120', 'mimetypes:image/jpeg,image/png,image/webp,image/gif'],
            'credit_source' => ['required', 'string', 'max:255'],
            'alt_text' => ['required', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:1000'],
        ], [
            'file.max' => 'Ukuran file maksimal 5 MB.',
            'credit_source.required' => 'Kredit sumber foto wajib diisi.',
            'alt_text.required' => 'Teks alternatif (alt text) wajib diisi untuk aksesibilitas.',
        ]);

        try {
            $processed = $processor->processUpload($request->file('file'));
        } catch (\RuntimeException $e) {
            return ApiResponse::error($e->getMessage(), [], 422);
        }

        $media = Media::create([
            'uploaded_by' => $request->user()->id,
            'file_url' => $processed['file_url'],
            'file_type' => $processed['file_type'],
            'width' => $processed['width'],
            'height' => $processed['height'],
            'variants' => $processed['variants'],
            'caption' => $validated['caption'] ?? null,
            'credit_source' => $validated['credit_source'],
            'alt_text' => $validated['alt_text'],
        ]);

        return ApiResponse::ok($media->load('uploader:id,name'), [], 201);
    }

    public function update(Request $request, Media $media): JsonResponse
    {
        $validated = $request->validate([
            'credit_source' => ['required', 'string', 'max:255'],
            'alt_text' => ['required', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:1000'],
        ]);

        $media->update($validated);

        return ApiResponse::ok($media->load('uploader:id,name'));
    }

    public function destroy(Request $request, Media $media): JsonResponse
    {
        $usedInArticle = Article::withTrashed()->where('featured_image_id', $media->id)->exists();
        $usedInAvatar = User::where('avatar_media_id', $media->id)->exists();

        if ($usedInArticle || $usedInAvatar) {
            return ApiResponse::error('Media masih dipakai sebagai gambar utama artikel atau avatar pengguna dan tidak dapat dihapus.', [], 422);
        }

        $media->delete();

        return ApiResponse::ok(['message' => 'Media berhasil dihapus.']);
    }
}

