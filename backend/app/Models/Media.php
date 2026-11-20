<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Media extends Model
{
    public const UPDATED_AT = null;

    protected $table = 'media';

    protected $fillable = [
        'uploaded_by',
        'file_url',
        'file_type',
        'width',
        'height',
        'variants',
        'caption',
        'credit_source',
        'alt_text',
    ];

    protected $casts = [
        'variants' => 'array',
        'width' => 'integer',
        'height' => 'integer',
        'created_at' => 'datetime',
    ];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function featuredInArticles(): HasMany
    {
        return $this->hasMany(Article::class, 'featured_image_id');
    }
}

