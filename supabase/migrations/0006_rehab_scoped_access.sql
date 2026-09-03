-- Scoped Rehab access:
-- - global admin: every workspace
-- - clinic therapist/viewer: the clinic workspace only
-- - club viewer: every player in one club
-- - player: only their own card, daily entries, plans and plan days
-- Also allows more than one club workspace.

alter table public.rehab_workspaces
  drop constraint if exists rehab_workspaces_slug_check;

alter table public.rehab_workspace_members
  add column if not exists patient_id uuid;

alter table public.rehab_workspace_members
  drop constraint if exists rehab_workspace_members_role_check;

alter table public.rehab_workspace_members
  add constraint rehab_workspace_members_role_check
  check (role in ('owner', 'therapist', 'viewer', 'player'));

alter table public.rehab_workspace_members
  drop constraint if exists rehab_workspace_members_patient_scope_check;

alter table public.rehab_workspace_members
  add constraint rehab_workspace_members_patient_scope_check
  check (
    (role = 'player' and patient_id is not null)
    or (role <> 'player' and patient_id is null)
  );

alter table public.rehab_workspace_members
  drop constraint if exists rehab_workspace_members_patient_workspace_fkey;

alter table public.rehab_workspace_members
  add constraint rehab_workspace_members_patient_workspace_fkey
  foreign key (patient_id, workspace_id)
  references public.rehab_patients(id, workspace_id)
  on delete cascade;

create index if not exists rehab_workspace_members_patient_idx
  on public.rehab_workspace_members(patient_id)
  where patient_id is not null;

-- Any membership may read workspace metadata so the platform can display its
-- name. Data policies below use the stricter full-workspace/patient helpers.
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

create or replace function public.rehab_can_access_full_workspace(target_workspace_id uuid)
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
      and role in ('owner', 'therapist', 'viewer')
  );
$$;

create or replace function public.rehab_can_access_patient(
  target_workspace_id uuid,
  target_patient_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.rehab_can_access_full_workspace(target_workspace_id) or exists (
    select 1
    from public.rehab_workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role = 'player'
      and patient_id = target_patient_id
  );
$$;

create or replace function public.rehab_can_access_plan(
  target_workspace_id uuid,
  target_plan_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.rehab_plans plan
    where plan.id = target_plan_id
      and plan.workspace_id = target_workspace_id
      and public.rehab_can_access_patient(plan.workspace_id, plan.patient_id)
  );
$$;

revoke all on function public.rehab_can_access_full_workspace(uuid) from public;
revoke all on function public.rehab_can_access_patient(uuid, uuid) from public;
revoke all on function public.rehab_can_access_plan(uuid, uuid) from public;
grant execute on function public.rehab_can_access_full_workspace(uuid) to authenticated;
grant execute on function public.rehab_can_access_patient(uuid, uuid) to authenticated;
grant execute on function public.rehab_can_access_plan(uuid, uuid) to authenticated;

drop policy if exists rehab_patients_select on public.rehab_patients;
create policy rehab_patients_select on public.rehab_patients
  for select using (public.rehab_can_access_patient(workspace_id, id));

drop policy if exists rehab_daily_entries_select on public.rehab_daily_entries;
create policy rehab_daily_entries_select on public.rehab_daily_entries
  for select using (public.rehab_can_access_patient(workspace_id, patient_id));

drop policy if exists rehab_plans_select on public.rehab_plans;
create policy rehab_plans_select on public.rehab_plans
  for select using (public.rehab_can_access_patient(workspace_id, patient_id));

drop policy if exists rehab_plan_days_select on public.rehab_plan_days;
create policy rehab_plan_days_select on public.rehab_plan_days
  for select using (public.rehab_can_access_plan(workspace_id, plan_id));

drop policy if exists rehab_appointments_select on public.rehab_appointments;
create policy rehab_appointments_select on public.rehab_appointments
  for select using (public.rehab_can_access_full_workspace(workspace_id));

drop policy if exists rehab_period_summaries_select on public.rehab_period_summaries;
create policy rehab_period_summaries_select on public.rehab_period_summaries
  for select using (public.rehab_can_access_full_workspace(workspace_id));

drop policy if exists rehab_entry_images_select on storage.objects;
create policy rehab_entry_images_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'rehab-entry-images'
    and case
      when array_length(storage.foldername(name), 1) >= 2
        and (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then public.rehab_can_access_patient(
        ((storage.foldername(name))[1])::uuid,
        ((storage.foldername(name))[2])::uuid
      )
      else false
    end
  );
