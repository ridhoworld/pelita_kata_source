<?php

namespace Tests\Feature;

use App\Models\Article;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class PelitaKataApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_public_can_read_published_article_and_cannot_read_draft_or_in_review(): void
    {
        $this->getJson('/api/v1/home')->assertOk()->assertJsonStructure([
            'data' => ['breaking', 'headlines', 'latest', 'rubrics'],
        ]);

        $this->getJson('/api/v1/articles/menghidupkan-kembali-angkutan-kota-dari-rute-pinggiran')
            ->assertOk()
            ->assertJsonPath('data.article.status', 'published');

        $this->getJson('/api/v1/articles/catatan-lapangan-pengelolaan-sampah-organik-tingkat-rt')
            ->assertNotFound();

        $this->getJson('/api/v1/articles/peta-jalur-sepeda-aman-menuju-sekolah-di-pusat-kota')
            ->assertNotFound();
    }

    public function test_search_requires_min_3_chars_and_returns_matches(): void
    {
        $this->getJson('/api/v1/search?q=ai')->assertStatus(422);

        $this->getJson('/api/v1/search?q=literasi')
            ->assertOk()
            ->assertJsonPath('data.query', 'literasi');
    }

    public function test_editorial_workflow_enforces_rbac_and_corrections(): void
    {
        // Login as journalist (Budi)
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'budi@pelitakata.id',
            'password' => 'PelitaKata2026!',
        ])->assertOk();

        $budiToken = $login->json('data.token');

        $draft = Article::where('status', 'draft')->firstOrFail();

        // Journalist submits draft to in_review
        $this->withToken($budiToken)
            ->postJson("/api/v1/cms/articles/{$draft->id}/transition", [
                'target_status' => 'in_review',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_review');

        // Journalist cannot publish own article
        $this->withToken($budiToken)
            ->postJson("/api/v1/cms/articles/{$draft->id}/transition", [
                'target_status' => 'published',
            ])
            ->assertForbidden();

        // Journalist cannot edit article while in_review
        $this->withToken($budiToken)
            ->putJson("/api/v1/cms/articles/{$draft->id}", ['title' => 'Edit terlarang'])
            ->assertForbidden();

        // Login as editor (Sari) — reset cached guard user between tokens in same test
        $this->app['auth']->forgetGuards();
        $editorToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'sari@pelitakata.id',
            'password' => 'PelitaKata2026!',
        ])->assertOk()->json('data.token');
        $this->app['auth']->forgetGuards();

        // Returning in_review -> draft requires note
        $this->withToken($editorToken)
            ->postJson("/api/v1/cms/articles/{$draft->id}/transition", [
                'target_status' => 'draft',
            ])
            ->assertStatus(422);

        // Editor publishes article
        $this->withToken($editorToken)
            ->postJson("/api/v1/cms/articles/{$draft->id}/transition", [
                'target_status' => 'published',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'published');

        // Editor adds correction
        $this->withToken($editorToken)
            ->postJson("/api/v1/cms/articles/{$draft->id}/corrections", [
                'type' => 'correction',
                'note' => 'Koreksi angka tonase sampah dari 40% menjadi 42%.',
            ])
            ->assertCreated();
    }

    public function test_scheduled_command_auto_publishes_due_articles(): void
    {
        $scheduled = Article::where('status', 'scheduled')->firstOrFail();
        $scheduled->update(['published_at' => now()->subMinute()]);

        Artisan::call('articles:publish-scheduled');

        $this->assertEquals('published', $scheduled->fresh()->status);
    }

    public function test_slug_change_creates_redirect_and_contact_inbox_works(): void
    {
        $editorToken = $this->postJson('/api/v1/auth/login', [
            'email' => 'sari@pelitakata.id',
            'password' => 'PelitaKata2026!',
        ])->assertOk()->json('data.token');

        $published = Article::where('status', 'published')->firstOrFail();
        $oldSlug = $published->slug;
        $newSlug = $oldSlug . '-edisi-revisi';

        $this->withToken($editorToken)
            ->putJson("/api/v1/cms/articles/{$published->id}", ['slug' => $newSlug])
            ->assertOk()
            ->assertJsonPath('data.slug', $newSlug);

        $this->getJson("/api/v1/articles/{$oldSlug}")
            ->assertOk()
            ->assertJsonPath('data.redirect_to', $newSlug);

        // Submit public contact message and read in CMS inbox
        $this->postJson('/api/v1/contact', [
            'name' => 'Rani Pembaca',
            'email' => 'rani@example.com',
            'topic' => 'koreksi',
            'message' => 'Mohon periksa penulisan nama kelurahan di paragraf ketiga.',
        ])->assertCreated();

        $this->withToken($editorToken)
            ->getJson('/api/v1/cms/messages')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 1);
    }
}
