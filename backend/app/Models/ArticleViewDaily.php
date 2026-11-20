<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleViewDaily extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $table = 'article_view_daily';

    protected $fillable = ['article_id', 'date', 'views'];

    protected $casts = [
        'date' => 'date',
        'views' => 'integer',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}

