# Curriculum Control Center — setup

This stack adds a **curriculum tree**, **KSDT tables**, **AI-assisted exam generation**, and **report shell** APIs on top of Supabase. The LearnConnect app is Vite + React; admin APIs live under `/api/*` (see `server/api`).

## 1. Database

1. Open the Supabase SQL editor or run CLI migrations.
2. Apply `supabase/migrations/20250331120000_curriculum_control_center.sql`.
3. Optional seed: set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then run:

   `node scripts/seed-curriculum-control-center.mjs`

## 2. Environment (Vercel / hosting)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to the browser)
- `OPENAI_API_KEY` (optional; exam generation falls back to placeholder items if missing)
- `OPENAI_EXAM_MODEL` (optional, default `gpt-4o-mini`)

## 3. Edge Functions (optional)

From the repo root (with Supabase CLI logged in):

- `supabase functions deploy generate-exam`
- `supabase functions deploy generate-report`

Set secrets: `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `OPENAI_EXAM_MODEL`.

The Vercel route `POST /api/exam/generate` already implements generation for the main deployment path.

## 4. Admin UI

- Navigate to `/admin/curriculum` (Firebase admin as configured in `useAdminAuth`).
- Build **curriculum_tree** nodes, then a **KSDT** table, add rows (objectives, counts, difficulty), then **Generate draft exam**.

## 5. Daily tasks + curriculum codes

`POST /api/tasks/generate` accepts optional `curriculumHints.weakObjectiveCodes` (e.g. `["F.8.4.3.1"]`). The learning orchestrator tags the first study task description and returns `meta.curriculumObjectiveCodes` so AI coach / clients can align tasks with the Supabase `curriculum_tree` codes.

### Auto-fill from `exam_attempts.topic_scores`

If you **do not** send `weakObjectiveCodes`, the server can load the weakest objective codes from Supabase `exam_attempts` (merged `topic_scores` from recent completed attempts, sorted by lowest score first). This runs when `autoCurriculumFromExamAttempts` is not `false` (default: on).

You must resolve the Neon session user to a **Supabase `auth.users` UUID** (exam rows use `student_id` UUID):

1. **Request body:** `supabaseUserId: "<uuid>"`
2. **Session profile:** `profile.supabaseUserId` (or `supabase_user_id`) when the session is extended after login
3. **Environment:** `NEON_TO_SUPABASE_USER_MAP` (JSON), e.g. `{"1001":"uuid-here"}` for demo / bridge users

Response `meta` includes `curriculumWeakCodesSource` (`manual` | `exam_attempts` | `none`) and optional `weakObjectiveAutoNote` when auto-fill could not run.

## 6. Student APIs

- `GET /api/user/curriculum-tree` — catalog read (service implementation; switch to JWT + RLS if you expose Supabase directly).
- Existing `POST /api/user/curriculum` — onboarding payload (see `StudentCurriculumOnboarding.tsx`).

## 7. Large imports (400+ topics)

Use JSON/CSV importers calling `POST /api/admin/curriculum-tree` in batches, or extend `scripts/seed-curriculum-control-center.mjs` with MEB/ÖDSGM-derived files stored in private object storage.

## 8. Verification (CI / deploy)

Per `cursor.md`, validate via your deploy pipeline: ensure build passes and hit `/api/health` and admin curriculum APIs on the deployed host.
