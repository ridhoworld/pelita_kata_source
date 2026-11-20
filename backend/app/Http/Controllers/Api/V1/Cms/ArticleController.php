<?php

namespace App\Http\Controllers\Api\V1\Cms;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Article;
use App\Models\ArticleCorrection;
use App\Models\ArticleRevision;
use App\Models\SlugRedirect;
use App\Services\HtmlSanitizer;
use App\Services\RevalidationService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class ArticleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $perPage = min(50, max(1, (int) $request->integer('per_page', 20)));

        $query = Article::with(['author:id,name,username', 'editor:id,name,username', 'category:id,name,slug', 'featuredImage'])
            ->orderByDesc('updated_at');

        if ($user->isJournalist()) {
            $query->where('author_id', $user->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }
        if ($authorId = $request->query('author_id')) {
            $query->where('author_id', $authorId);
        }
        if ($q = trim((string) $request->query('q', ''))) {
            $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $q) . '%';
            $query->where(function ($sub) use ($like) {
                $sub->where('title', 'LIKE', $like)->orWhere('excerpt', 'LIKE', $like);
            });
        }

        if ($request->query('sort') === 'oldest_review') {
            $query->reorder('updated_at', 'asc');
        }

        $paginated = $query->paginate($perPage);

        return ApiResponse::ok($paginated->items(), [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Article::class);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'excerpt' => ['nullable', 'string'],
            'content_json' => ['nullable', 'array'],
            'content_html' => ['nullable', 'string'],
            'featured_image_id' => ['nullable', 'integer', 'exists:media,id'],
            'article_type' => ['nullable', 'in:news,opinion,feature,in_depth'],
            'is_breaking' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
            'seo' => ['nullable', 'array'],
            'seo.meta_title' => ['nullable', 'string', 'max:70'],
            'seo.meta_description' => ['nullable', 'string', 'max:170'],
            'seo.canonical_url' => ['nullable', 'url', 'max:500'],
            'seo.og_image_url' => ['nullable', 'string', 'max:500'],
        ]);

        $slug = $this->generateUniqueSlug($validated['slug'] ?? $validated['title']);
        $cleanHtml = HtmlSanitizer::sanitize($validated['content_html'] ?? '');
        $plainText = HtmlSanitizer::toPlainText($cleanHtml);
        $readingTime = HtmlSanitizer::calculateReadingTime($plainText);

        $article = Article::create([
            'author_id' => $request->user()->id,
            'category_id' => $validated['category_id'],
            'title' => $validated['title'],
            'slug' => $slug,
            'excerpt' => $validated['excerpt'] ?? null,
            'content_json' => $validated['content_json'] ?? null,
            'content_html' => $cleanHtml,
            'content_text' => $plainText,
            'featured_image_id' => $validated['featured_image_id'] ?? null,
            'status' => 'draft',
            'article_type' => $validated['article_type'] ?? 'news',
            'is_breaking' => $request->user()->isEditor() ? (bool) ($validated['is_breaking'] ?? false) : false,
            'is_featured' => $request->user()->isEditor() ? (bool) ($validated['is_featured'] ?? false) : false,
            'reading_time' => $readingTime,
        ]);

        if (!empty($validated['tag_ids'])) {
            $article->tags()->sync($validated['tag_ids']);
        }

        if (!empty($validated['seo'])) {
            $article->seo()->updateOrCreate(['article_id' => $article->id], $validated['seo']);
        }

        $this->createRevision($article, $request->user()->id, 'Draf awal dibuat', false);

        return ApiResponse::ok($this->loadFullArticle($article), [], 201);
    }

    public function show(Request $request, Article $article): JsonResponse
    {
        Gate::authorize('view', $article);

        return ApiResponse::ok($this->loadFullArticle($article));
    }

    public function update(Request $request, Article $article): JsonResponse
    {
        Gate::authorize('update', $article);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'category_id' => ['sometimes', 'required', 'integer', 'exists:categories,id'],
            'excerpt' => ['nullable', 'string'],
            'content_json' => ['nullable', 'array'],
            'content_html' => ['nullable', 'string'],
            'featured_image_id' => ['nullable', 'integer', 'exists:media,id'],
            'article_type' => ['nullable', 'in:news,opinion,feature,in_depth'],
            'is_breaking' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['integer', 'exists:tags,id'],
            'seo' => ['nullable', 'array'],
            'seo.meta_title' => ['nullable', 'string', 'max:70'],
            'seo.meta_description' => ['nullable', 'string', 'max:170'],
            'seo.canonical_url' => ['nullable', 'url', 'max:500'],
            'seo.og_image_url' => ['nullable', 'string', 'max:500'],
            'revision_note' => ['nullable', 'string', 'max:500'],
            'is_autosave' => ['nullable', 'boolean'],
        ]);

        $data = [];
        if (array_key_exists('title', $validated)) {
            $data['title'] = $validated['title'];
        }
        $oldSlug = $article->slug;
        $slugChanged = false;
        if (!empty($validated['slug']) && $validated['slug'] !== $article->slug) {
            $data['slug'] = $this->generateUniqueSlug($validated['slug'], $article->id);
            $slugChanged = ($data['slug'] !== $oldSlug);
        }
        if (array_key_exists('category_id', $validated)) {
            $data['category_id'] = $validated['category_id'];
        }
        if (array_key_exists('excerpt', $validated)) {
            $data['excerpt'] = $validated['excerpt'];
        }
        if (array_key_exists('content_json', $validated)) {
            $data['content_json'] = $validated['content_json'];
        }
        if (array_key_exists('content_html', $validated)) {
            $cleanHtml = HtmlSanitizer::sanitize($validated['content_html']);
            $plainText = HtmlSanitizer::toPlainText($cleanHtml);
            $data['content_html'] = $cleanHtml;
            $data['content_text'] = $plainText;
            $data['reading_time'] = HtmlSanitizer::calculateReadingTime($plainText);
        }
        if (array_key_exists('featured_image_id', $validated)) {
            $data['featured_image_id'] = $validated['featured_image_id'];
        }
        if (array_key_exists('article_type', $validated)) {
            $data['article_type'] = $validated['article_type'];
        }
        if ($request->user()->isEditor()) {
            if (array_key_exists('is_breaking', $validated)) {
                $data['is_breaking'] = (bool) $validated['is_breaking'];
            }
            if (array_key_exists('is_featured', $validated)) {
                $data['is_featured'] = (bool) $validated['is_featured'];
            }
        }

        $article->fill($data)->save();

        if ($slugChanged && $article->status === 'published') {
            SlugRedirect::where('new_slug', $oldSlug)->update(['new_slug' => $article->slug]);
            SlugRedirect::updateOrCreate(
                ['old_slug' => $oldSlug],
                ['article_id' => $article->id, 'new_slug' => $article->slug]
            );
            RevalidationService::trigger(["/baca/{$oldSlug}", "/baca/{$article->slug}", '/sitemap.xml']);
        }

        if (array_key_exists('tag_ids', $validated)) {
            $article->tags()->sync($validated['tag_ids'] ?? []);
        }
        if (array_key_exists('seo', $validated) && is_array($validated['seo'])) {
            $article->seo()->updateOrCreate(['article_id' => $article->id], $validated['seo']);
        }

        $isAutosave = (bool) ($validated['is_autosave'] ?? false);
        $this->createRevision($article, $request->user()->id, $validated['revision_note'] ?? null, $isAutosave);

        if ($article->status === 'published') {
            $this->revalidateArticlePaths($article);
        }

        return ApiResponse::ok($this->loadFullArticle($article));
    }

    public function destroy(Request $request, Article $article): JsonResponse
    {
        Gate::authorize('delete', $article);

        $slug = $article->slug;
        $article->delete();

        ActivityLog::record($request->user()->id, 'article.deleted', Article::class, $article->id, ['slug' => $slug]);
        RevalidationService::trigger(['/', "/baca/{$slug}", '/sitemap.xml', '/rss.xml']);

        return ApiResponse::ok(['message' => 'Artikel berhasil dihapus.']);
    }

    public function bulkArchive(Request $request): JsonResponse
    {
        if (!$request->user()->isEditor()) {
            return ApiResponse::error('Hanya editor atau admin yang dapat mengarsipkan massal.', [], 403);
        }

        $validated = $request->validate([
            'article_ids' => ['required', 'array', 'min:1'],
            'article_ids.*' => ['integer', 'exists:articles,id'],
        ]);

        $count = Article::whereIn('id', $validated['article_ids'])
            ->where('status', 'published')
            ->update(['status' => 'archived']);

        ActivityLog::record($request->user()->id, 'article.bulk_archived', Article::class, null, [
            'article_ids' => $validated['article_ids'],
            'count' => $count,
        ]);

        RevalidationService::trigger(['/', '/sitemap.xml', '/rss.xml']);

        return ApiResponse::ok(['archived_count' => $count]);
    }

    public function transition(Request $request, Article $article): JsonResponse
    {
        $validated = $request->validate([
            'target_status' => ['required', 'in:draft,in_review,scheduled,published,archived'],
            'note' => ['nullable', 'string', 'max:500'],
            'published_at' => ['nullable', 'date'],
        ]);

        $target = $validated['target_status'];
        $user = $request->user();

        if (!$user->can('transition', [$article, $target])) {
            return ApiResponse::error("Anda tidak memiliki izin mengubah status dari {$article->status} ke {$target}.", [], 403);
        }

        $article->load('featuredImage');

        // Mandatory fields check for draft -> in_review, in_review -> published/scheduled
        if (in_array($target, ['in_review', 'published', 'scheduled'], true)) {
            $missing = [];
            if (trim((string) $article->title) === '') {
                $missing[] = 'judul';
            }
            if (trim((string) $article->excerpt) === '') {
                $missing[] = 'excerpt/ringkasan';
            }
            if (!$article->category_id) {
                $missing[] = 'kategori';
            }
            if (!$article->featuredImage) {
                $missing[] = 'gambar utama';
            } else {
                if (trim((string) $article->featuredImage->credit_source) === '') {
                    $missing[] = 'kredit gambar utama';
                }
                if (trim((string) $article->featuredImage->alt_text) === '') {
                    $missing[] = 'alt text gambar utama';
                }
            }
            if (!empty($missing)) {
                return ApiResponse::error(
                    'Lengkapi kolom wajib sebelum melanjutkan: ' . implode(', ', $missing) . '.',
                    ['missing' => $missing],
                    422
                );
            }
        }

        if ($article->status === 'in_review' && $target === 'draft') {
            if (trim((string) ($validated['note'] ?? '')) === '') {
                return ApiResponse::error('Catatan pengembalian wajib diisi saat mengembalikan artikel ke penulis.', [], 422);
            }
            $article->review_note = $validated['note'];
        }

        if ($target === 'scheduled') {
            if (empty($validated['published_at']) || now()->gte($validated['published_at'])) {
                return ApiResponse::error('Waktu tayang terjadwal harus di masa depan.', [], 422);
            }
            $article->published_at = $validated['published_at'];
            $article->editor_id = $user->id;
        }

        if ($target === 'published') {
            $article->published_at = $article->published_at && $article->published_at->isPast()
                ? $article->published_at
                : now();
            $article->editor_id = $user->id;
            $article->review_note = null;
        }

        $from = $article->status;
        $article->status = $target;
        $article->save();

        $this->createRevision($article, $user->id, $validated['note'] ?? "Transisi status: {$from} -> {$target}", false);

        if (in_array($target, ['published', 'archived', 'scheduled'], true) || $from === 'published') {
            ActivityLog::record($user->id, "article.{$target}", Article::class, $article->id, [
                'from' => $from,
                'to' => $target,
                'slug' => $article->slug,
                'note' => $validated['note'] ?? null,
            ]);
            $this->revalidateArticlePaths($article);
        }

        return ApiResponse::ok($this->loadFullArticle($article));
    }

    public function revisions(Request $request, Article $article): JsonResponse
    {
        Gate::authorize('view', $article);

        $revisions = $article->revisions()
            ->with('editor:id,name,username')
            ->limit(50)
            ->get();

        return ApiResponse::ok($revisions);
    }

    public function restoreRevision(Request $request, Article $article, ArticleRevision $revision): JsonResponse
    {
        Gate::authorize('update', $article);

        if ($revision->article_id !== $article->id) {
            return ApiResponse::error('Revisi tidak sesuai dengan artikel ini.', [], 404);
        }

        $article->title = $revision->title_snapshot;
        if ($revision->content_snapshot !== null) {
            $article->content_json = $revision->content_snapshot;
            if (isset($revision->content_snapshot['html']) && is_string($revision->content_snapshot['html'])) {
                $cleanHtml = HtmlSanitizer::sanitize($revision->content_snapshot['html']);
                $plainText = HtmlSanitizer::toPlainText($cleanHtml);
                $article->content_html = $cleanHtml;
                $article->content_text = $plainText;
                $article->reading_time = HtmlSanitizer::calculateReadingTime($plainText);
            }
        }
        $article->save();

        $this->createRevision($article, $request->user()->id, "Dipulihkan dari revisi #{$revision->id}", false);

        if ($article->status === 'published') {
            $this->revalidateArticlePaths($article);
        }

        return ApiResponse::ok($this->loadFullArticle($article));
    }

    public function addCorrection(Request $request, Article $article): JsonResponse
    {
        Gate::authorize('addCorrection', $article);

        $validated = $request->validate([
            'type' => ['required', 'in:correction,update'],
            'note' => ['required', 'string', 'min:5', 'max:2000'],
        ]);

        $correction = ArticleCorrection::create([
            'article_id' => $article->id,
            'created_by' => $request->user()->id,
            'type' => $validated['type'],
            'note' => $validated['note'],
        ]);

        // Update article updated_at so sitemap <lastmod> refreshes (US-C-05 AC3)
        $article->touch();

        ActivityLog::record($request->user()->id, 'article.correction_added', Article::class, $article->id, [
            'correction_id' => $correction->id,
            'type' => $correction->type,
        ]);

        $this->revalidateArticlePaths($article);

        return ApiResponse::ok($correction->load('creator:id,name'), [], 201);
    }

    public function deleteCorrection(Request $request, Article $article, ArticleCorrection $correction): JsonResponse
    {
        if (!$request->user()->isAdmin()) {
            return ApiResponse::error('Hanya admin yang dapat menghapus catatan ralat.', [], 403);
        }

        if ($correction->article_id !== $article->id) {
            return ApiResponse::error('Catatan ralat tidak ditemukan pada artikel ini.', [], 404);
        }

        $meta = ['correction_id' => $correction->id, 'note' => $correction->note];
        $correction->delete();

        ActivityLog::record($request->user()->id, 'article.correction_deleted', Article::class, $article->id, $meta);
        $this->revalidateArticlePaths($article);

        return ApiResponse::ok(['message' => 'Catatan ralat dihapus dan tercatat di log aktivitas.']);
    }

    public function previewToken(Request $request, Article $article): JsonResponse
    {
        Gate::authorize('view', $article);

        $token = Str::random(40);
        Cache::put("article_preview:{$token}", $article->slug, now()->addMinutes(30));

        return ApiResponse::ok([
            'preview_token' => $token,
            'preview_url' => rtrim((string) env('FRONTEND_URL', 'http://localhost:3000'), '/') . "/baca/{$article->slug}?preview_token={$token}",
            'expires_in_minutes' => 30,
        ]);
    }

    private function generateUniqueSlug(string $source, ?int $ignoreId = null): string
    {
        $base = Str::slug($source) ?: 'artikel';
        $slug = $base;
        $counter = 2;

        while (
            Article::withTrashed()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function createRevision(Article $article, int $userId, ?string $note, bool $isAutosave): void
    {
        if ($isAutosave) {
            $latest = $article->revisions()->first();
            if ($latest && $latest->created_at && $latest->created_at->gt(now()->subMinute())) {
                return; // max 1 snapshot per minute for autosave (FR-C-06)
            }
        }

        ArticleRevision::create([
            'article_id' => $article->id,
            'edited_by' => $userId,
            'title_snapshot' => $article->title,
            'content_snapshot' => [
                'json' => $article->content_json,
                'html' => $article->content_html,
            ],
            'status_snapshot' => $article->status,
            'revision_note' => $note ?: ($isAutosave ? 'Simpan otomatis' : null),
        ]);
    }

    private function loadFullArticle(Article $article): Article
    {
        return $article->load([
            'author:id,name,username',
            'editor:id,name,username',
            'category:id,name,slug',
            'featuredImage',
            'tags:id,name,slug',
            'seo',
            'corrections.creator:id,name',
        ]);
    }

    private function revalidateArticlePaths(Article $article): void
    {
        $article->loadMissing(['category', 'tags']);
        $paths = ['/', "/baca/{$article->slug}", '/sitemap.xml', '/rss.xml'];
        if ($article->category) {
            $paths[] = "/kategori/{$article->category->slug}";
        }
        foreach ($article->tags as $tag) {
            $paths[] = "/tag/{$tag->slug}";
        }
        RevalidationService::trigger($paths);
    }
}

