-- Atomic club-to-club transfers. Clinic records can never be transferred.
begin;

alter table public.rehab_daily_entries alter constraint rehab_daily_entries_patient_id_workspace_id_fkey deferrable initially immediate;
alter table public.rehab_plans alter constraint rehab_plans_patient_id_workspace_id_fkey deferrable initially immediate;
alter table public.rehab_plan_days alter constraint rehab_plan_days_plan_id_workspace_id_fkey deferrable initially immediate;
alter table public.rehab_appointments alter constraint rehab_appointments_patient_id_workspace_id_fkey deferrable initially immediate;
alter table public.rehab_workspace_members alter constraint rehab_workspace_members_patient_workspace_fkey deferrable initially immediate;

create table public.rehab_player_transfers (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.rehab_patients(id) on delete cascade,
  from_workspace_id uuid not null,
  to_workspace_id uuid not null,
  transferred_by uuid not null references public.profiles(id),
  transferred_at timestamptz not null default now()
);
alter table public.rehab_player_transfers enable row level security;
create policy rehab_transfers_admin_read on public.rehab_player_transfers
  for select to authenticated using (public.is_admin());
grant select on public.rehab_player_transfers to authenticated;

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
    rehab_plans_patient_id_workspace_id_fkey, rehab_plan_days_plan_id_workspace_id_fkey,
    rehab_appointments_patient_id_workspace_id_fkey, rehab_workspace_members_patient_workspace_fkey deferred;
  update public.rehab_patients set workspace_id = p_to_workspace_id where id = p_patient_id;
  update public.rehab_daily_entries set workspace_id = p_to_workspace_id where patient_id = p_patient_id;
  update public.rehab_plan_days set workspace_id = p_to_workspace_id
    where plan_id in (select id from public.rehab_plans where patient_id = p_patient_id);
  update public.rehab_plans set workspace_id = p_to_workspace_id where patient_id = p_patient_id;
  update public.rehab_appointments set workspace_id = p_to_workspace_id where patient_id = p_patient_id;
  update public.rehab_workspace_members set workspace_id = p_to_workspace_id
    where patient_id = p_patient_id and role = 'player';
  insert into public.rehab_player_transfers (patient_id, from_workspace_id, to_workspace_id, transferred_by)
    values (p_patient_id, p_from_workspace_id, p_to_workspace_id, auth.uid());
  set constraints rehab_daily_entries_patient_id_workspace_id_fkey,
    rehab_plans_patient_id_workspace_id_fkey, rehab_plan_days_plan_id_workspace_id_fkey,
    rehab_appointments_patient_id_workspace_id_fkey, rehab_workspace_members_patient_workspace_fkey immediate;
end;
$$;
revoke all on function public.rehab_transfer_player(uuid,uuid,uuid,boolean) from public, anon;
grant execute on function public.rehab_transfer_player(uuid,uuid,uuid,boolean) to authenticated;

-- Photos retain their object names after transfer. Authorize against the current
-- card and entry, NOT the historical workspace prefix. No files become public.
create or replace function public.rehab_image_access(object_name text, edit_access boolean default false)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare parts text[]; target_patient public.rehab_patients%rowtype; paths text[];
begin
  if auth.uid() is null then return false; end if;
  parts := string_to_array(object_name, '/');
  if array_length(parts, 1) <> 4 or parts[1] !~* '^[0-9a-f-]{36}$'
     or parts[2] !~* '^[0-9a-f-]{36}$' or parts[3] !~* '^[0-9a-f-]{36}$' then return false; end if;
  select * into target_patient from public.rehab_patients where id = parts[2]::uuid;
  if not found then return false; end if;
  select image_paths into paths from public.rehab_daily_entries
    where id = parts[3]::uuid and patient_id = target_patient.id and workspace_id = target_patient.workspace_id;
  if not found then return false; end if;
  if edit_access then return coalesce(public.rehab_can_edit_workspace(target_patient.workspace_id), false); end if;
  return object_name = any(paths) and coalesce(public.rehab_can_access_patient(target_patient.workspace_id, target_patient.id), false);
exception when invalid_text_representation then return false;
end;
$$;
revoke all on function public.rehab_image_access(text,boolean) from public, anon;
grant execute on function public.rehab_image_access(text,boolean) to authenticated;

drop policy if exists rehab_entry_images_select on storage.objects;
create policy rehab_entry_images_select on storage.objects for select to authenticated
  using (bucket_id = 'rehab-entry-images' and (public.rehab_image_access(name, false) or public.rehab_image_access(name, true)));
drop policy if exists rehab_entry_images_insert on storage.objects;
create policy rehab_entry_images_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'rehab-entry-images' and public.rehab_image_access(name, true));
drop policy if exists rehab_entry_images_update on storage.objects;
create policy rehab_entry_images_update on storage.objects for update to authenticated
  using (bucket_id = 'rehab-entry-images' and public.rehab_image_access(name, true))
  with check (bucket_id = 'rehab-entry-images' and public.rehab_image_access(name, true));
drop policy if exists rehab_entry_images_delete on storage.objects;
create policy rehab_entry_images_delete on storage.objects for delete to authenticated
  using (bucket_id = 'rehab-entry-images' and public.rehab_image_access(name, true));
commit;
