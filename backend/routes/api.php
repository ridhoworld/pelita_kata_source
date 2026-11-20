<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\Cms\AdminController;
use App\Http\Controllers\Api\V1\Cms\ArticleController as CmsArticleController;
use App\Http\Controllers\Api\V1\Cms\DashboardController;
use App\Http\Controllers\Api\V1\Cms\MediaController;
use App\Http\Controllers\Api\V1\Cms\TaxonomyController;
use App\Http\Controllers\Api\V1\PublicController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public Read-Only Endpoints
    Route::get('/home', [PublicController::class, 'home']);
    Route::get('/articles', [PublicController::class, 'articles']);
    Route::get('/articles/{slug}', [PublicController::class, 'articleDetail']);
    Route::post('/articles/{slug}/view', [PublicController::class, 'recordView'])->middleware('throttle:60,1');
    Route::get('/categories', [PublicController::class, 'categories']);
    Route::get('/categories/{slug}/articles', [PublicController::class, 'categoryArticles']);
    Route::get('/tags/{slug}/articles', [PublicController::class, 'tagArticles']);
    Route::get('/search', [PublicController::class, 'search'])->middleware('throttle:30,1');
    Route::get('/authors/{username}', [PublicController::class, 'authorProfile']);
    Route::get('/pages/{slug}', [PublicController::class, 'pageDetail']);
    Route::get('/sitemap-data', [PublicController::class, 'sitemapData']);
    Route::get('/news-sitemap-data', [PublicController::class, 'newsSitemapData']);
    Route::get('/settings', [PublicController::class, 'publicSettings']);
    Route::post('/contact', [PublicController::class, 'submitContact'])->middleware('throttle:5,1');

    // Authentication (Editorial Staff Only)
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // CMS Endpoints
        Route::prefix('cms')->group(function () {
            Route::get('/dashboard', [DashboardController::class, 'index']);

            // Articles
            Route::get('/articles', [CmsArticleController::class, 'index']);
            Route::post('/articles', [CmsArticleController::class, 'store']);
            Route::post('/articles/bulk-archive', [CmsArticleController::class, 'bulkArchive']);
            Route::get('/articles/{article}', [CmsArticleController::class, 'show']);
            Route::put('/articles/{article}', [CmsArticleController::class, 'update']);
            Route::delete('/articles/{article}', [CmsArticleController::class, 'destroy']);
            Route::post('/articles/{article}/transition', [CmsArticleController::class, 'transition']);
            Route::get('/articles/{article}/revisions', [CmsArticleController::class, 'revisions']);
            Route::post('/articles/{article}/revisions/{revision}/restore', [CmsArticleController::class, 'restoreRevision']);
            Route::post('/articles/{article}/corrections', [CmsArticleController::class, 'addCorrection']);
            Route::delete('/articles/{article}/corrections/{correction}', [CmsArticleController::class, 'deleteCorrection']);
            Route::post('/articles/{article}/preview-token', [CmsArticleController::class, 'previewToken']);

            // Media
            Route::get('/media', [MediaController::class, 'index']);
            Route::post('/media', [MediaController::class, 'store']);
            Route::put('/media/{media}', [MediaController::class, 'update']);
            Route::delete('/media/{media}', [MediaController::class, 'destroy']);

            // Taxonomy
            Route::get('/categories', [TaxonomyController::class, 'categories']);
            Route::post('/categories', [TaxonomyController::class, 'storeCategory']);
            Route::put('/categories/{category}', [TaxonomyController::class, 'updateCategory']);
            Route::delete('/categories/{category}', [TaxonomyController::class, 'destroyCategory']);

            Route::get('/tags', [TaxonomyController::class, 'tags']);
            Route::post('/tags', [TaxonomyController::class, 'storeTag']);
            Route::put('/tags/{tag}', [TaxonomyController::class, 'updateTag']);
            Route::delete('/tags/{tag}', [TaxonomyController::class, 'destroyTag']);
            Route::post('/tags/merge', [TaxonomyController::class, 'mergeTags']);

            // Admin
            Route::get('/pages', [AdminController::class, 'pages']);
            Route::post('/pages', [AdminController::class, 'storePage']);
            Route::put('/pages/{page}', [AdminController::class, 'updatePage']);
            Route::delete('/pages/{page}', [AdminController::class, 'destroyPage']);

            Route::get('/roles', [AdminController::class, 'roles']);
            Route::get('/users', [AdminController::class, 'users']);
            Route::post('/users', [AdminController::class, 'storeUser']);
            Route::put('/users/{user}', [AdminController::class, 'updateUser']);

            Route::get('/settings', [AdminController::class, 'settings']);
            Route::put('/settings', [AdminController::class, 'updateSettings']);

            Route::get('/activity-logs', [AdminController::class, 'activityLogs']);

            // Contact & Hak Jawab Inbox (Editor & Admin)
            Route::get('/messages', [AdminController::class, 'messages']);
            Route::patch('/messages/{message}/read', [AdminController::class, 'markMessageRead']);
            Route::delete('/messages/{message}', [AdminController::class, 'deleteMessage']);
        });
    });
});
