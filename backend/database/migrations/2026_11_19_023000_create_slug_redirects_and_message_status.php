<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('slug_redirects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('article_id')->constrained('articles')->cascadeOnDelete();
            $table->string('old_slug', 255)->unique();
            $table->string('new_slug', 255);
            $table->timestamp('created_at')->useCurrent();

            $table->index('new_slug');
        });

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->boolean('is_read')->default(false)->after('message');
        });
    }

    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropColumn('is_read');
        });
        Schema::dropIfExists('slug_redirects');
    }
};

