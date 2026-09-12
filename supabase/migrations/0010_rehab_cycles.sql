-- Cycles are phases, not calendar days. Legacy daily plans retain their dates.
begin;
alter table public.rehab_plans add column format text not null default 'daily' check (format in ('daily', 'cycles'));
alter table public.rehab_plans alter column end_date drop not null;
alter table public.rehab_plans add constraint rehab_daily_end_required check (format = 'cycles' or end_date is not null);

create table public.rehab_plan_cycles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.rehab_workspaces(id),
  plan_id uuid not null,
  cycle_number integer not null check (cycle_number between 1 and 100),
  title text not null check (length(trim(title)) between 1 and 200),
  goal text check (length(goal) <= 1000),
  instructions text not null check (length(trim(instructions)) between 1 and 10000),
  start_date date check (start_date between date '1900-01-01' and date '2100-12-31'),
  end_date date check (end_date between date '1900-01-01' and date '2100-12-31'),
  status text not null default 'planned' check (status in ('planned','in_progress','completed')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rehab_cycles_dates check (end_date is null or start_date is null or end_date >= start_date),
  constraint rehab_cycles_order unique (plan_id,cycle_number) deferrable initially immediate,
  constraint rehab_cycles_plan_workspace_fkey foreign key (plan_id,workspace_id)
    references public.rehab_plans(id,workspace_id) on delete cascade deferrable initially immediate
);
create trigger tg_rehab_cycles_updated before update on public.rehab_plan_cycles
  for each row execute function public.tg_set_updated_at();
alter table public.rehab_plan_cycles enable row level security;
create policy rehab_cycles_read on public.rehab_plan_cycles for select to authenticated
  using (public.rehab_can_access_plan(workspace_id,plan_id));
create policy rehab_cycles_insert on public.rehab_plan_cycles for insert to authenticated
  with check (public.rehab_can_edit_workspace(workspace_id) and created_by = auth.uid()
    and exists (select 1 from public.rehab_plans p where p.id=plan_id and p.workspace_id=rehab_plan_cycles.workspace_id and p.format='cycles'));
create policy rehab_cycles_update on public.rehab_plan_cycles for update to authenticated
  using (public.rehab_can_edit_workspace(workspace_id))
  with check (public.rehab_can_edit_workspace(workspace_id)
    and exists (select 1 from public.rehab_plans p where p.id=plan_id and p.workspace_id=rehab_plan_cycles.workspace_id and p.format='cycles'));
create policy rehab_cycles_delete on public.rehab_plan_cycles for delete to authenticated
  using (public.rehab_can_edit_workspace(workspace_id));
grant select,insert,update,delete on public.rehab_plan_cycles to authenticated;

create function public.save_rehab_cycle_plan(
  p_workspace_id uuid, p_patient_id uuid, p_plan_id uuid,
  p_title text, p_start_date date, p_end_date date, p_goal text, p_notes text, p_cycles jsonb
) returns uuid language plpgsql security invoker set search_path = public as $$
declare target_id uuid; item jsonb; position integer := 0; cycle_id uuid; seen uuid[] := '{}';
begin
  if auth.uid() is null or not coalesce(public.rehab_can_edit_workspace(p_workspace_id),false) then
    raise exception 'Not authorized' using errcode='42501';
  end if;
  -- Lock the card too, so a concurrent club transfer cannot split this operation.
  perform 1 from public.rehab_patients where id=p_patient_id and workspace_id=p_workspace_id for update;
  if not found then raise exception 'Card not found' using errcode='22023'; end if;
  if p_title is null or length(trim(p_title)) not between 1 and 200
    or p_start_date is null or p_start_date not between date '1900-01-01' and date '2100-12-31'
    or (p_end_date is not null and (p_end_date < p_start_date or p_end_date > date '2100-12-31'))
    or length(coalesce(p_goal,''))>1000 or length(coalesce(p_notes,''))>3000
    or p_cycles is null or jsonb_typeof(p_cycles)<>'array' then
    raise exception 'Invalid plan' using errcode='22023';
  end if;
  if jsonb_array_length(p_cycles) not between 1 and 100 then raise exception 'Invalid cycle count' using errcode='22023'; end if;
  if p_plan_id is null then
    insert into public.rehab_plans(workspace_id,patient_id,title,start_date,end_date,goal,notes,format,created_by)
      values(p_workspace_id,p_patient_id,trim(p_title),p_start_date,p_end_date,p_goal,p_notes,'cycles',auth.uid()) returning id into target_id;
  else
    select id into target_id from public.rehab_plans
      where id=p_plan_id and patient_id=p_patient_id and workspace_id=p_workspace_id and format='cycles' for update;
    if not found then raise exception 'Cycle plan not found' using errcode='22023'; end if;
    update public.rehab_plans set title=trim(p_title),start_date=p_start_date,end_date=p_end_date,goal=p_goal,notes=p_notes where id=target_id;
  end if;
  set constraints rehab_cycles_order deferred;
  for item in select value from jsonb_array_elements(p_cycles) loop
    position := position+1;
    cycle_id := nullif(item->>'id','')::uuid;
    if cycle_id is not null then
      if cycle_id=any(seen) or not exists (select 1 from public.rehab_plan_cycles where id=cycle_id and plan_id=target_id and workspace_id=p_workspace_id) then
        raise exception 'Invalid cycle identifier' using errcode='22023';
      end if;
      update public.rehab_plan_cycles set cycle_number=position,title=trim(item->>'title'),goal=nullif(item->>'goal',''),
        instructions=trim(item->>'instructions'),start_date=nullif(item->>'start_date','')::date,
        end_date=nullif(item->>'end_date','')::date,status=item->>'status'
        where id=cycle_id and plan_id=target_id and workspace_id=p_workspace_id;
    else
      insert into public.rehab_plan_cycles(workspace_id,plan_id,cycle_number,title,goal,instructions,start_date,end_date,status,created_by)
        values(p_workspace_id,target_id,position,trim(item->>'title'),nullif(item->>'goal',''),trim(item->>'instructions'),
        nullif(item->>'start_date','')::date,nullif(item->>'end_date','')::date,item->>'status',auth.uid()) returning id into cycle_id;
    end if;
    seen := array_append(seen,cycle_id);
  end loop;
  delete from public.rehab_plan_cycles where plan_id=target_id and workspace_id=p_workspace_id and not(id=any(seen));
  set constraints rehab_cycles_order immediate;
  return target_id;
end;
$$;
revoke all on function public.save_rehab_cycle_plan(uuid,uuid,uuid,text,date,date,text,text,jsonb) from public,anon;
grant execute on function public.save_rehab_cycle_plan(uuid,uuid,uuid,text,date,date,text,text,jsonb) to authenticated;

create function public.copy_rehab_cycle_plan(p_workspace_id uuid,p_patient_id uuid,p_plan_id uuid,p_target_patient_id uuid,p_start_date date)
returns uuid language plpgsql security invoker set search_path=public as $$
declare source public.rehab_plans%rowtype; cycles jsonb;
begin
  if auth.uid() is null or not coalesce(public.rehab_can_edit_workspace(p_workspace_id),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  -- Match the card -> plan lock order used by save/transfer.
  perform 1 from public.rehab_patients where workspace_id=p_workspace_id and id in (p_patient_id,p_target_patient_id) order by id for update;
  select * into source from public.rehab_plans where id=p_plan_id and patient_id=p_patient_id and workspace_id=p_workspace_id and format='cycles' for update;
  if not found then raise exception 'Cycle plan not found' using errcode='22023'; end if;
  select jsonb_agg(jsonb_build_object('title',title,'goal',goal,'instructions',instructions,'status','planned') order by cycle_number)
    into cycles from public.rehab_plan_cycles where plan_id=source.id and workspace_id=p_workspace_id;
  return public.save_rehab_cycle_plan(p_workspace_id,p_target_patient_id,null,source.title,p_start_date,null,source.goal,source.notes,cycles);
end;
$$;
revoke all on function public.copy_rehab_cycle_plan(uuid,uuid,uuid,uuid,date) from public,anon;
grant execute on function public.copy_rehab_cycle_plan(uuid,uuid,uuid,uuid,date) to authenticated;

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
  where id = p_plan_id and patient_id = p_patient_id and workspace_id = p_workspace_id and format = 'daily'
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

create or replace function public.rehab_transfer_player(
  p_patient_id uuid, p_from_workspace_id uuid, p_to_workspace_id uuid, p_confirm boolean
) returns void language plpgsql security definer set search_path = public as $$
declare current_player public.rehab_patients%rowtype;
begin
  if auth.uid() is null or not coalesce(public.is_admin(), false) then
    raise exception 'Only the main admin may transfer a player';
  end if;
  if p_confirm is distinct from true or p_from_workspace_id = p_to_workspace_id then
    raise exception 'Explicit transfer confirmation and two different clubs are required';
  end if;
  select * into current_player from public.rehab_patients where id = p_patient_id for update;
  if not found or current_player.record_type <> 'player' or current_player.workspace_id <> p_from_workspace_id then
    raise exception 'Player not found in the expected club; refresh and try again';
  end if;
  if not exists (select 1 from public.rehab_workspaces where id = p_from_workspace_id and kind = 'club')
    or not exists (select 1 from public.rehab_workspaces where id = p_to_workspace_id and kind = 'club') then
    raise exception 'Only club-to-club transfers are allowed';
  end if;

  set constraints rehab_daily_entries_patient_id_workspace_id_fkey,
    rehab_plans_patient_id_workspace_id_fkey, rehab_plan_days_plan_id_workspace_id_fkey, rehab_cycles_plan_workspace_fkey,
    rehab_appointments_patient_id_workspace_id_fkey, rehab_workspace_members_patient_workspace_fkey deferred;
  update public.rehab_patients set workspace_id = p_to_workspace_id where id = p_patient_id;
  update public.rehab_daily_entries set workspace_id = p_to_workspace_id where patient_id = p_patient_id;
  update public.rehab_plan_days set workspace_id = p_to_workspace_id
    where plan_id in (select id from public.rehab_plans where patient_id = p_patient_id);
  update public.rehab_plan_cycles set workspace_id = p_to_workspace_id
    where plan_id in (select id from public.rehab_plans where patient_id = p_patient_id);
  update public.rehab_plans set workspace_id = p_to_workspace_id where patient_id = p_patient_id;
  update public.rehab_appointments set workspace_id = p_to_workspace_id where patient_id = p_patient_id;
  update public.rehab_workspace_members set workspace_id = p_to_workspace_id
    where patient_id = p_patient_id and role = 'player';
  insert into public.rehab_player_transfers (patient_id, from_workspace_id, to_workspace_id, transferred_by)
    values (p_patient_id, p_from_workspace_id, p_to_workspace_id, auth.uid());
  set constraints rehab_daily_entries_patient_id_workspace_id_fkey,
    rehab_plans_patient_id_workspace_id_fkey, rehab_plan_days_plan_id_workspace_id_fkey, rehab_cycles_plan_workspace_fkey,
    rehab_appointments_patient_id_workspace_id_fkey, rehab_workspace_members_patient_workspace_fkey immediate;
end;
$$;
revoke all on function public.rehab_transfer_player(uuid,uuid,uuid,boolean) from public, anon;
grant execute on function public.rehab_transfer_player(uuid,uuid,uuid,boolean) to authenticated;


commit;
