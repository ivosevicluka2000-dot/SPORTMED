-- QA hardening: update a plan and all of its planned dates atomically.
-- If any statement fails, PostgreSQL rolls the entire function call back.

create or replace function public.update_rehab_plan_schedule(
  p_workspace_id uuid,
  p_patient_id uuid,
  p_plan_id uuid,
  p_title text,
  p_start_date date,
  p_goal text,
  p_notes text
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  plan_day_count integer;
  updated_plan_count integer;
  previous_start_date date;
begin
  if auth.uid() is null or not coalesce(public.rehab_can_edit_workspace(p_workspace_id), false) then
    raise exception 'Nemate dozvolu za izmenu plana.' using errcode = '42501';
  end if;

  if p_start_date is null or p_start_date < date '1900-01-01'
    or p_start_date > date '2100-12-31'
    or p_title is null or length(trim(p_title)) = 0 or length(p_title) > 200
    or length(coalesce(p_goal, '')) > 1000 or length(coalesce(p_notes, '')) > 3000 then
    raise exception 'Podaci plana nisu ispravni.' using errcode = '22023';
  end if;

  select start_date into previous_start_date
  from public.rehab_plans
  where id = p_plan_id and patient_id = p_patient_id and workspace_id = p_workspace_id
  for update;
  if not found then
    return false;
  end if;

  select coalesce(max(day_number), 0)
  into plan_day_count
  from public.rehab_plan_days
  where plan_id = p_plan_id
    and workspace_id = p_workspace_id;

  if plan_day_count = 0 then
    return false;
  end if;

  update public.rehab_plans
  set title = p_title,
      start_date = p_start_date,
      end_date = case when p_start_date = previous_start_date then end_date
        else p_start_date + (plan_day_count - 1) end,
      goal = p_goal,
      notes = p_notes
  where id = p_plan_id
    and patient_id = p_patient_id
    and workspace_id = p_workspace_id;

  get diagnostics updated_plan_count = row_count;
  if updated_plan_count <> 1 then
    return false;
  end if;

  update public.rehab_plan_days
  set planned_date = p_start_date + (day_number - 1)
  where plan_id = p_plan_id
    and workspace_id = p_workspace_id
    and p_start_date <> previous_start_date;

  return true;
end;
$$;

revoke all on function public.update_rehab_plan_schedule(
  uuid,
  uuid,
  uuid,
  text,
  date,
  text,
  text
) from public, anon;

grant execute on function public.update_rehab_plan_schedule(
  uuid,
  uuid,
  uuid,
  text,
  date,
  text,
  text
) to authenticated;
