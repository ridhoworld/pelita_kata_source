<?php

namespace App\Console\Commands;

use App\Models\ActivityLog;
use App\Models\Article;
use App\Services\RevalidationService;
use Illuminate\Console\Command;

class PublishScheduledArticles extends Command
{
    protected $signature = 'articles:publish-scheduled';

    protected $description = 'Terbitkan otomatis artikel terjadwal yang sudah mencapai waktu published_at';

    public function handle(): int
    {
        $articles = Article::with(['category', 'tags'])
            ->where('status', 'scheduled')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->get();

        if ($articles->isEmpty()) {
            return self::SUCCESS;
        }

        $paths = ['/', '/sitemap.xml', '/rss.xml'];

        foreach ($articles as $article) {
            $article->status = 'published';
            $article->save();

            ActivityLog::record(null, 'article.auto_published', Article::class, $article->id, [
                'slug' => $article->slug,
                'published_at' => $article->published_at?->toIso8601String(),
            ]);

            $paths[] = "/baca/{$article->slug}";
            if ($article->category) {
                $paths[] = "/kategori/{$article->category->slug}";
            }
            foreach ($article->tags as $tag) {
                $paths[] = "/tag/{$tag->slug}";
            }
        }

        RevalidationService::trigger($paths);
        $this->info("Published {$articles->count()} scheduled article(s).");

        return self::SUCCESS;
    }
}

