alter table public.organizations
  add column if not exists siret_number text;

create unique index if not exists organizations_owner_user_id_key
on public.organizations(owner_user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "organizations_insert_owner" on public.organizations;
create policy "organizations_insert_owner"
on public.organizations
for insert
with check (owner_user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'organization-assets',
  'organization-assets',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

drop policy if exists "organization_assets_read" on storage.objects;
create policy "organization_assets_read"
on storage.objects
for select
to authenticated
using (bucket_id = 'organization-assets');

drop policy if exists "organization_assets_insert_own" on storage.objects;
create policy "organization_assets_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'organization-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "organization_assets_update_own" on storage.objects;
create policy "organization_assets_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'organization-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'organization-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "organization_assets_delete_own" on storage.objects;
create policy "organization_assets_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'organization-assets'
  and (storage.foldername(name))[1] = auth.uid()::text
);
