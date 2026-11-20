<?php

namespace App\Console\Commands;

use App\Models\ArticleRevision;
use Illuminate\Console\Command;

class PruneDraftRevisions extends Command
{
    protected $signature = 'articles:prune-draft-revisions';

    protected $description = 'Pangkas revisi autosave draf yang lebih tua dari 30 hari (PRD 6.2)';

    public function handle(): int
    {
        $deleted = ArticleRevision::where('status_snapshot', 'draft')
            ->where('revision_note', 'Simpan otomatis')
            ->where('created_at', '<', now()->subDays(30))
            ->delete();

        $this->info("Pruned {$deleted} old draft autosave revision(s).");

        return self::SUCCESS;
    }
}

