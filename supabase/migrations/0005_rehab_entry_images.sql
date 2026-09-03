-- Private progress photos attached to rehabilitation daily entries.

alter table public.rehab_daily_entries
  add column if not exists image_paths text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'rehab-entry-images',
  'rehab-entry-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists rehab_entry_images_select on storage.objects;
create policy rehab_entry_images_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'rehab-entry-images'
    and public.rehab_can_access_workspace(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists rehab_entry_images_insert on storage.objects;
create policy rehab_entry_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'rehab-entry-images'
    and public.rehab_can_edit_workspace(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists rehab_entry_images_update on storage.objects;
create policy rehab_entry_images_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'rehab-entry-images'
    and public.rehab_can_edit_workspace(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'rehab-entry-images'
    and public.rehab_can_edit_workspace(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists rehab_entry_images_delete on storage.objects;
create policy rehab_entry_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'rehab-entry-images'
    and public.rehab_can_edit_workspace(((storage.foldername(name))[1])::uuid)
  );
