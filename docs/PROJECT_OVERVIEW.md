# eWards Learning Hub — Project Overview

## What It Is
A white-label LMS (Learning Management System) built for eWards merchants and staff. Trainers publish product-training modules; cashiers and clients complete them, earn points, and receive certificates.

## User Roles

| Role     | Access                                         |
|----------|------------------------------------------------|
| ADMIN    | Everything: users, approvals, analytics, content, feedback |
| TRAINER  | Content manager, feedback analytics            |
| CASHIER  | Learning hub, progress, quiz, certificate      |
| CLIENT   | Same as CASHIER (brand owners / managers)      |

## Core Flows

### Learner Flow
1. Register → auto-approved → login
2. Browse Learning Hub → open module
3. Watch intro video → read sections → complete checklist
4. (Optional) Practice prototype
5. Complete quiz (must pass ≥ passing_percent, default 75%)
6. Module marked complete → points awarded → certificate issued (if enabled)

### Trainer/Admin Flow
1. Login → Content Manager
2. Create module (title, icon, video, sections, checklist, quiz)
3. Publish module → learners see it
4. View feedback analytics

### Admin-Only Flow
1. Manage users (create, edit, approve, reject, delete)
2. View pending registrations → approve with merchant/outlet mapping
3. Admin Dashboard → module completion rates, merchant adoption

## Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Backend    | Laravel 13, PHP 8.3, MySQL 8+                   |
| Frontend   | React 19, TypeScript, Ant Design 6, Vite 8      |
| Auth       | Laravel Sanctum (Bearer tokens)                 |
| AI         | HuggingFace embeddings + Groq LLM (RAG)         |
| PDF        | barryvdh/laravel-dompdf                         |
| Files      | Local storage (public/uploads) + Cloudinary option |
| Queue      | Database (for PDF generation, AI indexing)      |

## Table Naming Convention
All tables use `lms_` prefix (e.g. `lms_users`, `lms_modules`, `lms_progress`).

## Points & Levels

| Level        | Points Required |
|--------------|-----------------|
| Beginner     | 0–99            |
| Practitioner | 100–249         |
| Specialist   | 250–499         |
| Expert       | 500+            |

Points sources: module completion (+50 default), quiz bonus (+20), prototype completion (+30).

## Certificate Types

| Type   | Triggered by                           |
|--------|----------------------------------------|
| module | Completing a module with cert enabled  |
| path   | Completing ALL published modules       |
| expert | Reaching 300+ total points             |
