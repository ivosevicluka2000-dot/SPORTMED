-- ============================================================================
-- Sport Care Med — storage buckets
-- Idempotent: creates the public buckets used by the admin uploaders.
-- The RLS policies on storage.objects are defined in 0001_init.sql.
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('blog-images',    'blog-images',    true),
  ('blog-covers',    'blog-covers',    true)
on conflict (id) do update set public = excluded.public;
