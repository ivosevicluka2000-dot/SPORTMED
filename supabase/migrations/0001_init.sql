-- ============================================================================
-- Sport Care Med — initial schema (Supabase)
-- Run in the Supabase SQL editor (or `supabase db push`).
-- ============================================================================

-- Helpers ====================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "citext";

-- ----------------------------------------------------------------------------
-- profiles: 1:1 with auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  phone        text,
  role         text not null default 'customer'
                check (role in ('customer','admin')),
  created_at   timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current request an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- product_categories
-- ----------------------------------------------------------------------------
create table if not exists public.product_categories (
  id           uuid primary key default uuid_generate_v4(),
  slug         text unique not null,
  title        jsonb not null default '{"sr":"","en":""}'::jsonb,
  description  jsonb not null default '{"sr":"","en":""}'::jsonb,
  image_url    text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id                uuid primary key default uuid_generate_v4(),
  slug              text unique not null,
  name              jsonb not null default '{"sr":"","en":""}'::jsonb,
  description       jsonb not null default '{"sr":"","en":""}'::jsonb,
  images            text[] not null default '{}',
  price             int not null check (price >= 0),
  compare_at_price  int check (compare_at_price is null or compare_at_price >= 0),
  category_id       uuid references public.product_categories(id) on delete set null,
  stock             int not null default 0 check (stock >= 0),
  featured          boolean not null default false,
  active            boolean not null default true,
  product_type      text not null default 'physical'
                    check (product_type in ('physical','pdf')),
  often_bought_with uuid[] not null default '{}',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists products_active_idx on public.products(active);
create index if not exists products_featured_idx on public.products(featured);
create index if not exists products_category_idx on public.products(category_id);

-- ----------------------------------------------------------------------------
-- discount_codes
-- ----------------------------------------------------------------------------
create table if not exists public.discount_codes (
  id                uuid primary key default uuid_generate_v4(),
  code              text unique not null
                    check (code = upper(code) and code ~ '^[A-Z0-9_-]+$'),
  discount_type     text not null check (discount_type in ('percent','fixed')),
  value             numeric not null check (value > 0),
  valid_from        timestamptz,
  valid_until       timestamptz,
  max_uses          int check (max_uses is null or max_uses >= 1),
  used_count        int not null default 0,
  min_order_amount  int check (min_order_amount is null or min_order_amount >= 0),
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- orders
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id                  uuid primary key default uuid_generate_v4(),
  order_number        text unique not null,
  user_id             uuid references auth.users(id) on delete set null,
  customer            jsonb not null,            -- {name,email,phone,address,city,postal_code}
  items               jsonb not null,            -- [{product_id,product_name,quantity,price}]
  subtotal            int not null,
  discount_code       text,
  discount_amount     int not null default 0,
  shipping_cost       int not null default 0,
  total_amount        int not null,
  payment_method      text not null check (payment_method in ('card','cod')),
  status              text not null default 'pending'
                      check (status in ('pending','awaiting_payment','confirmed',
                                        'paid','processing','shipped',
                                        'delivered','cancelled','failed')),
  raiaccept_order_id  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_email_idx on public.orders((lower(customer->>'email')));
create index if not exists orders_created_idx on public.orders(created_at desc);

-- ----------------------------------------------------------------------------
-- blog
-- ----------------------------------------------------------------------------
create table if not exists public.blog_authors (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  role        text,
  image_url   text,
  bio         jsonb not null default '{"sr":"","en":""}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.blog_categories (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null,
  title       text not null,
  language    text not null check (language in ('sr','en')),
  unique (slug, language)
);

create table if not exists public.blog_posts (
  id                  uuid primary key default uuid_generate_v4(),
  translation_group   uuid not null default uuid_generate_v4(),
  slug                text not null,
  language            text not null check (language in ('sr','en')),
  title               text not null,
  excerpt             text not null,
  body_markdown       text not null default '',
  main_image_url      text,
  author_id           uuid references public.blog_authors(id) on delete set null,
  category_ids        uuid[] not null default '{}',
  related_post_ids    uuid[] not null default '{}',
  reading_time        int not null default 1 check (reading_time >= 1),
  published_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (slug, language)
);

create index if not exists blog_posts_lang_pub_idx
  on public.blog_posts(language, published_at desc);
create index if not exists blog_posts_group_idx
  on public.blog_posts(translation_group);

-- ----------------------------------------------------------------------------
-- leads + newsletter
-- ----------------------------------------------------------------------------
create table if not exists public.leads (
  id           uuid primary key default uuid_generate_v4(),
  source       text not null check (source in ('contact','b2b','popup','exit_intent')),
  name         text,
  email        text,
  phone        text,
  message      text,
  metadata     jsonb not null default '{}'::jsonb,
  status       text not null default 'new' check (status in ('new','contacted','closed')),
  notes        text,
  created_at   timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id           uuid primary key default uuid_generate_v4(),
  email        citext unique not null,
  unsubscribed boolean not null default false,
  source       text,
  created_at   timestamptz not null default now()
);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists tg_products_updated on public.products;
create trigger tg_products_updated before update on public.products
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_orders_updated on public.orders;
create trigger tg_orders_updated before update on public.orders
  for each row execute function public.tg_set_updated_at();

drop trigger if exists tg_blog_posts_updated on public.blog_posts;
create trigger tg_blog_posts_updated before update on public.blog_posts
  for each row execute function public.tg_set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles               enable row level security;
alter table public.product_categories     enable row level security;
alter table public.products               enable row level security;
alter table public.discount_codes         enable row level security;
alter table public.orders                 enable row level security;
alter table public.blog_authors           enable row level security;
alter table public.blog_categories        enable row level security;
alter table public.blog_posts             enable row level security;
alter table public.leads                  enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- profiles: user reads/updates own row; admins read all
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- products + categories: public read of active; admin write
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products
  for select using (active = true or public.is_admin());
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists product_categories_public_read on public.product_categories;
create policy product_categories_public_read on public.product_categories
  for select using (true);
drop policy if exists product_categories_admin_write on public.product_categories;
create policy product_categories_admin_write on public.product_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- discount_codes: anonymous can NOT read directly (use validate_discount RPC).
-- Admin: full access.
drop policy if exists discount_codes_admin_all on public.discount_codes;
create policy discount_codes_admin_all on public.discount_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- orders: user sees own; admin sees all. Inserts only via service-role.
drop policy if exists orders_owner_read on public.orders;
create policy orders_owner_read on public.orders
  for select using (
    (user_id is not null and user_id = auth.uid())
    or public.is_admin()
  );
drop policy if exists orders_admin_write on public.orders;
create policy orders_admin_write on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- blog: public read of published; admin write.
drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read on public.blog_posts
  for select using (
    (published_at is not null and published_at <= now())
    or public.is_admin()
  );
drop policy if exists blog_posts_admin_write on public.blog_posts;
create policy blog_posts_admin_write on public.blog_posts
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists blog_authors_public_read on public.blog_authors;
create policy blog_authors_public_read on public.blog_authors
  for select using (true);
drop policy if exists blog_authors_admin_write on public.blog_authors;
create policy blog_authors_admin_write on public.blog_authors
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists blog_categories_public_read on public.blog_categories;
create policy blog_categories_public_read on public.blog_categories
  for select using (true);
drop policy if exists blog_categories_admin_write on public.blog_categories;
create policy blog_categories_admin_write on public.blog_categories
  for all using (public.is_admin()) with check (public.is_admin());

-- leads + newsletter: admin only (inserts come via service-role from API routes).
drop policy if exists leads_admin_all on public.leads;
create policy leads_admin_all on public.leads
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists newsletter_admin_all on public.newsletter_subscribers;
create policy newsletter_admin_all on public.newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- RPCs
-- ============================================================================

-- validate_discount: returns a typed JSON result, hiding sensitive fields.
create or replace function public.validate_discount(
  p_code text,
  p_subtotal int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.discount_codes%rowtype;
  amount int := 0;
  percent int := 0;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('valid', false, 'reason', 'empty');
  end if;

  select * into r from public.discount_codes
   where code = upper(trim(p_code))
   limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;
  if r.active is not true then
    return jsonb_build_object('valid', false, 'reason', 'inactive');
  end if;
  if r.valid_from is not null and r.valid_from > now() then
    return jsonb_build_object('valid', false, 'reason', 'not_yet_valid');
  end if;
  if r.valid_until is not null and r.valid_until < now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;
  if r.max_uses is not null and r.used_count >= r.max_uses then
    return jsonb_build_object('valid', false, 'reason', 'used_up');
  end if;
  if r.min_order_amount is not null and p_subtotal < r.min_order_amount then
    return jsonb_build_object('valid', false, 'reason', 'min_amount',
                              'min_order_amount', r.min_order_amount);
  end if;

  if r.discount_type = 'percent' then
    percent := r.value::int;
    amount  := floor(p_subtotal * r.value / 100.0)::int;
  else
    amount  := least(r.value::int, p_subtotal);
    percent := 0;
  end if;

  return jsonb_build_object(
    'valid', true,
    'code', r.code,
    'type', r.discount_type,
    'value', r.value,
    'percent', percent,
    'amount', amount,
    'discount_id', r.id
  );
end;
$$;

grant execute on function public.validate_discount(text, int) to anon, authenticated;

-- increment_discount_usage: atomic counter bump.
create or replace function public.increment_discount_usage(p_code text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.discount_codes
     set used_count = used_count + 1
   where code = upper(trim(p_code));
$$;
revoke all on function public.increment_discount_usage(text) from public, anon, authenticated;

-- claim_guest_orders: link a logged-in user to past guest orders by email.
create or replace function public.claim_guest_orders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  uemail text;
  affected int;
begin
  if uid is null then return 0; end if;
  select email into uemail from auth.users where id = uid;
  if uemail is null then return 0; end if;

  with upd as (
    update public.orders
       set user_id = uid
     where user_id is null
       and lower(customer->>'email') = lower(uemail)
    returning 1
  )
  select count(*)::int into affected from upd;
  return affected;
end;
$$;

grant execute on function public.claim_guest_orders() to authenticated;

-- ============================================================================
-- Storage buckets — run separately (Supabase storage doesn't accept SQL CREATE BUCKET)
-- In Supabase dashboard → Storage create:
--   product-images   (public)
--   blog-images      (public)
--   blog-covers      (public)
-- Then add this RLS policy on storage.objects:
-- ============================================================================

drop policy if exists storage_admin_write on storage.objects;
create policy storage_admin_write on storage.objects
  for all
  using (
    bucket_id in ('product-images','blog-images','blog-covers')
    and public.is_admin()
  )
  with check (
    bucket_id in ('product-images','blog-images','blog-covers')
    and public.is_admin()
  );

drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select
  using (bucket_id in ('product-images','blog-images','blog-covers'));
