# eWards Learning Hub - Technology Stack

## Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **PHP** | 8.1+ | Server-side language |
| **Laravel** | 10.x | PHP web framework |
| **Laravel Sanctum** | 3.x | API token authentication |
| **Laravel DomPDF** | 3.x | PDF certificate generation |
| **Guzzle HTTP** | 7.x | HTTP client for external APIs |
| **MySQL** | 8.0+ | Relational database |

## Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI library |
| **TypeScript** | 6.x | Type-safe JavaScript |
| **Ant Design** | 6.x | UI component library |
| **Ant Design Icons** | 6.x | Icon library |
| **React Router** | 7.x | Client-side routing |
| **React Markdown** | 10.x | Markdown rendering for AI responses |
| **Axios** | 1.x | HTTP client |
| **Vite** | 8.x | Build tool & dev server |

## AI / Machine Learning

| Technology | Purpose |
|------------|---------|
| **HuggingFace API** | Sentence embeddings (all-MiniLM-L6-v2) |
| **Groq API** | LLM inference (Llama 3 8B) |
| **RAG Pipeline** | Custom retrieval-augmented generation |

## Infrastructure

| Technology | Purpose |
|------------|---------|
| **Composer** | PHP dependency management |
| **npm** | Node.js dependency management |
| **Vite** | Frontend build tool |
| **Laravel Artisan** | CLI tool for migrations, caching, etc. |
| **PHP OPcache** | PHP bytecode caching for performance |

## Design & Theming

| Aspect | Details |
|--------|---------|
| **Primary Color** | `#6B2FA0` (Purple) |
| **Font Family** | Plus Jakarta Sans |
| **Border Radius** | 8px (global) |
| **Design System** | Ant Design 6 with custom theme tokens |
| **Responsive** | Mobile-first with AntD Row/Col grid |
| **Animations** | CSS transitions, gradient backgrounds, shimmer effects |

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts with roles (ADMIN, TRAINER, CASHIER, CLIENT) |
| `merchants` | Merchant/organization data |
| `outlets` | Branch/outlet data |
| `training_modules` | Course modules with metadata |
| `training_sections` | Content sections within modules |
| `training_checklists` | Interactive checklists per module |
| `training_quizzes` | Quiz questions with options |
| `training_progress` | User progress per module |
| `quiz_attempts` | Quiz attempt history |
| `quiz_metadata` | Quiz settings (passing %, retakes) |
| `section_views` | Track which sections users viewed |
| `bookmarks` | User bookmarks on sections |
| `certificates` | Issued certificates (path, expert, module) |
| `module_feedback` | User ratings and feedback |
| `media` | Uploaded media files |
| `module_ai_settings` | AI assistant config per module |
| `module_ai_documents` | AI indexed documents |
| `module_ai_chunks` | Document chunks for RAG |
| `module_ai_chat_logs` | Chat history with AI |
| `jobs` | Background job queue |

## API Architecture

- **Authentication:** Bearer token (Laravel Sanctum)
- **Base URL:** `/api`
- **Middleware Stack:** `auth:sanctum` > `approved` > `role:ADMIN,TRAINER`
- **Response Format:** JSON
- **Rate Limiting:** 60 requests/minute (configurable)

## Folder Structure

```
ewards-learning-hub/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/          # Admin dashboard, analytics, user management
│   │   │   ├── AI/             # AI assistant endpoints
│   │   │   ├── Auth/           # Login, register, logout
│   │   │   ├── ContentManager/ # Module/section/quiz CRUD
│   │   │   └── Training/       # Progress, bookmarks, certificates, chatbot
│   │   └── Middleware/         # Auth, role, approved, compression
│   ├── Models/                 # 20 Eloquent models
│   ├── Providers/              # Service providers
│   └── Services/
│       └── AI/                 # Chunking, embedding, LLM, retrieval services
├── config/
│   └── ai.php                  # AI configuration
├── database/
│   ├── migrations/             # 35+ migrations
│   └── seeders/                # Sample data seeders
├── resources/
│   ├── css/                    # Global styles
│   ├── js/
│   │   ├── pages/              # 15 React page components
│   │   ├── components/         # 3 shared components
│   │   ├── contexts/           # Auth context provider
│   │   ├── layouts/            # App layout with sidebar
│   │   ├── lib/                # API utilities
│   │   ├── App.tsx             # Route definitions
│   │   └── main.tsx            # React entry point
│   └── views/
│       ├── app.blade.php       # SPA entry blade
│       ├── certificates/       # PDF certificate template
│       └── emails/             # Email templates
├── routes/
│   ├── api.php                 # 50+ API routes
│   └── web.php                 # SPA catch-all route
├── storage/
│   └── app/public/uploads/     # User uploaded files
├── .env.example                # Environment template
├── composer.json               # PHP dependencies
├── package.json                # Node.js dependencies
├── vite.config.js              # Vite build configuration
└── tsconfig.json               # TypeScript configuration
```
