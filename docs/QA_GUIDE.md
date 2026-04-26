# eWards Learning Hub — Manual QA Guide

**Version tested:** Session 9 (2026-04-25)
**PHPUnit:** 84/84 ✅ | **Playwright:** 49/51 ✅ (2 flaky = TiDB cold-start only)

---

## Test Accounts

These accounts are created automatically by `php artisan db:seed` on first deploy. Confirm with the deploy team that seeding ran successfully before starting QA.

| Role | Email | Password | What they can do |
|---|---|---|---|
| Admin | `admin@ewards.com` | `admin123` | All features + admin panel + content manager |
| Trainer | `trainer@ewards.com` | `trainer123` | Content manager + feedback analytics only |
| Cashier (approved) | `priya@spicegarden.com` | `demo123` | Learning hub, progress, certificates, leaderboard |
| Cashier (unapproved) | `arjun@newbrand.com` | `demo123` | Sees "pending approval" screen only |

> **Important:** Change the admin password immediately after first login in any production environment. These are seeder defaults — do not use in production without changing them first.

---

## Known Limitations (Do NOT report as bugs)

- **First page load after idle may take 20–30 seconds** — Render free tier spins down. Wait and retry.
- **Ask Ela / Module Assistant** requires content to be indexed first. If a module was just created, the Admin must trigger "Index Module" from Content Manager before the chatbot works.
- **Queue is synchronous** — emails arrive immediately (no background queue), so password reset emails should arrive within seconds. Check spam if not seen in 1 minute.

---

## QA Test Matrix

Work through each section in order. Mark P (Pass), F (Fail), or N/A.

---

### SECTION 1 — Authentication

| # | Test | Steps | Expected |
|---|---|---|---|
| 1.1 | Login — valid credentials | Enter correct email + password → Sign In | Redirects to Learning Hub |
| 1.2 | Login — wrong password | Enter correct email + wrong password → Sign In | Red error: "Invalid credentials" |
| 1.3 | Login — blank fields | Submit empty form | Inline validation errors on both fields |
| 1.4 | Register — new user | Fill all fields → Register | "Pending approval" screen shown |
| 1.5 | Register — duplicate email | Register with an existing email | Error: email already taken |
| 1.6 | Unapproved user access | Log in as pending user → try visiting /learning-hub | Stays on pending-approval page |
| 1.7 | Logout | Click user avatar → Sign Out | Returns to Landing page, token cleared |
| 1.8 | Forgot password link | On Login page, click "Forgot password?" | Navigates to /forgot-password page |
| 1.9 | Forgot password — valid email | Enter registered email → Send Reset Link | Success message shown (no redirect yet) |
| 1.10 | Forgot password — unknown email | Enter unregistered email → Send Reset Link | Same success message (no enumeration) |
| 1.11 | Password reset email | After 1.9, check inbox | Email arrives with "Reset Password" button |
| 1.12 | Password reset — valid token | Click email link → enter new password + confirm → Reset Password | Success message, redirects to login in 3s |
| 1.13 | Password reset — mismatched passwords | Enter two different passwords → Reset Password | Inline validation error |
| 1.14 | Login with new password | After 1.12, log in using the new password | Login succeeds |
| 1.15 | Expired reset link | Wait 61+ minutes, then use old link | Error: "Reset link has expired" |

---

### SECTION 2 — Admin Panel

Log in as **Admin** for all tests in this section.

#### 2A — User Management (`/users`)

| # | Test | Steps | Expected |
|---|---|---|---|
| 2.1 | View users | Navigate to /users | Table loads with user list; stats cards show totals |
| 2.2 | Add user | Click "Add User" → fill Name, Email, Password, Role → Create | Success toast; user appears in table |
| 2.3 | Role options | Open "Add User" modal → click Role dropdown | Options: Admin, Trainer, Cashier, Client (NO "User" option) |
| 2.4 | Edit user | Click edit (pencil) on any user → change name → Save | Success toast; name updated in table |
| 2.5 | Assign merchant | Edit user → select a Merchant → Outlet dropdown populates | Outlets filter to the selected merchant |
| 2.6 | Toggle approved | Edit user → toggle Approved switch → Save | Status tag in table updates |
| 2.7 | Delete user | Click delete (bin) on a user → confirm | User removed from table |

#### 2B — Pending Approvals (`/pending-approvals`)

| # | Test | Steps | Expected |
|---|---|---|---|
| 2.8 | View pending | Navigate to /pending-approvals | List of unapproved users shown |
| 2.9 | Approve user | Click Approve on a pending user | User moves to approved; disappears from pending list |
| 2.10 | Reject user | Click Reject → enter reason → Confirm | User rejected; rejection_reason saved |
| 2.11 | Merchant filter | If merchant dropdown present, select a merchant | Outlets dropdown populates correctly |

#### 2C — Analytics Dashboard (`/admin`)

| # | Test | Steps | Expected |
|---|---|---|---|
| 2.12 | Dashboard loads | Navigate to /admin | Stats cards, charts, top users table load |
| 2.13 | Module completion chart | View module completion bar chart | Bars show per-module completion rates |
| 2.14 | Leaderboard on dashboard | Scroll to leaderboard section | Top users listed with points |

---

### SECTION 3 — Content Manager

Log in as **Admin** for this section.

#### 3A — Module List (`/content-manager`)

| # | Test | Steps | Expected |
|---|---|---|---|
| 3.1 | View modules | Navigate to /content-manager | List of modules with draft/published status |
| 3.2 | Create module | Click "New Module" → enter title → Create | Module created in draft; redirects to edit page |
| 3.3 | Delete module | Click delete on a draft module → confirm | Module removed |

#### 3B — Module Edit (`/content-manager/:id`)

| # | Test | Steps | Expected |
|---|---|---|---|
| 3.4 | Edit title & description | Change title and description → Save Module Details | Success toast; values persist on reload |
| 3.5 | Upload cover image | Click Upload next to Cover Image → select image file | Image uploaded; thumbnail preview appears below the field |
| 3.6 | Cover image > 5MB | Try uploading an image over 5MB | Error: "Cover image must be under 5MB" |
| 3.7 | Upload video (chunked) | Click Upload next to Video → select an .mp4 | Progress shown during upload; URL appears in field after completion |
| 3.8 | Set display order & points | Change Display Order and Points on Complete → Save | Values updated |
| 3.9 | Toggle Published | Toggle Published switch → Save | Module becomes visible in Learning Hub |
| 3.10 | Completion rules | Check/uncheck "Require Learn step", "Require Checklist", "Require Quiz pass" → Save | Flags persist |
| 3.11 | Add section | Go to Sections tab → Add Section | New section row appears; title editable inline |
| 3.12 | Edit section content | Change section body text | Auto-saves after 600ms (no button needed) |
| 3.13 | Delete section | Click delete on a section → confirm | Section removed |
| 3.14 | Add checklist item | Go to Checklist tab → Add Item | New item with editable label |
| 3.15 | Add quiz question | Go to Quiz tab → Add Question → fill question + 4 options + mark correct → Save | Question saved |
| 3.16 | AI assistant toggle | Go to AI tab → toggle Assistant on → click "Index Module" | Indexing starts; status shows "indexed" when done |

---

### SECTION 4 — Learning Hub (Learner view)

Log in as **Cashier (approved)** for this section.

| # | Test | Steps | Expected |
|---|---|---|---|
| 4.1 | Module list loads | Navigate to /learning-hub | Published modules shown as cards |
| 4.2 | Module card info | Look at a module card | Shows title, description, estimated time, progress bar |
| 4.3 | Cover image | If cover image was uploaded in 3.5 | Image appears on the card |
| 4.4 | Enter module | Click a module card | Module detail page opens |
| 4.5 | Learn step | Click "Learn" tab | Help/intro content visible |
| 4.6 | Mark help viewed | Scroll through help content | "Mark as viewed" or auto-mark triggers; progress bar advances |
| 4.7 | Section navigation | Click through content sections | Sections load; section views recorded |
| 4.8 | Checklist step | Click Checklist tab → check each item | Items check off; checklist completion recorded |
| 4.9 | Quiz step | Click Quiz tab → answer questions → Submit | Score shown; pass/fail message displayed |
| 4.10 | Quiz bonus points | Pass quiz on first attempt | Points awarded visible in ledger |
| 4.11 | Module complete | Complete all required steps | Completion modal shown with points + badge (if earned) |
| 4.12 | Bookmark | Click bookmark icon on a module | Module appears in /bookmarks |
| 4.13 | Remove bookmark | Click bookmark icon again | Removed from /bookmarks |

---

### SECTION 5 — Progress & Points

Log in as **Cashier (approved)**.

| # | Test | Steps | Expected |
|---|---|---|---|
| 5.1 | My Progress page | Navigate to /my-progress | Module progress cards visible; each completed module shows its points reward |
| 5.2 | Points ledger (API) | `GET /api/v1/points` (authenticated) | Returns last 50 transactions; each row has `points`, `reason_label` (e.g. "Module completed", "Quiz bonus"), `balance_after`, `created_at` |
| 5.3 | Level badge | Check header/profile area | Level shows: Beginner (0–99), Practitioner (100–249), Specialist (250–499), Expert (500+) |
| 5.4 | Key Takeaways | Navigate to /takeaways | List of completed module takeaways |

---

### SECTION 6 — Leaderboard

Log in as **Cashier (approved)**.

| # | Test | Steps | Expected |
|---|---|---|---|
| 6.1 | Leaderboard loads | Navigate to leaderboard (in sidebar or /leaderboard) | Top 20 users shown, ordered by points descending |
| 6.2 | Current user highlight | Find logged-in user in the list | Row highlighted differently (is_current_user flag) |
| 6.3 | Level labels | Check Level column | Matches points thresholds (Beginner / Practitioner / Specialist / Expert) |
| 6.4 | Merchant scoping | Two users from different merchants | Each user sees only their own merchant's leaderboard |

---

### SECTION 7 — Badges

| # | Test | Steps | Expected |
|---|---|---|---|
| 7.1 | Badge earned on completion | Complete a module | Badge award appears in completion modal (if badge criteria met) |
| 7.2 | My badges | Navigate to /profile → scroll to "My Badges" section | Earned badges listed with emoji icon, name, and award date |

---

### SECTION 8 — Certificates

Log in as **Cashier (approved)**.

| # | Test | Steps | Expected |
|---|---|---|---|
| 8.1 | Certificate page | Navigate to /certificate | Cards shown for module, path, and expert certificates |
| 8.2 | Locked state | Before completing anything | Certificates show "Locked" tag |
| 8.3 | Module certificate | After completing a module | Certificate card shows "Download" button |
| 8.4 | Download module cert | Click Download | PDF downloads with user name on it |
| 8.5 | Path certificate | After completing ALL published modules | Path certificate card becomes active |
| 8.6 | Expert certificate | When user has 500+ points | Expert certificate card becomes active |
| 8.7 | Expert threshold | User with 499 points | Expert certificate still shows "Locked" |

---

### SECTION 9 — Ask Ela (AI Chatbot)

> Requires: module indexed by admin in Content Manager (Section 3.16)

| # | Test | Steps | Expected |
|---|---|---|---|
| 9.1 | Global chatbot | Click "Ask Ela" floating button | Chat modal opens |
| 9.2 | Ask a question | Type a question about the training content → Send | Answer appears within ~5 seconds |
| 9.3 | Rate limit | Send 15+ messages within 1 minute | 429 error message shown |
| 9.4 | Module assistant | Inside a module, click AI assistant tab | Module-specific Q&A available |

---

### SECTION 10 — Profile

| # | Test | Steps | Expected |
|---|---|---|---|
| 10.1 | View profile | Navigate to /profile | Name, email, mobile, designation, role, points shown |
| 10.2 | Edit name | Change display name → Save | Success message; name updates in sidebar and top header |
| 10.3 | Change password | Enter correct current password + new password (min 8 chars) + confirm → Save | Success message; log out → log back in with new password succeeds; old password rejected |

---

### SECTION 11 — Feedback

| # | Test | Steps | Expected |
|---|---|---|---|
| 11.1 | Submit feedback | After completing a module, submit star rating + comment | Success message |
| 11.2 | Feedback analytics | Log in as Admin → /feedback-analytics | Ratings and comments visible per module |

---

### SECTION 12 — Permissions (Access Control)

| # | Test | Steps | Expected |
|---|---|---|---|
| 12.1 | Cashier cannot access /users | Log in as Cashier → navigate to /users | Redirected to /learning-hub |
| 12.2 | Cashier cannot access /admin | Navigate to /admin | Redirected |
| 12.3 | Cashier cannot access /content-manager | Navigate to /content-manager | Redirected |
| 12.4 | Trainer CAN access content manager | Log in as Trainer → /content-manager | Access granted |
| 12.5 | Trainer cannot access /users | Navigate to /users | Redirected |

---

## How to Report a Bug

For each failure, capture:

1. **Test case number** (e.g. 1.12)
2. **Steps to reproduce** exactly
3. **Expected result** (from the table above)
4. **Actual result** (what happened instead)
5. **Screenshot or screen recording**
6. **Browser console errors** (F12 → Console tab)
7. **Network response** (F12 → Network tab → failed request → Response body)

---

## Regression Risk Areas

These areas have the most interconnected logic — pay extra attention:

- **Module completion** (Sections 4 + 8): completion triggers points, badges, and certificate issuance in a single transaction. If one fails, all fail.
- **Points ledger** (Section 5.2): must show correct reason labels (not raw codes like `module_complete`)
- **Leaderboard scoping** (Section 6.4): users from Merchant A must never see Merchant B users
- **Certificate thresholds** (Section 8): Beginner=0, Practitioner=100, Specialist=250, Expert=500 — if levels on certificate page don't match leaderboard, flag it
