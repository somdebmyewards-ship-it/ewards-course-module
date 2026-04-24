# Folder Structure

```
ewards-learning-hub/
│
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/              # Admin-only: analytics, approvals, user mgmt, cert admin
│   │   │   ├── AI/                 # AssistantController — Ask Ela chatbot endpoints
│   │   │   ├── Auth/               # Login, Register, Logout
│   │   │   ├── ContentManager/     # TRAINER+ADMIN: module/section/checklist/quiz CRUD + uploads
│   │   │   └── Training/           # LEARNER: modules, progress, quiz, bookmarks, certs, feedback
│   │   ├── Middleware/
│   │   │   ├── ApprovedMiddleware.php    # Blocks unapproved users from API
│   │   │   ├── RoleMiddleware.php        # role:ADMIN,TRAINER gate
│   │   │   ├── CacheApiResponse.php      # Server-side GET caching
│   │   │   └── CompressResponse.php      # Gzip compression
│   │   ├── Requests/               # Form request validation (StoreModuleRequest, SubmitQuizRequest)
│   │   └── Resources/              # API resources (ModuleResource, UserResource, SectionResource)
│   │
│   ├── Jobs/
│   │   ├── GenerateCertificatePdfJob.php    # (available, not yet wired to queue)
│   │   └── IndexModuleContentJob.php        # AI indexing job
│   │
│   ├── Mail/
│   │   └── NewSignupNotification.php        # Email on new user registration
│   │
│   ├── Models/                      # 20 Eloquent models, all on lms_* tables
│   ├── Providers/
│   │   └── AppServiceProvider.php   # Sanctum custom token model, rate limiter
│   └── Services/
│       ├── CompletionService.php    # Module completion, certificate issuance, points
│       └── AI/                      # RAG pipeline: chunking, embedding, BM25, LLM, retrieval
│
├── bootstrap/
│   └── app.php                      # Middleware aliases, route config, dual /api + /api/v1 prefix
│
├── config/
│   ├── ai.php                       # AI/RAG configuration
│   ├── lms.php                      # Upload limits, certificate config, cloudinary
│   └── (standard Laravel configs)
│
├── database/
│   ├── migrations/                  # 35+ migrations; tables prefixed lms_
│   ├── seeders/
│   │   ├── DatabaseSeeder.php       # Calls: Merchant → User → TrainingModule → PrototypeConfig
│   │   ├── MerchantSeeder.php
│   │   ├── UserSeeder.php
│   │   ├── TrainingModuleSeeder.php
│   │   └── PrototypeConfigSeeder.php  # Seeds prototype_config JSON for each module
│   └── run_sql.php                  # Utility script — not part of migration system
│
├── docs/                            # Project documentation (this folder)
│
├── public/
│   ├── build/                       # Vite production build output
│   ├── ewards-logo.png              # Used by certificate PDF template
│   ├── prototypes/                  # HTML prototype files for iframe embedding
│   └── index.php
│
├── resources/
│   ├── js/
│   │   ├── App.tsx                  # React router (all routes defined here)
│   │   ├── main.tsx                 # React entry point
│   │   ├── components/              # Shared components
│   │   │   ├── AssistantDrawer.tsx  # AI assistant side drawer
│   │   │   ├── ChatWidget.tsx       # Floating Ela chatbot button
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── HelpCTA.tsx
│   │   │   ├── ModuleCard.tsx       # Module card on Learning Hub
│   │   │   ├── PrototypeSimulator.tsx
│   │   │   └── VideoPlayer.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx      # Auth state, login/logout/register/refreshUser
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx        # Sidebar navigation, user card, ChatWidget
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance, cachedGet, downloadPdf
│   │   │   └── assistantApi.ts      # AI assistant API calls
│   │   ├── pages/
│   │   │   ├── Login.tsx / Register.tsx / PendingApproval.tsx
│   │   │   ├── LearningHub.tsx      # Module grid/list with search + filters
│   │   │   ├── ModuleDetail.tsx     # Full learning experience (largest page)
│   │   │   ├── MyProgress.tsx       # User's overall progress summary
│   │   │   ├── Bookmarks.tsx
│   │   │   ├── KeyTakeaways.tsx
│   │   │   ├── Certificate.tsx      # Cert display + download
│   │   │   ├── ContentManager.tsx   # Module list for trainer/admin
│   │   │   ├── ContentManagerEdit.tsx  # Module editor (sections, quiz, media)
│   │   │   ├── Users.tsx            # Admin user management table
│   │   │   ├── PendingApprovals.tsx # Admin: approve/reject pending registrations
│   │   │   ├── AdminDashboard.tsx   # Stats + merchant adoption
│   │   │   └── FeedbackAnalytics.tsx
│   │   └── types/index.ts           # Shared TypeScript interfaces
│   │
│   └── views/
│       ├── app.blade.php            # SPA shell (loads React)
│       ├── certificates/template.blade.php  # DomPDF certificate template
│       └── emails/new-signup.blade.php
│
├── routes/
│   ├── api.php                      # 60+ API routes under auth:sanctum + approved + role
│   └── web.php                      # Media stream route + SPA catch-all
│
├── tests/
│   ├── Feature/ExampleTest.php      # Skeleton only (needs real tests)
│   ├── Unit/ExampleTest.php         # Skeleton only
│   └── e2e/                         # Playwright E2E tests
│       ├── 01-seed-and-setup.spec.ts
│       ├── 02-auth.spec.ts
│       ├── 03-learning-hub.spec.ts
│       ├── 04-admin.spec.ts
│       ├── 05-content-manager.spec.ts
│       ├── 06-certificate.spec.ts
│       └── helpers.ts
│
├── .env.example                     # Complete env template with all variables documented
├── composer.json                    # PHP 8.3, Laravel 13, Sanctum 4, DomPDF 3
├── package.json                     # React 19, AntD 6, Vite 8, Playwright
├── playwright.config.ts             # E2E test config (baseURL, reporters, browser)
└── vite.config.js                   # Dev proxy to localhost:8000, manual chunks
```
