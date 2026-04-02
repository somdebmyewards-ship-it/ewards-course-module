-- ============================================================
-- eWards Learning Hub — Complete Database Schema
-- All tables use lms_ prefix for TiDB Cloud
-- Run this in TiDB Cloud SQL Editor on database: ewards_lms
-- ============================================================

USE ewards_lms;

-- ── Laravel migrations tracking ─────────────────────────────
CREATE TABLE IF NOT EXISTS `migrations` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 1. Merchants ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_merchants` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Outlets ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_outlets` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `merchant_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `lms_outlets_merchant_id_foreign` FOREIGN KEY (`merchant_id`) REFERENCES `lms_merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Users (with all modifications merged) ────────────────
CREATE TABLE IF NOT EXISTS `lms_users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN','TRAINER','CASHIER','CLIENT') NOT NULL DEFAULT 'CASHIER',
    `approved` TINYINT(1) NOT NULL DEFAULT 0,
    `merchant_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `outlet_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `merchant_name_entered` VARCHAR(255) NULL DEFAULT NULL,
    `outlet_name_entered` VARCHAR(255) NULL DEFAULT NULL,
    `ewards_reference` VARCHAR(255) NULL DEFAULT NULL,
    `designation` VARCHAR(255) NULL DEFAULT NULL,
    `mobile` VARCHAR(255) NULL DEFAULT NULL,
    `points` INT UNSIGNED NOT NULL DEFAULT 0,
    `approved_at` TIMESTAMP NULL DEFAULT NULL,
    `approved_by` BIGINT UNSIGNED NULL DEFAULT NULL,
    `rejection_reason` VARCHAR(255) NULL DEFAULT NULL,
    `remember_token` VARCHAR(100) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `lms_users_email_unique` (`email`),
    CONSTRAINT `lms_users_merchant_id_foreign` FOREIGN KEY (`merchant_id`) REFERENCES `lms_merchants` (`id`) ON DELETE SET NULL,
    CONSTRAINT `lms_users_outlet_id_foreign` FOREIGN KEY (`outlet_id`) REFERENCES `lms_outlets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Password Reset Tokens ────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL PRIMARY KEY,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. Failed Jobs ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_failed_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `lms_failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. Personal Access Tokens ───────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_personal_access_tokens` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `tokenable_type` VARCHAR(255) NOT NULL,
    `tokenable_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `token` VARCHAR(64) NOT NULL,
    `abilities` TEXT NULL DEFAULT NULL,
    `last_used_at` TIMESTAMP NULL DEFAULT NULL,
    `expires_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `lms_personal_access_tokens_token_unique` (`token`),
    KEY `lms_personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`, `tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. Training Modules (with all additions merged) ─────────
CREATE TABLE IF NOT EXISTS `lms_modules` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `estimated_minutes` INT NOT NULL DEFAULT 5,
    `icon` VARCHAR(500) NULL DEFAULT NULL,
    `display_order` INT UNSIGNED NOT NULL,
    `video_url` VARCHAR(500) NOT NULL DEFAULT '',
    `image_urls` JSON NULL DEFAULT NULL,
    `document_urls` JSON NULL DEFAULT NULL,
    `points_reward` INT UNSIGNED NOT NULL DEFAULT 10,
    `quiz_enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `completion_rules` JSON NULL DEFAULT NULL,
    `require_help_viewed` TINYINT(1) NOT NULL DEFAULT 1,
    `require_checklist` TINYINT(1) NOT NULL DEFAULT 1,
    `require_quiz` TINYINT(1) NOT NULL DEFAULT 0,
    `certificate_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `is_published` TINYINT(1) NOT NULL DEFAULT 0,
    `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
    `updated_by` BIGINT UNSIGNED NULL DEFAULT NULL,
    `page_route` VARCHAR(255) NOT NULL DEFAULT '',
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `lms_modules_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. Training Sections (with all additions merged) ────────
CREATE TABLE IF NOT EXISTS `lms_sections` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `body` LONGTEXT NOT NULL,
    `content_type` ENUM('text','video','image','document') NOT NULL DEFAULT 'text',
    `media_url` VARCHAR(500) NOT NULL DEFAULT '',
    `video_url` VARCHAR(255) NULL DEFAULT NULL,
    `image_urls` JSON NULL DEFAULT NULL,
    `document_urls` JSON NULL DEFAULT NULL,
    `display_order` INT UNSIGNED NOT NULL,
    `key_takeaway` TEXT NULL DEFAULT NULL,
    `try_this_action` TEXT NULL DEFAULT NULL,
    `is_required` TINYINT(1) NOT NULL DEFAULT 1,
    `status` VARCHAR(255) NOT NULL DEFAULT 'published',
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `lms_sections_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE,
    KEY `ts_module_required_idx` (`module_id`, `is_required`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. Training Checklists ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_checklists` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `label` VARCHAR(500) NOT NULL,
    `display_order` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `lms_checklists_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 10. Training Quizzes ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_quizzes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `quiz_metadata_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `question` TEXT NOT NULL,
    `options` JSON NOT NULL,
    `correct_answer` VARCHAR(500) NOT NULL,
    `explanation` TEXT NULL DEFAULT NULL,
    `display_order` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `lms_quizzes_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 11. Training Progress (with all additions merged) ───────
CREATE TABLE IF NOT EXISTS `lms_progress` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `help_viewed` TINYINT(1) NOT NULL DEFAULT 0,
    `help_viewed_at` TIMESTAMP NULL DEFAULT NULL,
    `checklist_state` JSON NULL DEFAULT NULL,
    `checklist_completed` TINYINT(1) NOT NULL DEFAULT 0,
    `checklist_completed_at` TIMESTAMP NULL DEFAULT NULL,
    `quiz_completed` TINYINT(1) NOT NULL DEFAULT 0,
    `quiz_completed_at` TIMESTAMP NULL DEFAULT NULL,
    `quiz_score` INT UNSIGNED NOT NULL DEFAULT 0,
    `quiz_answers` JSON NULL DEFAULT NULL,
    `progress_percent` INT NOT NULL DEFAULT 0,
    `module_completed` TINYINT(1) NOT NULL DEFAULT 0,
    `module_completed_at` TIMESTAMP NULL DEFAULT NULL,
    `last_section_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `lms_progress_user_module_unique` (`user_id`, `module_id`),
    KEY `tp_module_id_idx` (`module_id`),
    KEY `tp_module_completed_idx` (`module_completed`),
    KEY `tp_module_completed_combo_idx` (`module_id`, `module_completed`),
    CONSTRAINT `lms_progress_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `lms_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_progress_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_progress_last_section_id_foreign` FOREIGN KEY (`last_section_id`) REFERENCES `lms_sections` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 12. Bookmarks ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_bookmarks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `section_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `lms_bookmarks_user_section_unique` (`user_id`, `section_id`),
    CONSTRAINT `lms_bookmarks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `lms_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_bookmarks_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_bookmarks_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `lms_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 13. Certificates (with types + composite unique) ────────
CREATE TABLE IF NOT EXISTS `lms_certificates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `certificate_type` VARCHAR(255) NOT NULL DEFAULT 'module',
    `certificate_code` VARCHAR(255) NULL DEFAULT NULL,
    `issued_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `enabled_by_admin` TINYINT(1) NOT NULL DEFAULT 0,
    `certificate_url` VARCHAR(500) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `cert_user_type_module` (`user_id`, `certificate_type`, `module_id`),
    CONSTRAINT `lms_certificates_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `lms_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_certificates_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 14. Media ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_media` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `filename` VARCHAR(255) NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size` INT UNSIGNED NOT NULL,
    `disk` VARCHAR(50) NOT NULL DEFAULT 'local',
    `path` VARCHAR(500) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `uploaded_by` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `lms_media_uploaded_by_foreign` FOREIGN KEY (`uploaded_by`) REFERENCES `lms_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 15. Section Views ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_section_views` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `section_id` BIGINT UNSIGNED NOT NULL,
    `viewed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `lms_section_views_user_section_unique` (`user_id`, `section_id`),
    KEY `sv_module_id_idx` (`module_id`),
    KEY `sv_module_user_idx` (`module_id`, `user_id`),
    CONSTRAINT `lms_section_views_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `lms_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_section_views_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_section_views_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `lms_sections` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 16. Module Routes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_module_routes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `route_path` VARCHAR(255) NOT NULL,
    `section_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `context_label` VARCHAR(255) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `lms_module_routes_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_module_routes_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `lms_sections` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 17. Quiz Attempts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_quiz_attempts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `score_percent` INT NOT NULL,
    `passed` TINYINT(1) NOT NULL,
    `answers` JSON NULL DEFAULT NULL,
    `attempted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `lms_quiz_attempts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `lms_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_quiz_attempts_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 18. Quiz Metadata ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_quiz_metadata` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(255) NOT NULL DEFAULT 'Module Quiz',
    `passing_percent` INT NOT NULL DEFAULT 75,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    CONSTRAINT `lms_quiz_metadata_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 19. Module Feedback ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_module_feedback` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `rating` TINYINT NOT NULL DEFAULT 0,
    `comment` TEXT NULL DEFAULT NULL,
    `improvement_suggestion` TEXT NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `lms_module_feedback_user_module_unique` (`user_id`, `module_id`),
    KEY `mf_module_id_idx` (`module_id`),
    KEY `mf_rating_idx` (`rating`),
    CONSTRAINT `lms_module_feedback_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `lms_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_module_feedback_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 20. Module AI Settings ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_ai_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `assistant_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `use_cross_module_fallback` TINYINT(1) NOT NULL DEFAULT 0,
    `last_indexed_at` TIMESTAMP NULL DEFAULT NULL,
    `index_status` VARCHAR(30) NOT NULL DEFAULT 'not_indexed',
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    UNIQUE KEY `lms_ai_settings_module_id_unique` (`module_id`),
    CONSTRAINT `lms_ai_settings_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 21. Module AI Documents ─────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_ai_documents` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `source_type` VARCHAR(30) NOT NULL,
    `source_id` BIGINT UNSIGNED NULL DEFAULT NULL,
    `source_title` VARCHAR(255) NULL DEFAULT NULL,
    `file_path` VARCHAR(255) NULL DEFAULT NULL,
    `raw_text` LONGTEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `indexed_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    KEY `lms_ai_documents_module_source_idx` (`module_id`, `source_type`),
    CONSTRAINT `lms_ai_documents_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 22. Module AI Chunks ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_ai_chunks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `document_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `chunk_text` TEXT NOT NULL,
    `embedding` LONGTEXT NOT NULL,
    `chunk_index` SMALLINT NOT NULL DEFAULT 0,
    `source_type` VARCHAR(30) NOT NULL,
    `source_title` VARCHAR(255) NULL DEFAULT NULL,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    KEY `lms_ai_chunks_module_id_idx` (`module_id`),
    KEY `lms_ai_chunks_document_id_idx` (`document_id`),
    CONSTRAINT `lms_ai_chunks_document_id_foreign` FOREIGN KEY (`document_id`) REFERENCES `lms_ai_documents` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lms_ai_chunks_module_id_foreign` FOREIGN KEY (`module_id`) REFERENCES `lms_modules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 23. Module AI Chat Logs ─────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_ai_chat_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `module_id` BIGINT UNSIGNED NOT NULL,
    `question` TEXT NOT NULL,
    `answer` LONGTEXT NOT NULL,
    `sources` JSON NULL DEFAULT NULL,
    `retrieved_chunk_ids` JSON NULL DEFAULT NULL,
    `chunks_retrieved` SMALLINT NOT NULL DEFAULT 0,
    `answer_found` TINYINT(1) NOT NULL DEFAULT 1,
    `tokens_used` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NULL DEFAULT NULL,
    `updated_at` TIMESTAMP NULL DEFAULT NULL,
    KEY `lms_ai_chat_logs_user_module_idx` (`user_id`, `module_id`),
    KEY `lms_ai_chat_logs_created_at_idx` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 24. Jobs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lms_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `attempts` TINYINT UNSIGNED NOT NULL,
    `reserved_at` INT UNSIGNED NULL DEFAULT NULL,
    `available_at` INT UNSIGNED NOT NULL,
    `created_at` INT UNSIGNED NOT NULL,
    KEY `lms_jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 25. Developer Brief Composite Indexes ───────────────────
CREATE INDEX `idx_lms_bookmarks_user_module` ON `lms_bookmarks` (`user_id`, `module_id`);
CREATE INDEX `idx_lms_certificates_user_type` ON `lms_certificates` (`user_id`, `certificate_type`);
CREATE INDEX `idx_lms_quiz_attempts_user_module` ON `lms_quiz_attempts` (`user_id`, `module_id`);
CREATE INDEX `idx_lms_progress_user` ON `lms_progress` (`user_id`);
CREATE INDEX `idx_lms_module_feedback_module` ON `lms_module_feedback` (`module_id`);

-- ── Mark all migrations as run ──────────────────────────────
INSERT INTO `migrations` (`migration`, `batch`) VALUES
('2014_10_12_000000_create_users_table', 1),
('2014_10_12_100000_create_password_reset_tokens_table', 1),
('2019_08_19_000000_create_failed_jobs_table', 1),
('2019_12_14_000001_create_personal_access_tokens_table', 1),
('2024_01_01_000001_create_merchants_table', 1),
('2024_01_01_000002_create_outlets_table', 1),
('2024_01_01_000003_modify_users_table', 1),
('2024_01_01_000004_create_training_modules_table', 1),
('2024_01_01_000005_create_training_sections_table', 1),
('2024_01_01_000006_create_training_checklists_table', 1),
('2024_01_01_000007_create_training_quizzes_table', 1),
('2024_01_01_000008_create_training_progress_table', 1),
('2024_01_01_000009_create_bookmarks_table', 1),
('2024_01_01_000010_create_certificates_table', 1),
('2024_01_01_000011_create_media_table', 1),
('2024_01_01_000012_create_section_views_table', 1),
('2024_01_01_000013_create_module_routes_table', 1),
('2024_01_01_000014_create_quiz_attempts_table', 1),
('2024_01_01_000015_update_users_add_registration_fields', 1),
('2024_01_01_000016_update_certificates_add_types', 1),
('2024_01_01_000017_add_missing_module_fields', 1),
('2024_01_01_000018_add_missing_section_fields', 1),
('2024_01_01_000019_add_progress_percent', 1),
('2024_01_01_000020_create_quiz_metadata_table', 1),
('2024_01_01_000021_add_try_this_action_to_sections', 1),
('2024_01_01_000022_add_section_media_fields', 1),
('2024_01_01_000023_add_completion_rules_to_modules', 1),
('2024_01_01_000024_add_media_to_sections', 1),
('2024_01_01_000025_add_is_required_to_sections', 1),
('2024_01_01_000026_add_completion_config_to_modules', 1),
('2026_03_28_131228_create_module_feedback_table', 1),
('2026_03_28_141515_remove_user_unique_from_certificates', 1),
('2026_03_29_000001_create_module_ai_tables', 1),
('2026_03_31_092050_add_quiz_answers_to_training_progress', 1),
('2026_03_31_100000_add_performance_indexes', 1),
('2026_03_31_101935_create_jobs_table', 1),
('2026_03_31_110000_increase_icon_column_size', 1),
('2026_04_01_000001_rename_tables_with_lms_prefix', 1),
('2026_04_01_000002_add_developer_brief_indexes', 1),
('2026_04_02_000001_rename_lms_training_to_lms', 1);

-- ============================================================
-- DONE! All 24 tables + migrations table created.
-- Now redeploy Render (it will skip migrations since they're marked as run)
-- ============================================================
