<?php

namespace App\Http\Controllers\Api\V1\Cms;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Category;
use App\Models\Tag;
use App\Services\RevalidationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TaxonomyController extends Controller
{
    public function categories(): JsonResponse
    {
        $categories = Category::with('parent:id,name')
            ->withCount('articles')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return ApiResponse::ok($categories);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        if (!$request->user()->isEditor()) {
            return ApiResponse::error('Hanya editor atau admin yang dapat mengelola kategori.', [], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:120'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        if (!empty($validated['parent_id'])) {
            $parent = Category::find($validated['parent_id']);
            if ($parent && $parent->parent_id !== null) {
                return ApiResponse::error('Kategori maksimal dua tingkat (tidak boleh membuat sub-subkategori).', [], 422);
            }
        }

        $slug = $this->uniqueCategorySlug($validated['slug'] ?? $validated['name']);
        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'parent_id' => $validated['parent_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        RevalidationService::trigger(['/', '/sitemap.xml']);

        return ApiResponse::ok($category->load('parent:id,name'), [], 201);
    }

    public function updateCategory(Request $request, Category $category): JsonResponse
    {
        if (!$request->user()->isEditor()) {
            return ApiResponse::error('Hanya editor atau admin yang dapat mengelola kategori.', [], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:120'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        if (!empty($validated['parent_id'])) {
            if ((int) $validated['parent_id'] === (int) $category->id) {
                return ApiResponse::error('Kategori tidak boleh menjadi induk dirinya sendiri.', [], 422);
            }
            $parent = Category::find($validated['parent_id']);
            if ($parent && $parent->parent_id !== null) {
                return ApiResponse::error('Kategori maksimal dua tingkat.', [], 422);
            }
            if ($category->children()->exists()) {
                return ApiResponse::error('Kategori ini memiliki subkategori sehingga tidak bisa dijadikan subkategori.', [], 422);
            }
        }

        $category->update([
            'name' => $validated['name'],
            'slug' => !empty($validated['slug']) ? $this->uniqueCategorySlug($validated['slug'], $category->id) : $category->slug,
            'parent_id' => $validated['parent_id'] ?? null,
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sort_order'] ?? $category->sort_order,
        ]);

        RevalidationService::trigger(['/', "/kategori/{$category->slug}", '/sitemap.xml']);

        return ApiResponse::ok($category->load('parent:id,name'));
    }

    public function destroyCategory(Request $request, Category $category): JsonResponse
    {
        if (!$request->user()->isEditor()) {
            return ApiResponse::error('Hanya editor atau admin yang dapat menghapus kategori.', [], 403);
        }

        if ($category->articles()->withTrashed()->exists()) {
            return ApiResponse::error('Kategori masih dipakai oleh artikel. Pindahkan artikel terlebih dahulu sebelum menghapus.', [], 422);
        }
        if ($category->children()->exists()) {
            return ApiResponse::error('Kategori masih memiliki subkategori. Hapus atau pindahkan subkategori terlebih dahulu.', [], 422);
        }

        $category->delete();
        RevalidationService::trigger(['/', '/sitemap.xml']);

        return ApiResponse::ok(['message' => 'Kategori berhasil dihapus.']);
    }

    public function tags(): JsonResponse
    {
        $tags = Tag::withCount('articles')->orderBy('name')->get();

        return ApiResponse::ok($tags);
    }

    public function storeTag(Request $request): JsonResponse
    {
        if (!$request->user()->isEditor()) {
            return ApiResponse::error('Hanya editor atau admin yang dapat mengelola tag.', [], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:120'],
        ]);

        $slug = $this->uniqueTagSlug($validated['slug'] ?? $validated['name']);
        $tag = Tag::create([
            'name' => $validated['name'],
            'slug' => $slug,
        ]);

        return ApiResponse::ok($tag, [], 201);
    }

    public function updateTag(Request $request, Tag $tag): JsonResponse
    {
        if (!$request->user()->isEditor()) {
            return ApiResponse::error('Hanya editor atau admin yang dapat mengelola tag.', [], 403);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['nullable', 'string', 'max:120'],
        ]);

        $tag->update([
            'name' => $validated['name'],
            'slug' => !empty($validated['slug']) ? $this->uniqueTagSlug($validated['slug'], $tag->id) : $tag->slug,
        ]);

        return ApiResponse::ok($tag);
    }

    public function destroyTag(Request $request, Tag $tag): JsonResponse
    {
        if (!$request->user()->isEditor()) {
            return ApiResponse::error('Hanya editor atau admin yang dapat menghapus tag.', [], 403);
        }

        if ($tag->articles()->exists()) {
            return ApiResponse::error('Tag masih dipakai oleh artikel. Gabungkan atau lepaskan dari artikel terlebih dahulu.', [], 422);
        }

        $tag->delete();

        return ApiResponse::ok(['message' => 'Tag berhasil dihapus.']);
    }

    public function mergeTags(Request $request): JsonResponse
    {
        if (!$request->user()->isEditor()) {
            return ApiResponse::error('Hanya editor atau admin yang dapat menggabungkan tag.', [], 403);
        }

        $validated = $request->validate([
            'source_tag_id' => ['required', 'integer', 'exists:tags,id'],
            'target_tag_id' => ['required', 'integer', 'exists:tags,id', 'different:source_tag_id'],
        ]);

        DB::transaction(function () use ($validated) {
            $articleIds = DB::table('article_tags')
                ->where('tag_id', $validated['source_tag_id'])
                ->pluck('article_id');

            foreach ($articleIds as $articleId) {
                DB::table('article_tags')->insertOrIgnore([
                    'article_id' => $articleId,
                    'tag_id' => $validated['target_tag_id'],
                ]);
            }

            Tag::where('id', $validated['source_tag_id'])->delete();
        });

        return ApiResponse::ok(['message' => 'Tag berhasil digabungkan.']);
    }

    private function uniqueCategorySlug(string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source) ?: 'kategori';
        $slug = $base;
        $i = 2;
        while (Category::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    private function uniqueTagSlug(string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source) ?: 'tag';
        $slug = $base;
        $i = 2;
        while (Tag::where('slug', $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}

