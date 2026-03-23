-- Study track module: tables, RLS, view, auth trigger, storage bucket policies
-- Run via: supabase db push (or SQL editor)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.students (
  id uuid primary key references auth.users (id) on delete cascade,
  goal_net int not null default 40,
  daily_minutes int not null default 60,
  current_net int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.study_logs (
  id uuid primary key default gen_random_uuid (),
  student_id uuid not null references public.students (id) on delete cascade,
  topic_id text not null,
  duration int not null default 0,
  net int,
  created_at timestamptz not null default now()
);

create index if not exists study_logs_student_created_idx on public.study_logs (student_id, created_at desc);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid (),
  student_id uuid not null references public.students (id) on delete cascade,
  title text not null,
  duration int not null default 0,
  type text not null default 'study',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists tasks_student_created_idx on public.tasks (student_id, created_at desc);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  event_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_user_created_idx on public.analytics_events (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- View: aggregate study time per student
-- ---------------------------------------------------------------------------

create or replace view public.student_metrics
with
  (security_invoker = true) as
select
  student_id,
  count(*)::bigint as total_sessions,
  coalesce(sum(duration), 0)::bigint as total_minutes
from
  public.study_logs
group by
  student_id;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.students enable row level security;
alter table public.study_logs enable row level security;
alter table public.tasks enable row level security;
alter table public.analytics_events enable row level security;

-- students: own row only
drop policy if exists "students_select_own" on public.students;
create policy "students_select_own" on public.students for
select
  using (auth.uid () = id);

drop policy if exists "students_insert_own" on public.students;
create policy "students_insert_own" on public.students for insert
with
  check (auth.uid () = id);

drop policy if exists "students_update_own" on public.students;
create policy "students_update_own" on public.students for
update using (auth.uid () = id);

-- study_logs
drop policy if exists "study_logs_select_own" on public.study_logs;
create policy "study_logs_select_own" on public.study_logs for
select
  using (student_id = auth.uid ());

drop policy if exists "study_logs_insert_own" on public.study_logs;
create policy "study_logs_insert_own" on public.study_logs for insert
with
  check (student_id = auth.uid ());

drop policy if exists "study_logs_update_own" on public.study_logs;
create policy "study_logs_update_own" on public.study_logs for
update using (student_id = auth.uid ());

drop policy if exists "study_logs_delete_own" on public.study_logs;
create policy "study_logs_delete_own" on public.study_logs for delete using (student_id = auth.uid ());

-- tasks
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks for
select
  using (student_id = auth.uid ());

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks for insert
with
  check (student_id = auth.uid ());

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks for
update using (student_id = auth.uid ());

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks for delete using (student_id = auth.uid ());

-- analytics_events
drop policy if exists "analytics_select_own" on public.analytics_events;
create policy "analytics_select_own" on public.analytics_events for
select
  using (auth.uid () = user_id);

drop policy if exists "analytics_insert_own" on public.analytics_events;
create policy "analytics_insert_own" on public.analytics_events for insert
with
  check (auth.uid () = user_id);

-- ---------------------------------------------------------------------------
-- Auto-create student profile on signup
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user () returns trigger
language plpgsql
security definer
set
  search_path = public
as $$
begin
  insert into public.students (id, goal_net, daily_minutes, current_net)
  values (new.id, 40, 60, 0)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Storage: private bucket for PDF reports (paths: {user_id}/file.pdf)
-- ---------------------------------------------------------------------------

insert into
  storage.buckets (id, name, public)
values
  ('reports', 'reports', false)
on conflict (id) do nothing;

drop policy if exists "reports_insert_own" on storage.objects;
create policy "reports_insert_own" on storage.objects for insert to authenticated
with
  check (
    bucket_id = 'reports'
    and split_part (name, '/', 1) = auth.uid ()::text
  );

drop policy if exists "reports_select_own" on storage.objects;
create policy "reports_select_own" on storage.objects for
select
  to authenticated using (
    bucket_id = 'reports'
    and split_part (name, '/', 1) = auth.uid ()::text
  );

drop policy if exists "reports_update_own" on storage.objects;
create policy "reports_update_own" on storage.objects for
update to authenticated using (
  bucket_id = 'reports'
  and split_part (name, '/', 1) = auth.uid ()::text
);

drop policy if exists "reports_delete_own" on storage.objects;
create policy "reports_delete_own" on storage.objects for delete to authenticated using (
  bucket_id = 'reports'
  and split_part (name, '/', 1) = auth.uid ()::text
);
