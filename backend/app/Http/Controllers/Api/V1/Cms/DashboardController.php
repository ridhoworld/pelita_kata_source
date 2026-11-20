<?php

namespace App\Http\Controllers\Api\V1\Cms;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Article;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $statusCounts = Article::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $counts = [
            'draft' => (int) ($statusCounts['draft'] ?? 0),
            'in_review' => (int) ($statusCounts['in_review'] ?? 0),
            'scheduled' => (int) ($statusCounts['scheduled'] ?? 0),
            'published' => (int) ($statusCounts['published'] ?? 0),
            'archived' => (int) ($statusCounts['archived'] ?? 0),
        ];

        $reviewQueue = Article::with(['author:id,name,username', 'category:id,name,slug'])
            ->where('status', 'in_review')
            ->orderBy('updated_at') // oldest first per US-C-03 AC1
            ->limit(10)
            ->get()
            ->map(fn (Article $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'slug' => $a->slug,
                'article_type' => $a->article_type,
                'author' => $a->author,
                'category' => $a->category,
                'updated_at' => $a->updated_at?->toIso8601String(),
            ]);

        $scheduledNext7Days = Article::with(['author:id,name', 'category:id,name'])
            ->where('status', 'scheduled')
            ->whereBetween('published_at', [now(), now()->addDays(7)])
            ->orderBy('published_at')
            ->limit(10)
            ->get()
            ->map(fn (Article $a) => [
                'id' => $a->id,
                'title' => $a->title,
                'slug' => $a->slug,
                'author' => $a->author,
                'category' => $a->category,
                'published_at' => $a->published_at?->toIso8601String(),
            ]);

        $sinceDate = now()->subDays(7)->toDateString();
        $popular7d = DB::table('article_view_daily')
            ->join('articles', 'articles.id', '=', 'article_view_daily.article_id')
            ->where('article_view_daily.date', '>=', $sinceDate)
            ->whereNull('articles.deleted_at')
            ->where('articles.status', 'published')
            ->select('articles.id', 'articles.title', 'articles.slug', 'articles.views_count', DB::raw('SUM(article_view_daily.views) as views_7d'))
            ->groupBy('articles.id', 'articles.title', 'articles.slug', 'articles.views_count')
            ->orderByDesc('views_7d')
            ->limit(5)
            ->get();

        if ($popular7d->isEmpty()) {
            $popular7d = Article::published()
                ->select(['id', 'title', 'slug', 'views_count'])
                ->orderByDesc('views_count')
                ->limit(5)
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'title' => $a->title,
                    'slug' => $a->slug,
                    'views_count' => $a->views_count,
                    'views_7d' => $a->views_count,
                ]);
        }

        $recentActivity = ActivityLog::with('user:id,name,username')
            ->orderByDesc('created_at')
            ->limit(12)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'action' => $log->action,
                'subject_type' => $log->subject_type ? class_basename($log->subject_type) : null,
                'subject_id' => $log->subject_id,
                'meta' => $log->meta,
                'user' => $log->user,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        return ApiResponse::ok([
            'status_counts' => $counts,
            'review_queue' => $reviewQueue,
            'scheduled_next_7d' => $scheduledNext7Days,
            'popular_7d' => $popular7d,
            'recent_activity' => $recentActivity,
        ]);
    }
}

