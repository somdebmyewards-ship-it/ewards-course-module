# Testing Checklist

## Setup Commands

```bash
php artisan migrate:fresh --seed    # Reset and seed DB
php artisan storage:link            # Link storage to public
npm run build                       # Build frontend assets
php artisan serve                   # Start server at :8000
php artisan queue:work              # Start queue worker (separate terminal)
```

## E2E Tests (Playwright)

```bash
npx playwright install chromium     # First time only
npm run test:e2e                    # Run all suites
```

Expected result: All 6 suites pass (seed, auth, learning hub, admin, content manager, certificates).

---

## Manual QA Checklist

### Auth
- [ ] Register with new email → login immediately (auto-approved)
- [ ] Login with wrong password → error message shown
- [ ] Login as cashier → lands on Learning Hub
- [ ] Login as admin → lands on Learning Hub; sidebar shows ADMIN section + Pending Approvals
- [ ] Login as trainer → sidebar shows MANAGEMENT section only
- [ ] Logout → redirected to login; token cleared from localStorage
- [ ] Directly visit `/admin` as cashier → redirected to `/learning-hub`
- [ ] Directly visit `/content-manager` as cashier → redirected to `/learning-hub`

### Learning Hub
- [ ] Module cards load with correct title, icon, description
- [ ] Progress badge shows on in-progress modules
- [ ] Search filters modules by title
- [ ] Tab filters (All / In Progress / Completed / Not Started) work
- [ ] Sort by A-Z, Z-A, Progress work
- [ ] Click module → opens `/learning-hub/:slug`

### Module Detail
- [ ] Intro video plays (if module has `video_url`)
- [ ] Section list shows in sidebar; section content loads on click
- [ ] Viewed sections get a checkmark in the sidebar
- [ ] Checklist items can be checked/unchecked
- [ ] All checklist items checked → checklist_completed = true
- [ ] Quiz shows questions one at a time (or all)
- [ ] Quiz submit → score shown; pass/fail result
- [ ] Quiz pass → module_completed → achievement toast shown
- [ ] Bookmark section → appears on Bookmarks page
- [ ] Feedback rating (1–5 stars) submits successfully
- [ ] AI Assistant button (if module has AI enabled) opens drawer

### Progress & Certificates
- [ ] My Progress page shows all modules with completion %
- [ ] Key Takeaways page shows takeaways from completed modules
- [ ] Certificate page loads after module completion
- [ ] Download certificate → PDF downloads (correct name, landscape A4)
- [ ] Share buttons (LinkedIn, Twitter, WhatsApp, Copy) work

### Admin
- [ ] Admin Dashboard loads with stats cards and module completion bars
- [ ] Users table shows users with correct roles, points, progress %
- [ ] Create User modal → fill form → user created → appears in table
- [ ] Edit user → role change saved
- [ ] Delete user → confirmation → user removed
- [ ] Pending Approvals page shows pending users (seeded: arjun@newbrand.com, divya@newcafe.com)
- [ ] Approve user → user can now log in and access modules
- [ ] Reject user with reason → reason shown on their pending page

### Content Manager
- [ ] Module list loads for trainer and admin
- [ ] Create module → title, description, publish toggle → saved
- [ ] Edit module → add section → section appears in module detail
- [ ] Add quiz question → appears in quiz
- [ ] Upload image → appears in section
- [ ] Publish/unpublish toggle → module appears/disappears for learners

### Error States
- [ ] No modules created → Learning Hub shows empty state
- [ ] No certificates earned → Certificate page shows "No certificate earned yet"
- [ ] No feedback given → Feedback Analytics shows empty state
- [ ] Quiz not completed → answer review returns 403

### Build
- [ ] `npm run build` completes without errors
- [ ] `php artisan route:list` shows no errors
- [ ] `php artisan test` runs (PHPUnit — currently skeleton tests only)
