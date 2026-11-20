<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArticleRevision extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'article_id',
        'edited_by',
        'title_snapshot',
        'content_snapshot',
        'status_snapshot',
        'revision_note',
    ];

    protected $casts = [
        'content_snapshot' => 'array',
        'created_at' => 'datetime',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function editor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'edited_by');
    }
}

