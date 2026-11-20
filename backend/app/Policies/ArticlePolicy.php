<?php

namespace App\Policies;

use App\Models\Article;
use App\Models\User;

class ArticlePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, Article $article): bool
    {
        if ($user->isEditor()) {
            return true;
        }

        return $article->author_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->is_active && in_array($user->roleName(), ['admin', 'editor', 'journalist'], true);
    }

    public function update(User $user, Article $article): bool
    {
        if ($user->isEditor()) {
            return true;
        }

        // Journalist can only edit own draft articles (locked when in_review/scheduled/published/archived)
        return $article->author_id === $user->id && $article->status === 'draft';
    }

    public function delete(User $user, Article $article): bool
    {
        return $user->isAdmin();
    }

    public function transition(User $user, Article $article, string $targetStatus): bool
    {
        $from = $article->status;

        return match ("{$from}->{$targetStatus}") {
            'draft->in_review' => $user->isEditor() || $article->author_id === $user->id,
            'in_review->draft',
            'in_review->published',
            'in_review->scheduled',
            'scheduled->draft',
            'scheduled->in_review',
            'published->archived' => $user->isEditor(),
            'archived->published' => $user->isAdmin(),
            default => false,
        };
    }

    public function addCorrection(User $user, Article $article): bool
    {
        return $user->isEditor() && $article->status === 'published';
    }
}

