-- ============================================================================
-- Sport Care Med — basic rehabilitation workspace
-- Clinic and club data are separated by workspace and protected with RLS.
-- ============================================================================

-- Fixed workspaces keep the first release intentionally small and predictable.
create table if not exists public.rehab_workspaces (
  id          uuid primary key default uuid_generate_v4(),
  slug        text unique not null check (slug in ('clinic', 'club')),
  name        text not null,
  kind        text not null check (kind in ('clinic', 'club')),
  created_at  timestamptz not null default now()
);

insert into public.rehab_workspaces (id, slug, name, kind)
values
  ('00000000-0000-0000-0000-000000000101', 'clinic', 'Sport Care & Med', 'clinic'),
  ('00000000-0000-0000-0000-000000000102', 'club', 'Klub', 'club')
on conflict (slug) do update
set name = excluded.name,
    kind = excluded.kind;

create table if not exists public.rehab_workspace_members (
  workspace_id uuid not null references public.rehab_workspaces(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null check (role in ('owner', 'therapist', 'viewer')),
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index if not exists rehab_workspace_members_user_idx
  on public.rehab_workspace_members(user_id);

-- A staff account belongs to exactly one workspace. Global administrators do
-- not need a membership row because is_admin() grants access to both spaces.
create unique index if not exists rehab_workspace_members_one_workspace_per_user_idx
  on public.rehab_workspace_members(user_id);

-- These helpers are security-definer functions so policies can inspect
-- membership without recursively triggering the membership table policies.
create or replace function public.rehab_can_access_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.rehab_workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.rehab_can_edit_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.rehab_workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'therapist')
  );
$$;

create or replace function public.rehab_can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.rehab_workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

revoke all on function public.rehab_can_access_workspace(uuid) from public;
revoke all on function public.rehab_can_edit_workspace(uuid) from public;
revoke all on function public.rehab_can_manage_workspace(uuid) from public;
grant execute on function public.rehab_can_access_workspace(uuid) to authenticated;
grant execute on function public.rehab_can_edit_workspace(uuid) to authenticated;
grant execute on function public.rehab_can_manage_workspace(uuid) to authenticated;

create table if not exists public.rehab_patients (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.rehab_workspaces(id) on delete restrict,
  record_type   text not null check (record_type in ('patient', 'player')),
  first_name    text not null,
  last_name     text not null,
  email         citext,
  phone         text,
  birth_date    date,
  problem       text,
  started_on    date not null default current_date,
  status        text not null default 'active' check (status in ('active', 'completed')),
  completed_at  timestamptz,
  notes         text,
  created_by    uuid not null references public.profiles(id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, workspace_id)
);

alter table public.rehab_patients
  add column if not exists completed_at timestamptz;

create index if not exists rehab_patients_workspace_status_idx
  on public.rehab_patients(workspace_id, status);
create index if not exists rehab_patients_name_idx
  on public.rehab_patients(workspace_id, last_name, first_name);
create index if not exists rehab_patients_workspace_completed_idx
  on public.rehab_patients(workspace_id, completed_at desc)
  where completed_at is not null;

create table if not exists public.rehab_daily_entries (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid not null references public.rehab_workspaces(id) on delete restrict,
  patient_id        uuid not null,
  recorded_on       date not null default current_date,
  condition_summary text not null,
  pain_level        smallint check (pain_level is null or pain_level between 0 and 10),
  therapy           text not null,
  notes             text,
  created_by        uuid not null references public.profiles(id) on delete restrict,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  foreign key (patient_id, workspace_id)
    references public.rehab_patients(id, workspace_id) on delete cascade
);

create index if not exists rehab_daily_entries_patient_date_idx
  on public.rehab_daily_entries(patient_id, recorded_on desc);
create index if not exists rehab_daily_entries_workspace_date_idx
  on public.rehab_daily_entries(workspace_id, recorded_on desc);

create table if not exists public.rehab_plans (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.rehab_workspaces(id) on delete restrict,
  patient_id    uuid not null,
  title         text not null,
  start_date    date not null,
  end_date      date not null check (end_date >= start_date),
  goal          text,
  notes         text,
  status        text not null default 'active' check (status in ('active', 'completed')),
  created_by    uuid not null references public.profiles(id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (patient_id, workspace_id)
    references public.rehab_patients(id, workspace_id) on delete cascade
);

create index if not exists rehab_plans_patient_idx
  on public.rehab_plans(patient_id, status, start_date desc);

create table if not exists public.rehab_plan_days (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.rehab_workspaces(id) on delete restrict,
  plan_id       uuid not null,
  day_number    smallint not null check (day_number between 1 and 366),
  planned_date  date,
  instructions  text not null,
  created_by    uuid not null references public.profiles(id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (plan_id, day_number),
  foreign key (plan_id, workspace_id)
    references public.rehab_plans(id, workspace_id) on delete cascade
);

create index if not exists rehab_plan_days_plan_idx
  on public.rehab_plan_days(plan_id, day_number);

create table if not exists public.rehab_appointments (
  id                     uuid primary key default uuid_generate_v4(),
  workspace_id           uuid not null references public.rehab_workspaces(id) on delete restrict,
  patient_id             uuid not null,
  starts_at              timestamptz not null,
  duration_minutes       smallint not null default 60 check (duration_minutes between 15 and 240),
  therapy                text,
  notes                  text,
  status                 text not null default 'scheduled'
                           check (status in ('scheduled', 'completed', 'cancelled')),
  reminder_email         citext,
  reminder_hours_before  smallint not null default 24
                           check (reminder_hours_before between 1 and 168),
  reminder_sent_at       timestamptz,
  created_by             uuid not null references public.profiles(id) on delete restrict,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  foreign key (patient_id, workspace_id)
    references public.rehab_patients(id, workspace_id) on delete cascade
);

create index if not exists rehab_appointments_workspace_time_idx
  on public.rehab_appointments(workspace_id, starts_at);
create index if not exists rehab_appointments_reminder_idx
  on public.rehab_appointments(starts_at, reminder_sent_at)
  where status = 'scheduled' and reminder_sent_at is null and reminder_email is not null;

create table if not exists public.rehab_period_summaries (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.rehab_workspaces(id) on delete cascade,
  period_type   text not null check (period_type in ('month', 'year')),
  period_start  date not null,
  conclusion    text not null default '',
  created_by    uuid not null references public.profiles(id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (workspace_id, period_type, period_start)
);

create index if not exists rehab_period_summaries_workspace_idx
  on public.rehab_period_summaries(workspace_id, period_start desc);

-- Keep updated_at consistent with the existing application tables.
drop trigger if exists tg_rehab_patients_updated on public.rehab_patients;
create trigger tg_rehab_patients_updated before update on public.rehab_patients
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_rehab_daily_entries_updated on public.rehab_daily_entries;
create trigger tg_rehab_daily_entries_updated before update on public.rehab_daily_entries
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_rehab_plans_updated on public.rehab_plans;
create trigger tg_rehab_plans_updated before update on public.rehab_plans
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_rehab_plan_days_updated on public.rehab_plan_days;
create trigger tg_rehab_plan_days_updated before update on public.rehab_plan_days
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_rehab_appointments_updated on public.rehab_appointments;
create trigger tg_rehab_appointments_updated before update on public.rehab_appointments
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_rehab_period_summaries_updated on public.rehab_period_summaries;
create trigger tg_rehab_period_summaries_updated before update on public.rehab_period_summaries
  for each row execute function public.tg_set_updated_at();

-- Row Level Security ---------------------------------------------------------
alter table public.rehab_workspaces          enable row level security;
alter table public.rehab_workspace_members   enable row level security;
alter table public.rehab_patients            enable row level security;
alter table public.rehab_daily_entries       enable row level security;
alter table public.rehab_plans               enable row level security;
alter table public.rehab_plan_days            enable row level security;
alter table public.rehab_appointments        enable row level security;
alter table public.rehab_period_summaries    enable row level security;

drop policy if exists rehab_workspaces_select on public.rehab_workspaces;
create policy rehab_workspaces_select on public.rehab_workspaces
  for select using (public.rehab_can_access_workspace(id));

drop policy if exists rehab_workspaces_admin_write on public.rehab_workspaces;
create policy rehab_workspaces_admin_write on public.rehab_workspaces
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists rehab_members_select on public.rehab_workspace_members;
create policy rehab_members_select on public.rehab_workspace_members
  for select using (
    public.is_admin()
    or user_id = auth.uid()
    or public.rehab_can_manage_workspace(workspace_id)
  );

drop policy if exists rehab_members_manage on public.rehab_workspace_members;
create policy rehab_members_manage on public.rehab_workspace_members
  for all using (public.rehab_can_manage_workspace(workspace_id))
  with check (public.rehab_can_manage_workspace(workspace_id));

drop policy if exists rehab_patients_select on public.rehab_patients;
create policy rehab_patients_select on public.rehab_patients
  for select using (public.rehab_can_access_workspace(workspace_id));
drop policy if exists rehab_patients_write on public.rehab_patients;
create policy rehab_patients_write on public.rehab_patients
  for all using (public.rehab_can_edit_workspace(workspace_id))
  with check (public.rehab_can_edit_workspace(workspace_id));

drop policy if exists rehab_daily_entries_select on public.rehab_daily_entries;
create policy rehab_daily_entries_select on public.rehab_daily_entries
  for select using (public.rehab_can_access_workspace(workspace_id));
drop policy if exists rehab_daily_entries_write on public.rehab_daily_entries;
create policy rehab_daily_entries_write on public.rehab_daily_entries
  for all using (public.rehab_can_edit_workspace(workspace_id))
  with check (public.rehab_can_edit_workspace(workspace_id));

drop policy if exists rehab_plans_select on public.rehab_plans;
create policy rehab_plans_select on public.rehab_plans
  for select using (public.rehab_can_access_workspace(workspace_id));
drop policy if exists rehab_plans_write on public.rehab_plans;
create policy rehab_plans_write on public.rehab_plans
  for all using (public.rehab_can_edit_workspace(workspace_id))
  with check (public.rehab_can_edit_workspace(workspace_id));

drop policy if exists rehab_plan_days_select on public.rehab_plan_days;
create policy rehab_plan_days_select on public.rehab_plan_days
  for select using (public.rehab_can_access_workspace(workspace_id));
drop policy if exists rehab_plan_days_write on public.rehab_plan_days;
create policy rehab_plan_days_write on public.rehab_plan_days
  for all using (public.rehab_can_edit_workspace(workspace_id))
  with check (public.rehab_can_edit_workspace(workspace_id));

drop policy if exists rehab_appointments_select on public.rehab_appointments;
create policy rehab_appointments_select on public.rehab_appointments
  for select using (public.rehab_can_access_workspace(workspace_id));
drop policy if exists rehab_appointments_write on public.rehab_appointments;
create policy rehab_appointments_write on public.rehab_appointments
  for all using (public.rehab_can_edit_workspace(workspace_id))
  with check (public.rehab_can_edit_workspace(workspace_id));

drop policy if exists rehab_period_summaries_select on public.rehab_period_summaries;
create policy rehab_period_summaries_select on public.rehab_period_summaries
  for select using (public.rehab_can_access_workspace(workspace_id));
drop policy if exists rehab_period_summaries_write on public.rehab_period_summaries;
create policy rehab_period_summaries_write on public.rehab_period_summaries
  for all using (public.rehab_can_edit_workspace(workspace_id))
  with check (public.rehab_can_edit_workspace(workspace_id));
