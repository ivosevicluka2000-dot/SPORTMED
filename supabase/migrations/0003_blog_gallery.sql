-- ============================================================================
-- Sport Care Med — blog post gallery images
-- Adds an additional `images` column to blog_posts so admins can attach
-- multiple photos beyond the single `main_image_url` cover.
-- ============================================================================

alter table public.blog_posts
  add column if not exists images text[] not null default '{}';
