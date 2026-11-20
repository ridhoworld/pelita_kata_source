<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleSeo extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $table = 'article_seo';

    protected $primaryKey = 'article_id';

    protected $fillable = [
        'article_id',
        'meta_title',
        'meta_description',
        'canonical_url',
        'og_image_url',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}

