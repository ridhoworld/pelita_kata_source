<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\ArticleViewDaily;
use App\Models\Category;
use App\Models\ContactMessage;
use App\Models\Page;
use App\Models\Setting;
use App\Models\SlugRedirect;
use App\Models\Tag;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class PublicController extends Controller
{
    public function articles(Request $request): JsonResponse
    {
        $perPage = min(50, max(1, (int) $request->integer('per_page', 20)));

        $query = Article::published()
            ->with(['author.avatar', 'editor', 'category.parent', 'featuredImage', 'tags'])
            ->orderByDesc('published_at');

        if ($request->boolean('featured')) {
            $query->featured();
        }
        if ($request->boolean('breaking')) {
            $query->breakingActive();
        }
        if ($type = $request->string('type')->toString()) {
            $query->where('article_type', $type);
        }

        $paginated = $query->paginate($perPage);

        return ApiResponse::ok(
            $paginated->getCollection()->map(fn (Article $a) => $this->formatArticleSummary($a))->values(),
            [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ]
        );
    }

    public function home(): JsonResponse
    {
        $breaking = Article::published()
            ->breakingActive()
            ->with(['category'])
            ->orderByDesc('published_at')
            ->limit(3)
            ->get()
            ->map(fn (Article $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'slug' => $a->slug,
                'published_at' => $a->published_at?->toIso8601String(),
                'category' => $a->category ? ['name' => $a->category->name, 'slug' => $a->category->slug] : null,
            ]);

        $headlines = Article::published()
            ->featured()
            ->with(['author.avatar', 'category', 'featuredImage', 'tags'])
            ->orderByDesc('published_at')
            ->limit(5)
            ->get()
            ->map(fn (Article $a) => $this->formatArticleSummary($a));

        $latest = Article::published()
            ->with(['author.avatar', 'category', 'featuredImage', 'tags'])
            ->orderByDesc('published_at')
            ->limit(12)
            ->get()
            ->map(fn (Article $a) => $this->formatArticleSummary($a));

        $rootCategories = Category::whereNull('parent_id')
            ->with('children')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $rubrics = $rootCategories->map(function (Category $cat) {
            $catIds = $cat->children->pluck('id')->push($cat->id)->all();
            $articles = Article::published()
                ->whereIn('category_id', $catIds)
                ->with(['author.avatar', 'category', 'featuredImage'])
                ->orderByDesc('published_at')
                ->limit(3)
                ->get()
                ->map(fn (Article $a) => $this->formatArticleSummary($a));

            return [
                'category' => [
                    'id' => $cat->id,
                    'name' => $cat->name,
                    'slug' => $cat->slug,
                    'description' => $cat->description,
                ],
                'articles' => $articles,
            ];
        })->filter(fn ($r) => count($r['articles']) > 0)->values();

        return ApiResponse::ok([
            'breaking' => $breaking,
            'headlines' => $headlines,
            'latest' => $latest,
            'rubrics' => $rubrics,
        ]);
    }

    public function articleDetail(Request $request, string $slug): JsonResponse
    {
        $previewToken = $request->query('preview_token');
        $isValidPreview = false;

        if ($previewToken) {
            $cachedSlug = Cache::get("article_preview:{$previewToken}");
            $isValidPreview = ($cachedSlug === $slug);
        }

        $query = Article::with([
            'author.avatar',
            'editor',
            'category.parent',
            'featuredImage',
            'tags',
            'seo',
            'corrections.creator',
        ])->where('slug', $slug);

        if (!$isValidPreview) {
            $query->published();
        }

        $article = $query->first();

        if (!$article) {
            $redirect = SlugRedirect::where('old_slug', $slug)->first();
            if ($redirect) {
                $target = Article::published()->where('slug', $redirect->new_slug)->first();
                if ($target) {
                    return ApiResponse::ok([
                        'redirect_to' => $target->slug,
                    ]);
                }
            }

            return ApiResponse::error('Artikel tidak ditemukan.', [], 404);
        }

        $tagIds = $article->tags->pluck('id')->all();
        $related = Article::published()
            ->where('id', '!=', $article->id)
            ->where(function ($q) use ($article, $tagIds) {
                $q->where('category_id', $article->category_id);
                if (!empty($tagIds)) {
                    $q->orWhereHas('tags', fn ($tq) => $tq->whereIn('tags.id', $tagIds));
                }
            })
            ->with(['author.avatar', 'category', 'featuredImage'])
            ->orderByDesc('published_at')
            ->limit(4)
            ->get()
            ->map(fn (Article $a) => $this->formatArticleSummary($a));

        return ApiResponse::ok([
            'article' => [
                ...$this->formatArticleSummary($article),
                'content_html' => $article->content_html,
                'updated_at' => $article->updated_at?->toIso8601String(),
                'is_preview' => $isValidPreview,
                'editor' => $article->editor ? [
                    'id' => $article->editor->id,
                    'name' => $article->editor->name,
                    'username' => $article->editor->username,
                ] : null,
                'seo' => [
                    'meta_title' => $article->seo?->meta_title ?: $article->title,
                    'meta_description' => $article->seo?->meta_description ?: $article->excerpt,
                    'canonical_url' => $article->seo?->canonical_url,
                    'og_image_url' => $article->seo?->og_image_url ?: $article->featuredImage?->file_url,
                ],
                'corrections' => $article->corrections->map(fn ($c) => [
                    'id' => $c->id,
                    'type' => $c->type,
                    'note' => $c->note,
                    'created_at' => $c->created_at?->toIso8601String(),
                    'created_by' => $c->creator?->name,
                ])->values(),
            ],
            'related' => $related,
        ]);
    }

    public function categories(): JsonResponse
    {
        $categories = Category::whereNull('parent_id')
            ->with(['children'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn (Category $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'description' => $c->description,
                'sort_order' => $c->sort_order,
                'children' => $c->children->map(fn (Category $ch) => [
                    'id' => $ch->id,
                    'name' => $ch->name,
                    'slug' => $ch->slug,
                    'description' => $ch->description,
                    'sort_order' => $ch->sort_order,
                ])->values(),
            ]);

        return ApiResponse::ok($categories);
    }

    public function categoryArticles(Request $request, string $slug): JsonResponse
    {
        $category = Category::with(['parent', 'children'])->where('slug', $slug)->first();
        if (!$category) {
            return ApiResponse::error('Kategori tidak ditemukan.', [], 404);
        }

        $categoryIds = $category->children->pluck('id')->push($category->id)->all();
        $perPage = min(50, max(1, (int) $request->integer('per_page', 20)));

        $paginated = Article::published()
            ->whereIn('category_id', $categoryIds)
            ->with(['author.avatar', 'category', 'featuredImage', 'tags'])
            ->orderByDesc('published_at')
            ->paginate($perPage);

        return ApiResponse::ok([
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'slug' => $category->slug,
                'description' => $category->description,
                'parent' => $category->parent ? [
                    'name' => $category->parent->name,
                    'slug' => $category->parent->slug,
                ] : null,
                'children' => $category->children->map(fn ($ch) => [
                    'id' => $ch->id,
                    'name' => $ch->name,
                    'slug' => $ch->slug,
                ])->values(),
            ],
            'articles' => $paginated->getCollection()->map(fn (Article $a) => $this->formatArticleSummary($a))->values(),
        ], [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function tagArticles(Request $request, string $slug): JsonResponse
    {
        $tag = Tag::where('slug', $slug)->first();
        if (!$tag) {
            return ApiResponse::error('Tag tidak ditemukan.', [], 404);
        }

        $perPage = min(50, max(1, (int) $request->integer('per_page', 20)));

        $paginated = Article::published()
            ->whereHas('tags', fn ($q) => $q->where('tags.id', $tag->id))
            ->with(['author.avatar', 'category', 'featuredImage', 'tags'])
            ->orderByDesc('published_at')
            ->paginate($perPage);

        return ApiResponse::ok([
            'tag' => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
            ],
            'articles' => $paginated->getCollection()->map(fn (Article $a) => $this->formatArticleSummary($a))->values(),
        ], [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function search(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));
        if (mb_strlen($q) < 3) {
            return ApiResponse::error('Kata kunci pencarian minimal 3 karakter.', [], 422);
        }

        $perPage = min(50, max(1, (int) $request->integer('per_page', 20)));
        $driver = DB::getDriverName();

        $query = Article::published()
            ->with(['author.avatar', 'category', 'featuredImage', 'tags']);

        if (in_array($driver, ['mysql', 'mariadb'], true)) {
            $query->whereRaw('MATCH(title, excerpt, content_text) AGAINST(? IN NATURAL LANGUAGE MODE)', [$q])
                ->orderByRaw('MATCH(title, excerpt, content_text) AGAINST(? IN NATURAL LANGUAGE MODE) DESC', [$q])
                ->orderByDesc('published_at');
        } else {
            $like = '%' . str_replace(['%', '_'], ['\\%', '\\_'], $q) . '%';
            $query->where(function ($sub) use ($like) {
                $sub->where('title', 'LIKE', $like)
                    ->orWhere('excerpt', 'LIKE', $like)
                    ->orWhere('content_text', 'LIKE', $like);
            })
                ->orderByRaw('CASE WHEN title LIKE ? THEN 3 WHEN excerpt LIKE ? THEN 2 ELSE 1 END DESC', [$like, $like])
                ->orderByDesc('published_at');
        }

        $paginated = $query->paginate($perPage);

        $suggestions = [];
        if ($paginated->total() === 0) {
            $suggestions = Tag::inRandomOrder()->limit(6)->pluck('name')->all();
        }

        return ApiResponse::ok([
            'query' => $q,
            'articles' => $paginated->getCollection()->map(fn (Article $a) => $this->formatArticleSummary($a))->values(),
            'suggestions' => $suggestions,
        ], [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function authorProfile(Request $request, string $username): JsonResponse
    {
        $author = User::with(['role', 'avatar'])->where('username', $username)->first();
        if (!$author) {
            return ApiResponse::error('Penulis tidak ditemukan.', [], 404);
        }

        $publishedCount = Article::published()->where('author_id', $author->id)->count();
        if ($publishedCount === 0) {
            return ApiResponse::error('Penulis belum memiliki artikel terbit.', [], 404);
        }

        $perPage = min(50, max(1, (int) $request->integer('per_page', 20)));
        $paginated = Article::published()
            ->where('author_id', $author->id)
            ->with(['author.avatar', 'category', 'featuredImage', 'tags'])
            ->orderByDesc('published_at')
            ->paginate($perPage);

        return ApiResponse::ok([
            'author' => [
                'id' => $author->id,
                'name' => $author->name,
                'username' => $author->username,
                'bio' => $author->bio,
                'role' => $author->role?->name,
                'avatar' => $author->avatar ? [
                    'file_url' => $author->avatar->file_url,
                    'alt_text' => $author->avatar->alt_text,
                ] : null,
                'articles_count' => $publishedCount,
            ],
            'articles' => $paginated->getCollection()->map(fn (Article $a) => $this->formatArticleSummary($a))->values(),
        ], [
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'per_page' => $paginated->perPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function pageDetail(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->where('is_published', true)->first();
        if (!$page) {
            return ApiResponse::error('Halaman tidak ditemukan.', [], 404);
        }

        return ApiResponse::ok([
            'id' => $page->id,
            'title' => $page->title,
            'slug' => $page->slug,
            'content_html' => $page->content_html,
            'updated_at' => $page->updated_at?->toIso8601String(),
        ]);
    }

    public function sitemapData(): JsonResponse
    {
        $articles = Article::published()
            ->select(['slug', 'title', 'excerpt', 'published_at', 'updated_at', 'category_id', 'author_id'])
            ->with(['category:id,name,slug', 'author:id,name,username'])
            ->orderByDesc('published_at')
            ->get();

        $categories = Category::select(['slug', 'updated_at'])->get();
        $tags = Tag::select(['slug', 'updated_at'])->get();
        $pages = Page::where('is_published', true)->select(['slug', 'updated_at'])->get();
        $authors = User::whereHas('articles', fn ($q) => $q->published())
            ->select(['username', 'updated_at'])
            ->get();

        return ApiResponse::ok([
            'articles' => $articles,
            'categories' => $categories,
            'tags' => $tags,
            'pages' => $pages,
            'authors' => $authors,
        ]);
    }

    public function newsSitemapData(): JsonResponse
    {
        $articles = Article::published()
            ->where('published_at', '>=', now()->subHours(48))
            ->select(['slug', 'title', 'published_at', 'updated_at'])
            ->orderByDesc('published_at')
            ->limit(1000)
            ->get();

        return ApiResponse::ok($articles);
    }

    public function recordView(Request $request, string $slug): JsonResponse
    {
        $article = Article::published()->where('slug', $slug)->first();
        if (!$article) {
            return ApiResponse::error('Artikel tidak ditemukan.', [], 404);
        }

        $ipHash = hash('sha256', ($request->ip() ?? '0.0.0.0') . '|' . config('app.key'));
        $dedupKey = "view:{$article->id}:{$ipHash}";

        if (Cache::add($dedupKey, true, now()->addHours(6))) {
            $article->increment('views_count');
            $today = now()->toDateString();
            $exists = DB::table('article_view_daily')
                ->where('article_id', $article->id)
                ->where('date', $today)
                ->exists();

            if ($exists) {
                DB::table('article_view_daily')
                    ->where('article_id', $article->id)
                    ->where('date', $today)
                    ->increment('views');
            } else {
                ArticleViewDaily::create([
                    'article_id' => $article->id,
                    'date' => $today,
                    'views' => 1,
                ]);
            }
        }

        return ApiResponse::ok(['recorded' => true]);
    }

    public function publicSettings(): JsonResponse
    {
        $settings = Setting::all()->mapWithKeys(fn ($s) => [$s->key => $s->value]);

        return ApiResponse::ok($settings);
    }

    public function submitContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190'],
            'topic' => ['required', 'string', 'in:umum,koreksi,hak_jawab,liputan'],
            'message' => ['required', 'string', 'min:10', 'max:4000'],
            'turnstile_token' => ['nullable', 'string'],
        ]);

        $turnstileSecret = (string) env('TURNSTILE_SECRET_KEY', '');
        if ($turnstileSecret !== '') {
            $token = $validated['turnstile_token'] ?? '';
            if ($token === '') {
                return ApiResponse::error('Verifikasi anti-spam diperlukan.', [], 422);
            }
            $verify = Http::asForm()->timeout(4)->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $turnstileSecret,
                'response' => $token,
                'remoteip' => $request->ip(),
            ]);
            if (!$verify->ok() || !$verify->json('success')) {
                return ApiResponse::error('Verifikasi anti-spam gagal. Silakan coba lagi.', [], 422);
            }
        }

        ContactMessage::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'topic' => $validated['topic'],
            'message' => $validated['message'],
            'ip_hash' => hash('sha256', ($request->ip() ?? '0.0.0.0') . '|' . config('app.key')),
        ]);

        return ApiResponse::ok(['message' => 'Pesan Anda telah kami terima. Terima kasih atas tanggapan Anda.'], [], 201);
    }

    private function formatArticleSummary(Article $a): array
    {
        return [
            'id' => $a->id,
            'title' => $a->title,
            'slug' => $a->slug,
            'excerpt' => $a->excerpt,
            'article_type' => $a->article_type,
            'status' => $a->status,
            'is_breaking' => $a->is_breaking,
            'is_featured' => $a->is_featured,
            'reading_time' => $a->reading_time,
            'views_count' => $a->views_count,
            'published_at' => $a->published_at?->toIso8601String(),
            'category' => $a->category ? [
                'id' => $a->category->id,
                'name' => $a->category->name,
                'slug' => $a->category->slug,
                'parent' => $a->category->parent ? [
                    'name' => $a->category->parent->name,
                    'slug' => $a->category->parent->slug,
                ] : null,
            ] : null,
            'author' => $a->author ? [
                'id' => $a->author->id,
                'name' => $a->author->name,
                'username' => $a->author->username,
                'bio' => $a->author->bio,
                'avatar' => $a->author->avatar ? [
                    'file_url' => $a->author->avatar->file_url,
                    'alt_text' => $a->author->avatar->alt_text,
                ] : null,
            ] : null,
            'featured_image' => $a->featuredImage ? [
                'id' => $a->featuredImage->id,
                'file_url' => $a->featuredImage->file_url,
                'width' => $a->featuredImage->width,
                'height' => $a->featuredImage->height,
                'variants' => $a->featuredImage->variants,
                'caption' => $a->featuredImage->caption,
                'credit_source' => $a->featuredImage->credit_source,
                'alt_text' => $a->featuredImage->alt_text,
            ] : null,
            'tags' => $a->relationLoaded('tags')
                ? $a->tags->map(fn ($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug])->values()
                : [],
        ];
    }
}

