<?php

use Illuminate\Support\Facades\Route;

// Auth controllers
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;

// Training controllers
use App\Http\Controllers\Training\ModuleController;
use App\Http\Controllers\Training\ProgressController;
use App\Http\Controllers\Training\QuizController;
use App\Http\Controllers\Training\BookmarkController;
use App\Http\Controllers\Training\CertificateController;
use App\Http\Controllers\Training\FeedbackController;
use App\Http\Controllers\Training\SectionViewController;
use App\Http\Controllers\Training\ModuleRouteController;

// Admin controllers
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\ApprovalController;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\CertificateAdminController;
use App\Http\Controllers\Admin\FeedbackAnalyticsController;

// AI Assistant controller
use App\Http\Controllers\AI\AssistantController;

// Content Manager controllers
use App\Http\Controllers\ContentManager\ModuleCrudController;
use App\Http\Controllers\ContentManager\SectionCrudController;
use App\Http\Controllers\ContentManager\ChecklistCrudController;
use App\Http\Controllers\ContentManager\QuizCrudController;
use App\Http\Controllers\ContentManager\MediaUploadController;
use App\Http\Controllers\ContentManager\ChunkUploadController;
use App\Http\Controllers\Training\ChatbotController;

// Health check (keep-alive for Render free tier)
Route::get('health', fn () => response()->json(['status' => 'ok', 'ts' => now()->toISOString()]));

// Public auth routes
Route::prefix('auth')->group(function () {
    Route::post('register', [RegisterController::class, 'store']);
    Route::post('login', [LoginController::class, 'store']);
});


// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [LogoutController::class, 'destroy']);
    Route::get('me', [LoginController::class, 'me']);

    // User routes
    Route::group([], function () {

        // Training module routes
        Route::get('modules', [ModuleController::class, 'index']);
        Route::get('modules/{slug}', [ModuleController::class, 'show']);

        Route::get('progress', [ProgressController::class, 'index']);
        Route::get('progress/{moduleId}', [ProgressController::class, 'show']);
        Route::post('progress/{moduleId}/help-viewed', [ProgressController::class, 'markHelpViewed']);
        Route::post('progress/{moduleId}/checklist', [ProgressController::class, 'updateChecklist']);
        Route::post('progress/{moduleId}/quiz', [QuizController::class, 'submit']);
        Route::get('progress/{moduleId}/quiz-answers', [QuizController::class, 'answers']);
        Route::post('progress/{moduleId}/reset', [ProgressController::class, 'reset']);
        Route::post('progress/{moduleId}/resume', [ProgressController::class, 'saveResume']);

        Route::get('takeaways', [ProgressController::class, 'takeaways']);

        Route::get('bookmarks', [BookmarkController::class, 'index']);
        Route::post('bookmarks', [BookmarkController::class, 'store']);
        Route::delete('bookmarks/{id}', [BookmarkController::class, 'destroy']);

        Route::get('certificate', [CertificateController::class, 'show']);
        Route::get('certificates', [CertificateController::class, 'show']);
        Route::get('certificate/download', [CertificateController::class, 'download']);
        Route::get('certificates/{id}/download', [CertificateController::class, 'downloadById']);

        Route::post('feedback/{moduleId}', [FeedbackController::class, 'store']);
        Route::get('feedback/{moduleId}', [FeedbackController::class, 'show']);

        Route::post('section-views', [SectionViewController::class, 'store']);
        Route::get('section-views', [SectionViewController::class, 'index']);
        Route::get('module-route', [ModuleRouteController::class, 'lookup']);

        // Global cross-module chatbot (Ela)
        Route::post('chatbot/ask', [ChatbotController::class, 'ask']);

        // ── Smart Learning Assistant ──────────────────────────────────
        Route::get( 'modules/{moduleId}/assistant/status',      [AssistantController::class, 'status']);
        Route::get( 'modules/{moduleId}/assistant/suggestions', [AssistantController::class, 'suggestions']);
        Route::post('modules/{moduleId}/assistant/chat',        [AssistantController::class, 'chat']);

        // Admin/Trainer assistant management
        Route::middleware('role:ADMIN,TRAINER')->group(function () {
            Route::post( 'modules/{moduleId}/assistant/index',  [AssistantController::class, 'triggerIndex']);
            Route::patch('modules/{moduleId}/assistant/toggle', [AssistantController::class, 'toggle']);
        });

        // Content Manager routes (ADMIN + TRAINER)
        Route::middleware('role:ADMIN,TRAINER')->prefix('cm')->group(function () {
            Route::get('modules', [ModuleCrudController::class, 'index']);
            Route::post('modules', [ModuleCrudController::class, 'store']);
            Route::get('modules/{id}', [ModuleCrudController::class, 'show']);
            Route::put('modules/{id}', [ModuleCrudController::class, 'update']);
            Route::delete('modules/{id}', [ModuleCrudController::class, 'destroy']);

            Route::post('modules/{moduleId}/sections', [SectionCrudController::class, 'store']);
            Route::put('sections/{id}', [SectionCrudController::class, 'update']);
            Route::delete('sections/{id}', [SectionCrudController::class, 'destroy']);

            Route::post('modules/{moduleId}/checklist', [ChecklistCrudController::class, 'store']);
            Route::put('checklist/{id}', [ChecklistCrudController::class, 'update']);
            Route::delete('checklist/{id}', [ChecklistCrudController::class, 'destroy']);

            Route::post('modules/{moduleId}/quiz', [QuizCrudController::class, 'store']);
            Route::put('quiz/{id}', [QuizCrudController::class, 'update']);
            Route::delete('quiz/{id}', [QuizCrudController::class, 'destroy']);

            Route::post('upload', [MediaUploadController::class, 'store']);
            Route::post('upload-chunk', [ChunkUploadController::class, 'storeChunk']);
            Route::post('upload-finalize', [ChunkUploadController::class, 'finalize']);
            Route::get('media', [MediaUploadController::class, 'index']);
            Route::delete('media/{id}', [MediaUploadController::class, 'destroy']);

            Route::get('feedback-analytics', [FeedbackAnalyticsController::class, 'index']);
            Route::get('feedback/{moduleId}', [\App\Http\Controllers\Training\FeedbackController::class, 'index']);
        });

        // Admin routes
        Route::middleware('role:ADMIN')->prefix('admin')->group(function () {
            Route::get('users', [UserManagementController::class, 'index']);
            Route::post('users', [UserManagementController::class, 'store']);
            Route::put('users/{id}', [UserManagementController::class, 'update']);
            Route::delete('users/{id}', [UserManagementController::class, 'destroy']);

            Route::get('pending', [ApprovalController::class, 'index']);
            Route::post('approve/{id}', [ApprovalController::class, 'approve']);
            Route::post('reject/{id}', [ApprovalController::class, 'reject']);

            Route::get('analytics', [AnalyticsController::class, 'index']);
            Route::get('feedback-analytics', [FeedbackAnalyticsController::class, 'index']);
            Route::post('certificate/{userId}', [CertificateAdminController::class, 'issue']);

            // Merchant/Outlet lookup for approval mapping
            Route::get('merchants', function () {
                return \App\Models\Merchant::orderBy('name')->get(['id', 'name']);
            });
            Route::get('outlets', function (\Illuminate\Http\Request $request) {
                $query = \App\Models\Outlet::query();
                if ($request->has('merchant_id')) {
                    $query->where('merchant_id', $request->merchant_id);
                }
                return $query->orderBy('name')->get(['id', 'merchant_id', 'name']);
            });
        });
    });
});
