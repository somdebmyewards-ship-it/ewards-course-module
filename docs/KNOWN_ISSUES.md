# Known Issues

## Fixed in This Audit Session

### Issue 1: ModuleAiConfig — wrong class name
- **Where:** `app/Http/Controllers/Training/ModuleController.php` line 111
- **What:** Code referenced `\App\Models\ModuleAiConfig::class` which does not exist. The actual model is `ModuleAiSetting`.
- **Impact:** AI assistant status (`_assistant_status`) was always `null` in the bundled module response. The assistant drawer in ModuleDetail could not show enabled/indexed state from the initial page load.
- **Root cause:** Class renamed during refactor; reference not updated. Was silently swallowed by `class_exists()` check.
- **Fix:** Changed to `\App\Models\ModuleAiSetting::class` and updated field names (`assistant_enabled`, `last_indexed_at`, `index_status`).
- **Risk:** Low

---

### Issue 2: progress_percentage field mismatch (Users table)
- **Where:** `resources/js/pages/Users.tsx` lines 93, 96
- **What:** Frontend read `r.progress_percentage` but API returns `r.progress`.
- **Impact:** Progress bar in Admin Users table always showed 0% for all users.
- **Fix:** Changed to `r.progress` in render and sorter.
- **Risk:** Low

---

### Issue 3: u.certificate field mismatch (Users stats)
- **Where:** `resources/js/pages/Users.tsx` line 60
- **What:** Frontend read `u.certificate` (undefined) but API returns `u.certified` (boolean).
- **Impact:** "Certified" stat card always showed 0 even when users had certificates.
- **Fix:** Changed to `u.certified`.
- **Risk:** Low

---

### Issue 4: PendingApprovals page had no route
- **Where:** `resources/js/App.tsx`, `resources/js/layouts/AppLayout.tsx`
- **What:** `PendingApprovals.tsx` (admin page to approve/reject new registrations) existed and was built but had no React Router route and no sidebar link. It was completely unreachable.
- **Impact:** Admin could not manage pending user registrations through the UI.
- **Fix:** Added `/pending-approvals` route in App.tsx (ADMIN-only PrivateRoute) and a "Pending Approvals" menu item in the ADMIN sidebar section.
- **Risk:** Low (additive only)

---

### Issue 5: PrototypeConfigSeeder never called
- **Where:** `database/seeders/DatabaseSeeder.php`
- **What:** `PrototypeConfigSeeder` existed with prototype configs for all 6 modules but was not called from `DatabaseSeeder::run()`.
- **Impact:** `php artisan db:seed` would not populate `prototype_config` JSON on modules. The prototype practice step would not appear for seeded modules.
- **Fix:** Added `PrototypeConfigSeeder::class` to the call list in DatabaseSeeder.
- **Risk:** Low

---

## Outstanding Issues (Not Fixed — Need Decision)

### Issue 6: Dual API prefix (/api and /api/v1)
- **Where:** `bootstrap/app.php`
- **Impact:** Both `/api/v1/*` and `/api/*` route to the same controllers. Working but confusing. If the `/api` alias is removed in future, the frontend (using `/api`) would break.
- **Recommendation:** Standardise on `/api/v1` in frontend and remove the alias once confirmed. OR keep alias permanently and document it.
- **Status:** Needs decision — not an active bug.

### Issue 7: `registration always auto-approves`
- **Where:** `app/Http/Controllers/Auth/RegisterController.php`
- **What:** New registrations are set to `approved: true` immediately. The `PendingApproval` user page and the admin approval flow exist but are never triggered by normal registration.
- **Impact:** The approval feature works (seeded pending users exist, admin can approve) but normal sign-ups bypass it entirely.
- **Recommendation:** Decide: keep auto-approve (simpler) or switch `approved: false` on register (requires admin approval for every new user). Document the decision.
- **Status:** Needs product decision.

### Issue 8: PHPUnit tests are skeleton only
- **Where:** `tests/Feature/ExampleTest.php`, `tests/Unit/ExampleTest.php`
- **What:** Both files only contain `assertTrue(true)`. No real test coverage.
- **Impact:** `php artisan test` passes but provides no actual coverage of controllers, services, or models.
- **Recommendation:** Write Feature tests for the critical paths: auth, module completion, quiz submission, certificate issuance.
- **Status:** Not Required for demo; Required before production.

### Issue 9: Queue connection defaults to sync in .env.example
- **Where:** `.env.example` — `QUEUE_CONNECTION=sync`
- **What:** PDF certificate generation (`GenerateCertificatePdfJob`) and AI indexing (`IndexModuleContentJob`) are dispatched to the queue. With `sync`, they run inline (blocking). With `database`, they require `php artisan queue:work`.
- **Impact:** With sync, certificate PDFs generate inline which is slow (1–3s). AI indexing may timeout.
- **Recommendation:** Use `QUEUE_CONNECTION=database` and run the worker in production.
- **Status:** Known, documented in .env.example.

### Issue 10: `GenerateCertificatePdfJob` not wired up
- **Where:** `app/Jobs/GenerateCertificatePdfJob.php` exists but `CertificateController` generates PDFs inline (not via job).
- **Impact:** PDF generation is synchronous on the download request (acceptable for now).
- **Status:** Not a bug; future optimisation if PDF generation gets slow.

### Issue 11: `run_sql.php` in database/ directory
- **Where:** `database/run_sql.php`
- **Impact:** Unclear purpose — likely a utility script. Should be moved to a `/scripts` directory or removed.
- **Status:** Low priority cleanup.

### Issue 12: Merchant/Outlet not loaded in UserManagementController
- **Where:** `app/Http/Controllers/Admin/UserManagementController.php`
- **What:** `with('certificates')` is loaded but `with('merchant', 'outlet')` is not. The Users table falls back to `merchant_name_entered` / `outlet_name_entered`.
- **Impact:** Users page shows entered text for merchant/outlet, not the linked merchant name. For users created by admin (with `merchant_id`), the name won't display.
- **Fix:** Add `->with(['merchant:id,name', 'outlet:id,name'])` to the query.
- **Status:** Minor display issue — low priority.
