# eWards Learning Hub - Features

## For Learners (CASHIER / CLIENT users)

### Learning Hub
- Browse all published training modules in grid or list view
- Search and filter modules by status (Not Started, In Progress, Completed)
- Sort by name, progress, or status
- Continue-in-progress modules with saved position
- Module cards show icon, title, description, section/quiz counts

### Module Learning Experience
- **Introductory Video** - Watch before starting content
- **Sections** - Rich HTML content with images, videos, documents
- **Section Navigation** - Sidebar with progress indicators (checkmarks for viewed)
- **Checklists** - Interactive checklist items to verify hands-on practice
- **Quiz** - Multiple choice questions with configurable passing percentage
- **Module Recap** - Summary before quiz
- **View Correct Answers** - After quiz, see which answers were right/wrong

### Bookmarks
- Bookmark any section while learning
- Navigate directly to bookmarked section from Bookmarks page

### Progress Tracking
- Per-module progress (help viewed, checklist done, quiz passed)
- Overall completion percentage
- Points earned per module
- Level progression (Beginner > Practitioner > Specialist > Expert)

### Certificates
- Auto-issued on module completion (if enabled)
- Path certificate when ALL modules completed
- Expert certificate at 300+ points
- Download as professionally designed PDF
- Share via LinkedIn, Twitter/X, WhatsApp, or copy link

### Key Takeaways
- View key takeaways from all completed modules in one place

### AI Chatbot (Ask Ela)
- Floating chat button on every page
- Ask questions about any training content
- AI searches across all modules for relevant answers
- Shows source references with links to specific modules

### Feedback
- Rate modules (1-5 stars) after completion
- Leave comments and improvement suggestions

---

## For Trainers (TRAINER role)

### Content Manager
- Create, edit, delete training modules
- Upload/change module icons (emoji or image upload)
- Add/edit/delete sections with rich text content
- Add/edit/delete checklist items
- Add/edit/delete quiz questions with multiple choice options
- Upload introductory videos (chunked upload for large files)
- Set quiz passing percentage and retry settings
- Publish/unpublish modules
- Preview module as learner would see it

### Feedback Analytics
- View overall feedback metrics (average rating, total responses)
- Rating distribution chart
- Per-module breakdown (rating, feedback count)
- Recent feedback list with user details
- Comments and improvement suggestions

---

## For Admins (ADMIN role)

### Everything Trainers can do, PLUS:

### User Management
- View all registered users with progress stats
- Create new users with assigned roles
- Edit user roles and permissions
- Approve or reject pending registrations
- Delete users

### Pending Approvals
- Review new user registrations
- Approve or reject with one click
- Badge count in sidebar shows pending count

### Admin Dashboard
- Total users, pending users, certificates issued
- Modules completed count, quiz submissions
- Per-module completion rates
- Merchant adoption stats (completion by organization)

### Analytics
- Merchant-level adoption tracking
- Module completion percentages
- Help viewed statistics

---

## Technical Features

### Performance
- PHP OPcache enabled (14x faster)
- Server-side module caching (5 min TTL)
- Bundled API responses (4 calls reduced to 1)
- Frontend in-memory cache (30s)
- Gzip response compression
- Database query indexes
- Batch aggregate queries (no N+1)
- Config and route caching

### Security
- Bearer token authentication (Laravel Sanctum)
- Role-based middleware access control
- CSRF protection on web routes
- API rate limiting (60 req/min)
- Admin approval required for new users
- Password hashing (bcrypt)

### AI System
- RAG (Retrieval-Augmented Generation) pipeline
- Semantic search with vector embeddings
- Document chunking with overlap
- Per-module AI toggle
- Chat history logging
- Configurable similarity threshold

### File Uploads
- Chunked upload for large files (2MB chunks)
- Retry logic with exponential backoff
- Supports images (PNG, JPG, SVG, WebP, GIF)
- Supports videos (MP4, WebM, MOV, AVI)
- Storage linked to public directory

### UI/UX
- Responsive design (mobile + desktop)
- Dark gradient cards with glassmorphism
- Purple brand theming (#6B2FA0)
- Skeleton loading states
- Confirmation dialogs for destructive actions
- Toast notifications for success/error
- Smooth hover animations
- Corporate login page design
