<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Article extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'author_id',
        'editor_id',
        'category_id',
        'title',
        'slug',
        'excerpt',
        'content_json',
        'content_html',
        'content_text',
        'featured_image_id',
        'status',
        'article_type',
        'is_breaking',
        'is_featured',
        'views_count',
        'reading_time',
        'review_note',
        'published_at',
    ];

    protected $casts = [
        'content_json' => 'array',
        'is_breaking' => 'boolean',
        'is_featured' => 'boolean',
        'views_count' => 'integer',
        'reading_time' => 'integer',
        'published_at' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'editor_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function featuredImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'featured_image_id');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'article_tags');
    }

    public function seo(): HasOne
    {
        return $this->hasOne(ArticleSeo::class);
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(ArticleRevision::class)->orderByDesc('created_at');
    }

    public function corrections(): HasMany
    {
        return $this->hasMany(ArticleCorrection::class)->orderByDesc('created_at');
    }

    public function dailyViews(): HasMany
    {
        return $this->hasMany(ArticleViewDaily::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    public function scopeBreakingActive(Builder $query): Builder
    {
        return $query
            ->where('is_breaking', true)
            ->where('published_at', '>=', now()->subHours(24));
    }
}

