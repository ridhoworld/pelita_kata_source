<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->string('file_url', 500);
            $table->string('file_type', 50)->default('image/webp');
            $table->unsignedInteger('width')->default(0);
            $table->unsignedInteger('height')->default(0);
            $table->json('variants')->nullable();
            $table->text('caption')->nullable();
            $table->string('credit_source', 255);
            $table->string('alt_text', 255);
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreign('avatar_media_id')->references('id')->on('media')->nullOnDelete();
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('parent_id')->nullable();
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->text('description')->nullable();
            $table->smallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('categories')->nullOnDelete();
        });

        Schema::create('tags', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->timestamps();
        });

        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('author_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('editor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('category_id');
            $table->string('title', 255);
            $table->string('slug', 255)->unique();
            $table->text('excerpt')->nullable();
            $table->json('content_json')->nullable();
            $table->longText('content_html')->nullable();
            $table->longText('content_text')->nullable();
            $table->foreignId('featured_image_id')->nullable()->constrained('media')->nullOnDelete();
            $table->enum('status', ['draft', 'in_review', 'scheduled', 'published', 'archived'])->default('draft');
            $table->enum('article_type', ['news', 'opinion', 'feature', 'in_depth'])->default('news');
            $table->boolean('is_breaking')->default(false);
            $table->boolean('is_featured')->default(false);
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedSmallInteger('reading_time')->default(1);
            $table->string('review_note', 500)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('category_id')->references('id')->on('categories')->restrictOnDelete();
            $table->index(['status', 'published_at']);
            $table->index(['category_id', 'status', 'published_at']);
            $table->index(['author_id', 'status', 'published_at']);
            $table->index(['is_featured', 'status', 'published_at']);
            $table->index(['is_breaking', 'status', 'published_at']);
        });

        if (in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            Schema::table('articles', function (Blueprint $table) {
                $table->fullText(['title', 'excerpt', 'content_text'], 'articles_fulltext_idx');
            });
        }

        Schema::create('article_tags', function (Blueprint $table) {
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->unsignedInteger('tag_id');
            $table->primary(['article_id', 'tag_id']);
            $table->index('tag_id');
            $table->foreign('tag_id')->references('id')->on('tags')->cascadeOnDelete();
        });

        Schema::create('article_seo', function (Blueprint $table) {
            $table->foreignId('article_id')->primary()->constrained('articles')->cascadeOnDelete();
            $table->string('meta_title', 70)->nullable();
            $table->string('meta_description', 170)->nullable();
            $table->string('canonical_url', 500)->nullable();
            $table->string('og_image_url', 500)->nullable();
        });

        Schema::create('article_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->foreignId('edited_by')->constrained('users')->restrictOnDelete();
            $table->string('title_snapshot', 255);
            $table->json('content_snapshot')->nullable();
            $table->string('status_snapshot', 20);
            $table->string('revision_note', 500)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['article_id', 'created_at']);
        });

        Schema::create('article_corrections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->enum('type', ['correction', 'update'])->default('correction');
            $table->text('note');
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title', 200);
            $table->string('slug', 120)->unique();
            $table->longText('content_html');
            $table->boolean('is_published')->default(true);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('key', 100)->primary();
            $table->json('value')->nullable();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 80);
            $table->string('subject_type', 120)->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['action', 'created_at']);
        });

        Schema::create('article_view_daily', function (Blueprint $table) {
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('views')->default(0);
            $table->primary(['article_id', 'date']);
        });

        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('email', 190);
            $table->string('topic', 80)->default('umum');
            $table->text('message');
            $table->string('ip_hash', 64)->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('article_view_daily');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('pages');
        Schema::dropIfExists('article_corrections');
        Schema::dropIfExists('article_revisions');
        Schema::dropIfExists('article_seo');
        Schema::dropIfExists('article_tags');
        Schema::dropIfExists('articles');
        Schema::dropIfExists('tags');
        Schema::dropIfExists('categories');
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['avatar_media_id']);
        });
        Schema::dropIfExists('media');
    }
};

