-- Curriculum Control Center: MEB-aligned tree, KSDT, exams, org, audit
-- Apply with: supabase db push (or SQL editor)

-- ---------------------------------------------------------------------------
-- Exam categories (TYT / AYT / MEB grade-level, etc.) — admin CRUD
-- ---------------------------------------------------------------------------

create table if not exists public.exam_categories (
  id uuid primary key default gen_random_uuid (),
  slug text not null unique,
  name text not null,
  exam_type text,
  description text,
  display_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create index if not exists exam_categories_exam_type_idx on public.exam_categories (exam_type);

-- ---------------------------------------------------------------------------
-- curriculum_tree: Subject → Unit → Topic → Subtopic → Learning objective
-- ---------------------------------------------------------------------------

create table if not exists public.curriculum_tree (
  id uuid primary key default gen_random_uuid (),
  code text not null unique,
  name text not null,
  type text not null,
  parent_id uuid references public.curriculum_tree (id) on delete cascade,
  exam_category_id uuid references public.exam_categories (id) on delete set null,
  sort_order int not null default 0,
  difficulty int not null default 3,
  prerequisites uuid[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  linked_topic_id uuid,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint curriculum_tree_type_chk check (
    type in (
      'subject',
      'unit',
      'topic',
      'subtopic',
      'learning_objective'
    )
  ),
  constraint curriculum_tree_difficulty_chk check (difficulty between 1 and 5)
);

create index if not exists curriculum_tree_parent_idx on public.curriculum_tree (parent_id);
create index if not exists curriculum_tree_category_idx on public.curriculum_tree (exam_category_id);
create index if not exists curriculum_tree_type_idx on public.curriculum_tree (type);

-- ---------------------------------------------------------------------------
-- KSDT builder
-- ---------------------------------------------------------------------------

create table if not exists public.ksdt_tables (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  description text,
  exam_category_id uuid references public.exam_categories (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

create table if not exists public.ksdt_rows (
  id uuid primary key default gen_random_uuid (),
  ksdt_table_id uuid not null references public.ksdt_tables (id) on delete cascade,
  learning_objective_id uuid references public.curriculum_tree (id) on delete set null,
  question_count int not null default 1,
  difficulty text not null default 'medium',
  question_type text not null default 'multiple_choice',
  sort_order int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint ksdt_rows_difficulty_chk check (difficulty in ('easy', 'medium', 'hard'))
);

create index if not exists ksdt_rows_table_idx on public.ksdt_rows (ksdt_table_id);
create index if not exists ksdt_rows_lo_idx on public.ksdt_rows (learning_objective_id);

-- ---------------------------------------------------------------------------
-- Exams
-- ---------------------------------------------------------------------------

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid (),
  title text not null,
  ksdt_table_id uuid references public.ksdt_tables (id) on delete set null,
  status text not null default 'draft',
  created_by uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  constraint exams_status_chk check (status in ('draft', 'published', 'archived'))
);

create index if not exists exams_status_idx on public.exams (status);

create table if not exists public.exam_questions (
  id uuid primary key default gen_random_uuid (),
  exam_id uuid not null references public.exams (id) on delete cascade,
  ksdt_row_id uuid references public.ksdt_rows (id) on delete set null,
  learning_objective_code text,
  question_text text not null,
  options jsonb,
  correct_answer text,
  explanation text,
  ai_generated boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now ()
);

create index if not exists exam_questions_exam_idx on public.exam_questions (exam_id);

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid (),
  exam_id uuid not null references public.exams (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score double precision,
  topic_scores jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now (),
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists exam_attempts_student_idx on public.exam_attempts (student_id);
create index if not exists exam_attempts_exam_idx on public.exam_attempts (exam_id);

-- ---------------------------------------------------------------------------
-- AI logs & audit
-- ---------------------------------------------------------------------------

create table if not exists public.exam_generation_logs (
  id uuid primary key default gen_random_uuid (),
  exam_id uuid references public.exams (id) on delete set null,
  ksdt_table_id uuid references public.ksdt_tables (id) on delete set null,
  prompt text,
  model text,
  response jsonb,
  error text,
  created_at timestamptz not null default now ()
);

create table if not exists public.curriculum_audit_log (
  id uuid primary key default gen_random_uuid (),
  table_name text not null,
  record_id uuid not null,
  action text not null,
  actor_id uuid references auth.users (id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now ()
);

-- ---------------------------------------------------------------------------
-- Departments / assignments (zümre)
-- ---------------------------------------------------------------------------

create table if not exists public.teacher_departments (
  teacher_id uuid not null references auth.users (id) on delete cascade,
  department text not null,
  subject_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now (),
  primary key (teacher_id, department)
);

create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid (),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  student_id uuid not null references auth.users (id) on delete cascade,
  exam_category_id uuid references public.exam_categories (id) on delete set null,
  note text,
  created_at timestamptz not null default now (),
  unique (teacher_id, student_id, exam_category_id)
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at () returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists exam_categories_updated on public.exam_categories;
create trigger exam_categories_updated
before update on public.exam_categories for each row
execute function public.set_updated_at ();

drop trigger if exists curriculum_tree_updated on public.curriculum_tree;
create trigger curriculum_tree_updated
before update on public.curriculum_tree for each row
execute function public.set_updated_at ();

drop trigger if exists ksdt_tables_updated on public.ksdt_tables;
create trigger ksdt_tables_updated
before update on public.ksdt_tables for each row
execute function public.set_updated_at ();

drop trigger if exists ksdt_rows_updated on public.ksdt_rows;
create trigger ksdt_rows_updated
before update on public.ksdt_rows for each row
execute function public.set_updated_at ();

drop trigger if exists exams_updated on public.exams;
create trigger exams_updated
before update on public.exams for each row
execute function public.set_updated_at ();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.exam_categories enable row level security;
alter table public.curriculum_tree enable row level security;
alter table public.ksdt_tables enable row level security;
alter table public.ksdt_rows enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_generation_logs enable row level security;
alter table public.curriculum_audit_log enable row level security;
alter table public.teacher_departments enable row level security;
alter table public.teacher_assignments enable row level security;

-- Read curriculum for any authenticated user (learning app)
drop policy if exists "exam_categories_select_auth" on public.exam_categories;
create policy "exam_categories_select_auth" on public.exam_categories for select to authenticated using (true);

drop policy if exists "curriculum_tree_select_auth" on public.curriculum_tree;
create policy "curriculum_tree_select_auth" on public.curriculum_tree for select to authenticated using (true);

drop policy if exists "ksdt_tables_select_auth" on public.ksdt_tables;
create policy "ksdt_tables_select_auth" on public.ksdt_tables for select to authenticated using (true);

drop policy if exists "ksdt_rows_select_auth" on public.ksdt_rows;
create policy "ksdt_rows_select_auth" on public.ksdt_rows for select to authenticated using (true);

-- Students: only published exams + their attempts
drop policy if exists "exams_select_published" on public.exams;
create policy "exams_select_published" on public.exams for select to authenticated using (status = 'published');

drop policy if exists "exam_questions_select_published" on public.exam_questions;
create policy "exam_questions_select_published" on public.exam_questions for select to authenticated using (
  exists (select 1 from public.exams e where e.id = exam_id and e.status = 'published')
);

drop policy if exists "exam_attempts_own" on public.exam_attempts;
create policy "exam_attempts_own" on public.exam_attempts for all to authenticated using (student_id = auth.uid ())
with check (student_id = auth.uid ());

-- Teacher: own department rows (simple)
drop policy if exists "teacher_departments_own" on public.teacher_departments;
create policy "teacher_departments_own" on public.teacher_departments for all to authenticated using (teacher_id = auth.uid ())
with check (teacher_id = auth.uid ());

drop policy if exists "teacher_assignments_teacher_or_student" on public.teacher_assignments;
create policy "teacher_assignments_teacher_or_student" on public.teacher_assignments for select to authenticated using (
  teacher_id = auth.uid () or student_id = auth.uid ()
);

drop policy if exists "teacher_assignments_teacher_write" on public.teacher_assignments;
create policy "teacher_assignments_teacher_write" on public.teacher_assignments for insert to authenticated with check (teacher_id = auth.uid ());

drop policy if exists "teacher_assignments_teacher_update" on public.teacher_assignments;
create policy "teacher_assignments_teacher_update" on public.teacher_assignments for
update to authenticated using (teacher_id = auth.uid ());

-- Writes for curriculum/exams from client: denied by default; use service role in API / Edge Functions.
