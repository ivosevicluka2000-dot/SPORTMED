-- The clinic uses a fixed application asset. Only clubs store uploaded logos.
alter table public.rehab_workspaces add column logo_path text;
alter table public.rehab_workspaces add constraint rehab_club_logo_path check (
  logo_path is null or (
    kind = 'club' and
    logo_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.png$')
  )
);

-- Public brand assets only: clinical files stay in their existing private bucket.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('rehab-club-logos', 'rehab-club-logos', true, 4194304, array['image/png']);

create policy rehab_club_logos_admin_insert on storage.objects
for insert to authenticated with check (
  bucket_id = 'rehab-club-logos' and public.is_admin() and exists (
    select 1 from public.rehab_workspaces w
    where w.kind = 'club' and (storage.foldername(storage.objects.name))[1] = w.id::text
  )
);
create policy rehab_club_logos_admin_select on storage.objects
for select to authenticated using (bucket_id = 'rehab-club-logos' and public.is_admin());
create policy rehab_club_logos_admin_delete on storage.objects
for delete to authenticated using (bucket_id = 'rehab-club-logos' and public.is_admin());
