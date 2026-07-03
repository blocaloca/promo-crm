-- Storage buckets + policies
-- promo-assets: PRIVATE (source images + thumbs, served via signed URLs)
-- promo-public: PUBLIC (published promo OG images / PDFs, if you later store rendered files)

insert into storage.buckets (id, name, public) values ('promo-assets', 'promo-assets', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('promo-public', 'promo-public', true)
  on conflict (id) do nothing;

-- promo-assets: only org members can read/write objects under their org's folder.
-- Objects are stored as {org_id}/{uuid}.jpg — first path segment is the org id.
create policy "assets read own org" on storage.objects for select
  using (bucket_id = 'promo-assets' and is_org_member((storage.foldername(name))[1]::uuid));
create policy "assets write own org" on storage.objects for insert
  with check (bucket_id = 'promo-assets' and is_org_member((storage.foldername(name))[1]::uuid));
create policy "assets update own org" on storage.objects for update
  using (bucket_id = 'promo-assets' and is_org_member((storage.foldername(name))[1]::uuid));
create policy "assets delete own org" on storage.objects for delete
  using (bucket_id = 'promo-assets' and is_org_member((storage.foldername(name))[1]::uuid));

-- promo-public: world-readable (it's the public bucket); writes restricted to members
create policy "public read" on storage.objects for select
  using (bucket_id = 'promo-public');
create policy "public write own org" on storage.objects for insert
  with check (bucket_id = 'promo-public' and is_org_member((storage.foldername(name))[1]::uuid));
