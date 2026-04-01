<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TrainingModule extends Model
{
    protected $table = 'lms_training_modules';

    protected $fillable = [
        'title', 'slug', 'description', 'estimated_minutes', 'icon', 'display_order',
        'video_url', 'image_urls', 'document_urls', 'points_reward',
        'quiz_enabled', 'require_help_viewed', 'require_checklist', 'require_quiz',
        'certificate_enabled', 'completion_rules',
        'is_published', 'page_route', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'image_urls' => 'array',
        'document_urls' => 'array',
        'completion_rules' => 'array',
        'is_published' => 'boolean',
        'quiz_enabled' => 'boolean',
        'certificate_enabled' => 'boolean',
        'require_help_viewed' => 'boolean',
        'require_checklist' => 'boolean',
        'require_quiz' => 'boolean',
        'points_reward' => 'integer',
        'display_order' => 'integer',
        'estimated_minutes' => 'integer',
    ];

    public static function boot() {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->title);
            }
        });
    }

    public function sections() { return $this->hasMany(TrainingSection::class, 'module_id')->orderBy('display_order'); }
    public function checklists() { return $this->hasMany(TrainingChecklist::class, 'module_id')->orderBy('display_order'); }
    public function quizzes() { return $this->hasMany(TrainingQuiz::class, 'module_id')->orderBy('display_order'); }
    public function progress() { return $this->hasMany(TrainingProgress::class, 'module_id'); }
    public function bookmarks() { return $this->hasMany(Bookmark::class, 'module_id'); }
    public function routes() { return $this->hasMany(ModuleRoute::class, 'module_id'); }
    public function sectionViews() { return $this->hasMany(SectionView::class, 'module_id'); }
    public function quizAttempts() { return $this->hasMany(QuizAttempt::class, 'module_id'); }
    public function certificates() { return $this->hasMany(Certificate::class, 'module_id'); }
    public function quizMetadata() { return $this->hasOne(QuizMetadata::class, 'module_id'); }
    public function feedback() { return $this->hasMany(ModuleFeedback::class, 'module_id'); }
}
