<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'role_id',
        'name',
        'username',
        'email',
        'password_hash',
        'bio',
        'avatar_media_id',
        'is_active',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function avatar(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'avatar_media_id');
    }

    public function articles(): HasMany
    {
        return $this->hasMany(Article::class, 'author_id');
    }

    public function editedArticles(): HasMany
    {
        return $this->hasMany(Article::class, 'editor_id');
    }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class, 'uploaded_by');
    }

    public function roleName(): string
    {
        return $this->role?->name ?? '';
    }

    public function isAdmin(): bool
    {
        return $this->roleName() === 'admin';
    }

    public function isEditor(): bool
    {
        return in_array($this->roleName(), ['admin', 'editor'], true);
    }

    public function isJournalist(): bool
    {
        return $this->roleName() === 'journalist';
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->isAdmin()) {
            return true;
        }
        $permissions = $this->role?->permissions ?? [];

        return in_array($permission, $permissions, true);
    }
}
