# Reporting & Dashboard Review

## Reports Currently Available

### 1. Admin Dashboard (`/admin`)
- **Data source:** `GET /api/admin/analytics` → `AnalyticsController::index()`
- **Shows:**
  - Total approved users
  - Total published modules
  - Certificates issued (count across all types)
  - Modules completed (total count across all users)
  - Quiz submissions
- **Module completion section:** Per-module bar chart showing `completed / total_users × 100%`
- **Merchant adoption table:** Merchant name, total users, completed users, adoption rate, avg progress
- **Numbers correct?** Yes — all queries use batch aggregates, no N+1
- **Charts load?** Yes — plain AntD Progress bars (no chart library required)
- **Filters?** None — shows all data, no date filter
- **Export?** None
- **Hardcoded?** No
- **Empty states?** Basic — merchant table hidden if empty, but stats cards always show (even as 0)
- **Useful?** Yes for a management overview, but lacks trends (no date range)

### 2. Feedback Analytics (`/feedback-analytics`)
- **Data source:** `GET /api/cm/feedback-analytics` → `FeedbackAnalyticsController::index()`
- **Shows:**
  - Average rating, total feedback count
  - Rating distribution (1–5 stars)
  - Per-module: title, avg rating, feedback count, last feedback date
  - Recent feedback list: user name, module, rating, comment, suggestion
- **Accessible to:** ADMIN + TRAINER
- **Numbers correct?** Yes
- **Export?** None
- **Filters?** None (no per-module filter, no date range)
- **Empty states?** Should be handled — to verify in browser

### 3. User Progress (inline in Users page `/users`)
- **Shows:** Per-user progress % bar (completed modules / total modules)
- **Was broken** (progress_percentage field mismatch) — **FIXED in this session**
- **Useful?** Yes as a quick glance, but no drill-down

---

## Report Gaps

### Missing (Recommended to add)

| Report | Why Useful |
|--------|-----------|
| Date-range filter on Admin Dashboard | "How many completions this month?" is unanswerable |
| Leaderboard (top users by points) | Motivates learners, useful for merchant management |
| Per-module funnel | % who started → completed help → checklist → quiz → completed |
| Points ledger view (admin) | See who earned what and when; audit trail |
| AI chatbot usage stats | How many questions asked? Which modules most? Any unanswered? |
| Export (CSV) for user list | Currently no data export at all |
| Export (CSV) for completion report | Common request from training managers |

### Reports Present but Limited

| Report | Limitation |
|--------|-----------|
| Admin Dashboard | No date filter; no trend/graph |
| Merchant Adoption | Based on `merchant_name_entered` (free text) — may have spelling variations causing duplicates |
| Feedback Analytics | No date filter; no ability to filter by module |

### Reports That Should Be Removed
None — all existing reports are useful and accurate.

---

## Dashboard Notes for Management

1. **Merchant Adoption** accuracy depends on users entering their merchant name consistently at registration. Consider enforcing merchant selection from dropdown (matching `lms_merchants` table) rather than free text.

2. **Certificates Issued** counts all certificate rows across all types (module, path, expert). One user completing all modules could generate 8+ certificates. Consider showing "unique users certified" instead.

3. **Quiz Submissions** counts every submission including retakes. Consider showing "users who passed at least once" for a cleaner metric.
