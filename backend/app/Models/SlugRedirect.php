<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SlugRedirect extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['article_id', 'old_slug', 'new_slug'];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }
}

