<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    public const CREATED_AT = null;

    public $incrementing = false;

    protected $primaryKey = 'key';

    protected $keyType = 'string';

    protected $fillable = ['key', 'value'];

    protected $casts = [
        'value' => 'array',
        'updated_at' => 'datetime',
    ];
}

