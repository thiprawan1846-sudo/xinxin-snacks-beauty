-- ──────────────────────────────────────────────────────────────
-- Supabase initialization for XinXin Snacks & Beauty
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Safe to re-run; uses IF NOT EXISTS / OR REPLACE.
-- ──────────────────────────────────────────────────────────────

-- 1. Storage bucket for product images (public read, auth write)
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- 2. RLS policies for the products bucket
--    - Public can read (anonymous GET)
--    - Authenticated users can upload/update/delete their own files
--    - Admins (service role) bypass RLS automatically

-- Public read access
create policy "products_public_read"
  on storage.objects for select
  using (bucket_id = 'products');

-- Authenticated insert
create policy "products_auth_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products');

-- Authenticated update (owner only)
create policy "products_owner_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products' and owner = auth.uid());

-- Authenticated delete (owner only)
create policy "products_owner_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products' and owner = auth.uid());

-- 3. (Optional) Enable RLS on the bucket
alter table storage.objects enable row level security;

-- ──────────────────────────────────────────────────────────────
-- Notes:
--   • Prisma manages the relational schema (User/Product/Order/etc.).
--     Do NOT create those tables here — run `prisma migrate` instead.
--   • This SQL only configures Storage, which Prisma cannot manage.
--   • The service role key (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS,
--     so admin uploads from the server always succeed.
-- ──────────────────────────────────────────────────────────────
