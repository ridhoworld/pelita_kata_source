<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'name',
        'email',
        'topic',
        'message',
        'is_read',
        'ip_hash',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'created_at' => 'datetime',
    ];
}

