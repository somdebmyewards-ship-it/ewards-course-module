# eWards Learning Hub - Implementation Guide

## Overview

eWards Learning Hub is a **Learning Management System (LMS)** built for employee training. It provides structured training modules with sections, checklists, quizzes, certificates, and an AI-powered chatbot assistant.

---

## Architecture

```
Browser (React SPA)
    |
    | HTTP/JSON (Axios)
    |
Laravel API (PHP)
    |
    ├── MySQL Database
    ├── File Storage (uploads)
    └── External APIs
        ├── HuggingFace (embeddings)
        └── Groq (LLM chat)
```

**Pattern:** Single Page Application (SPA) with REST API backend.
- Frontend: React handles all UI rendering and routing
- Backend: Laravel serves JSON API endpoints only
- `routes/web.php` has a single catch-all that serves the React SPA
- All business logic is in `routes/api.php`

---

## User Roles & Permissions

| Role | Access |
|------|--------|
| **ADMIN** | Full access: user management, approvals, analytics, content management |
| **TRAINER** | Content management, feedback analytics |
| **CASHIER** | Learning hub, progress, bookmarks, certificates |
| **CLIENT** | Learning hub, progress, bookmarks, certificates |

**Middleware chain:** `auth:sanctum` > `approved` > `role:ADMIN,TRAINER`

---

## Core Features Implementation

### 1. Training Modules
- **Model:** `TrainingModule` - stores title, slug, description, icon, video_url, quiz settings
- **Controller:** `ModuleController` (public browsing), `ModuleCrudController` (admin CRUD)
- **Frontend:** `LearningHub.tsx` (listing), `ModuleDetail.tsx` (learning experience)

**Module lifecycle:**
1. Admin creates module in Content Manager
2. Adds sections (HTML content), checklists, quiz questions
3. Uploads introductory video
4. Publishes module (is_published = true)
5. Users see it in Learning Hub

### 2. Learning Flow
Each module has 3 steps:
1. **Content** (sections) - Read through, mark as viewed
2. **Quiz** - Answer questions, need passing score
3. **Completion** - Module marked complete, points awarded, certificate issued

**Key files:**
- `ProgressController.php` - tracks help_viewed, checklist_state, quiz state
- `SectionViewController.php` - tracks which sections user has read
- `QuizController.php` - quiz submission and scoring

### 3. Quiz System
- Questions stored in `training_quizzes` table
- Each has: question text, options (JSON array), correct_answer, explanation
- Quiz metadata (passing %, retry allowed) in `quiz_metadata` table
- User attempts logged in `quiz_attempts` table
- Score calculated as percentage of correct answers

### 4. Certificate Generation
- Auto-issued when all modules completed (path certificate)
- Auto-issued at 300+ points (expert certificate)
- Per-module certificates if `certificate_enabled = true`
- PDF generated with `barryvdh/laravel-dompdf`
- Template: `resources/views/certificates/template.blade.php`

### 5. AI Chatbot (Ask Ela)
Two AI systems:

**a) Module Assistant** (`AssistantController.php`)
- RAG-based: indexes module content into chunks
- Uses HuggingFace embeddings for semantic search
- Uses Groq LLM for answer generation
- Per-module toggle (admin can enable/disable)

**b) Global Chatbot** (`ChatbotController.php`)
- Searches across all modules
- Falls back to section content search
- Uses same embedding + LLM pipeline

**AI Services** (`app/Services/AI/`):
- `ChunkingService` - splits content into overlapping chunks
- `EmbeddingService` - generates vector embeddings via HuggingFace
- `RetrievalService` - semantic similarity search
- `LLMService` - chat completion via Groq API
- `IndexingService` - orchestrates document indexing

### 6. Bookmarks
- Users can bookmark any section
- Stored in `bookmarks` table (user_id, module_id, section_id)
- Clicking bookmark navigates to that section in the module

### 7. Feedback System
- Per-module: 1-5 star rating + comment + improvement suggestion
- One feedback per user per module
- Admin analytics: NPS score, rating distribution, per-module breakdown

### 8. Points & Levels
| Level | Points Required |
|-------|----------------|
| Beginner | 0 |
| Practitioner | 100 |
| Specialist | 250 |
| Expert | 500 |

Points awarded on module completion (configurable per module, default 50).

---

## API Endpoints Reference

### Authentication
```
POST /api/auth/register     - Register new user
POST /api/auth/login        - Login (returns Bearer token)
POST /api/auth/logout       - Logout
GET  /api/me                - Current user info
```

### Learning
```
GET  /api/modules           - List all published modules
GET  /api/modules/{slug}    - Module detail (bundled with bookmarks, feedback)
GET  /api/progress          - User's progress across all modules
GET  /api/progress/{id}     - Progress for specific module
POST /api/progress/{id}/help-viewed    - Mark intro as viewed
POST /api/progress/{id}/checklist      - Update checklist item
POST /api/progress/{id}/quiz           - Submit quiz answers
POST /api/progress/{id}/reset          - Reset module progress
POST /api/progress/{id}/resume         - Save last section position
POST /api/section-views                - Mark section as viewed
GET  /api/section-views                - Get viewed sections
```

### Bookmarks
```
GET    /api/bookmarks       - List user bookmarks
POST   /api/bookmarks       - Create bookmark
DELETE /api/bookmarks/{id}  - Remove bookmark
```

### Certificates
```
GET /api/certificate                - Get user certificates
GET /api/certificate/download       - Download certificate PDF
GET /api/certificates/{id}/download - Download specific certificate
```

### Feedback
```
POST /api/feedback/{moduleId}  - Submit/update feedback
GET  /api/feedback/{moduleId}  - Get user's feedback for module
```

### AI Chatbot
```
POST /api/chatbot/ask                           - Ask Ela (global)
GET  /api/modules/{id}/assistant/status          - Assistant status
GET  /api/modules/{id}/assistant/suggestions     - Suggested questions
POST /api/modules/{id}/assistant/chat            - Module-specific chat
POST /api/modules/{id}/assistant/index           - Trigger indexing (admin)
PATCH /api/modules/{id}/assistant/toggle         - Enable/disable (admin)
```

### Content Manager (ADMIN/TRAINER)
```
GET    /api/cm/modules              - List all modules
POST   /api/cm/modules              - Create module
GET    /api/cm/modules/{id}         - Get module details
PUT    /api/cm/modules/{id}         - Update module
DELETE /api/cm/modules/{id}         - Delete module
POST   /api/cm/modules/{id}/sections    - Add section
PUT    /api/cm/sections/{id}            - Update section
DELETE /api/cm/sections/{id}            - Delete section
POST   /api/cm/modules/{id}/checklist   - Add checklist item
PUT    /api/cm/checklist/{id}           - Update checklist
DELETE /api/cm/checklist/{id}           - Delete checklist
POST   /api/cm/modules/{id}/quiz        - Add quiz question
PUT    /api/cm/quiz/{id}                - Update quiz
DELETE /api/cm/quiz/{id}                - Delete quiz
POST   /api/cm/upload                   - Upload media
POST   /api/cm/upload-chunk             - Chunked upload
POST   /api/cm/upload-finalize          - Finalize chunked upload
```

### Admin
```
GET    /api/admin/users             - List all users
POST   /api/admin/users             - Create user
PUT    /api/admin/users/{id}        - Update user
DELETE /api/admin/users/{id}        - Delete user
GET    /api/admin/pending           - Pending approvals
POST   /api/admin/approve/{id}     - Approve user
POST   /api/admin/reject/{id}      - Reject user
GET    /api/admin/analytics         - Dashboard analytics
GET    /api/admin/feedback-analytics - Feedback analytics
```

---

## Frontend Page Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/login` | Login.tsx | Public |
| `/register` | Register.tsx | Public |
| `/pending-approval` | PendingApproval.tsx | Unapproved users |
| `/learning-hub` | LearningHub.tsx | All approved users |
| `/learning-hub/:slug` | ModuleDetail.tsx | All approved users |
| `/my-progress` | MyProgress.tsx | All approved users |
| `/bookmarks` | Bookmarks.tsx | All approved users |
| `/takeaways` | KeyTakeaways.tsx | All approved users |
| `/certificate` | Certificate.tsx | All approved users |
| `/content-manager` | ContentManager.tsx | ADMIN, TRAINER |
| `/content-manager/:id` | ContentManagerEdit.tsx | ADMIN, TRAINER |
| `/feedback-analytics` | FeedbackAnalytics.tsx | ADMIN, TRAINER |
| `/users` | Users.tsx | ADMIN only |
| `/pending-approvals` | PendingApprovals.tsx | ADMIN only |
| `/admin` | AdminDashboard.tsx | ADMIN only |

---

## How to Add a New Training Module

### Via Content Manager (UI)
1. Login as ADMIN or TRAINER
2. Go to Content Manager
3. Click "Create New Module"
4. Fill in title, description, icon
5. Click the module card to edit
6. Add sections (HTML content), checklists, quiz questions
7. Upload introductory video
8. Set quiz passing percentage
9. Click "Publish"

### Via Database Seeder (Code)
Edit `database/seeders/TrainingModuleSeeder.php` and add module data.

---

## How to Extend

### Adding a New Page
1. Create `resources/js/pages/NewPage.tsx`
2. Add route in `resources/js/App.tsx`
3. Add sidebar menu item in `resources/js/layouts/AppLayout.tsx`
4. Run `npm run build`

### Adding a New API Endpoint
1. Create controller in `app/Http/Controllers/`
2. Add route in `routes/api.php`
3. Run `php artisan optimize` to refresh route cache

### Adding a New Database Table
1. Run `php artisan make:migration create_table_name`
2. Define schema in the migration file
3. Create model in `app/Models/`
4. Run `php artisan migrate`

---

## Performance Optimizations Applied

1. **PHP OPcache** - Bytecode caching (14x faster responses)
2. **Server-side module caching** - 5 min cache on published modules
3. **Bundled API responses** - Module detail returns bookmarks + feedback in 1 call
4. **Frontend in-memory cache** - 30s cache on GET requests
5. **Gzip compression middleware** - 60% smaller API responses
6. **Database indexes** - On progress, section_views, feedback tables
7. **Batch queries** - Analytics use aggregated SQL instead of N+1
8. **Config & route caching** - `php artisan optimize`
9. **Lazy-loaded React pages** - Code splitting via `React.lazy()`
