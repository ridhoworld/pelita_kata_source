<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleCorrection extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'article_id',
        'created_by',
        'type',
        'note',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

