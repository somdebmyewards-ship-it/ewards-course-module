# Feature Inventory

| Feature | Module | Status | Working? | Notes | Required Action |
|---|---|---|---|---|---|
| Login (email + password) | Auth | Working | ✅ Yes | Bearer token via Sanctum | — |
| Register (self-service) | Auth | Working | ✅ Yes | Auto-approves; email notification sent | — |
| Logout | Auth | Working | ✅ Yes | Token revoked | — |
| Pending Approval user page | Auth | Partially Working | ⚠️ Route was missing | Page exists; shown for rejected users | Fixed — route added |
| Admin approval/rejection | Admin | Working | ✅ Yes | `/admin/pending`; merchant/outlet mapping | — |
| Pending Approvals sidebar link | Admin | **Broken** | ❌ No link | Page existed but unreachable from nav | Fixed — link added |
| Learning Hub (module grid) | Learning | Working | ✅ Yes | Search, filter, sort all functional | — |
| Module Detail (sections, media) | Learning | Working | ✅ Yes | Section sidebar, section nav, viewed tracking | — |
| Intro video playback | Learning | Working | ✅ Yes | Custom VideoPlayer with range requests | — |
| Checklist completion | Learning | Working | ✅ Yes | DB persisted, completion auto-detected | — |
| Quiz (multiple choice) | Learning | Working | ✅ Yes | Passing %, bonus points, answer review | — |
| Prototype practice (HTML iframe) | Learning | Working | ✅ Yes | Auto-scaled iframe, single-completion | — |
| Prototype practice (JSON config) | Learning | Working | ✅ Yes | Multi-flow, per-flow completion tracking | — |
| Bookmarks | Learning | Working | ✅ Yes | Add/remove; deep link from Bookmarks page | — |
| Key Takeaways | Learning | Working | ✅ Yes | Shows takeaways from all completed modules | — |
| My Progress overview | Learning | Working | ✅ Yes | Per-module completion bars | — |
| Module completion + points | Learning | Working | ✅ Yes | DB transaction, PointsLedger, CompletionService | — |
| Level progression (Beginner→Expert) | Learning | Working | ✅ Yes | 100/250/500 point thresholds | — |
| Module certificate | Certificates | Working | ✅ Yes | Auto-issued on module completion | — |
| Path certificate (all modules) | Certificates | Working | ✅ Yes | Auto-issued when all published modules done | — |
| Expert certificate (300+ pts) | Certificates | Working | ✅ Yes | Auto-issued on points threshold | — |
| Certificate PDF download | Certificates | Working | ✅ Yes | DomPDF, landscape A4, ewards-logo.png used | — |
| Certificate share (LinkedIn, X, WhatsApp) | Certificates | Working | ✅ Yes | Copy link + social share text | — |
| Module feedback (star rating + comment) | Feedback | Working | ✅ Yes | 1–5 stars, comment, suggestion | — |
| Feedback analytics (trainer/admin) | Feedback | Working | ✅ Yes | Rating distribution, per-module breakdown | — |
| Content Manager module list | CMS | Working | ✅ Yes | ADMIN + TRAINER, with publish toggle | — |
| Create/edit module | CMS | Working | ✅ Yes | Title, icon (emoji or upload), video, prototype | — |
| Section CRUD (rich HTML) | CMS | Working | ✅ Yes | Ordered, display_order | — |
| Checklist item CRUD | CMS | Working | ✅ Yes | — | — |
| Quiz CRUD | CMS | Working | ✅ Yes | Add/edit/delete questions | — |
| Media upload (image, video) | CMS | Working | ✅ Yes | Standard upload + chunked upload for large files | — |
| Module publish/unpublish | CMS | Working | ✅ Yes | Cache invalidated on change | — |
| User Management (CRUD) | Admin | Working | ✅ Yes | Create/edit/delete with cascade delete | — |
| Progress bar in Users table | Admin | **Broken** | ❌ Wrong field name | `progress_percentage` vs `progress` mismatch | Fixed |
| Certified count in Users stats | Admin | **Broken** | ❌ Wrong field name | `u.certificate` vs `u.certified` mismatch | Fixed |
| Admin Dashboard stats | Admin | Working | ✅ Yes | Total users, certs, completions, quiz submissions | — |
| Module completion % per module | Admin | Working | ✅ Yes | Batch query, no N+1 | — |
| Merchant adoption analytics | Admin | Working | ✅ Yes | Based on `merchant_name_entered` field | — |
| AI Assistant (Ask Ela) global chatbot | AI | Working | ✅ Yes | Rate limited 15/min; cross-module RAG | — |
| AI Assistant per-module | AI | Partially Working | ⚠️ | Status bundling was broken (wrong class name) | Fixed |
| AI indexing (trigger index) | AI | Working | ✅ Yes | ADMIN/TRAINER trigger; queued job | Needs queue worker |
| AI toggle per module | AI | Working | ✅ Yes | Enable/disable assistant per module | — |
| Media streaming (video range requests) | Media | Working | ✅ Yes | `/media/{path}` route with byte-range support | — |
| Cloudinary file storage | Media | Partially Working | ⚠️ | Config present but CLOUDINARY_URL needed in .env | Needs .env config |
| Points ledger | Points | Working | ✅ Yes | Every points transaction recorded | — |
| Audit log (admin actions) | Admin | Working | ✅ Yes | approve/reject/create/update/delete logged | — |
| Password reset | Auth | **Missing** | ❌ No | No forgot-password flow | Not Required for V1 |
| Email verification | Auth | **Missing** | ❌ No | No email verification | Not Required for V1 |
| Notifications/reminders to learners | Notifications | **Missing** | ❌ No | No scheduled reminder emails | Future backlog |
| PHPUnit tests | Testing | Broken | ❌ Skeleton only | Only ExampleTest.php with assertTrue(true) | Write real tests |
| Playwright E2E tests | Testing | **Added** | ✅ Added | 6 test suites covering auth, learning, admin | Run after setup |
