-- Public read access for published promos.
--
-- The /p/[token] page is meant to be viewed by anyone with the link — no login —
-- but the only existing policies on promos/promo_assets/assets/storage.objects require
-- is_org_member(org_id), so anonymous visitors were silently getting "Not found" on
-- every published promo. These policies are additive (permissive policies combine with
-- OR), scoped strictly to status = 'published' — the exact trust boundary the
-- public_token/publish flow already implies.

create policy promos_public_read on promos for select
  using (status = 'published');

create policy promo_assets_public_read on promo_assets for select
  using (exists (select 1 from promos p where p.id = promo_id and p.status = 'published'));

create policy assets_public_read on assets for select
  using (exists (
    select 1 from promo_assets pa join promos p on p.id = pa.promo_id
    where pa.asset_id = assets.id and p.status = 'published'
  ));

-- storage: allow reading (and signing URLs for) objects that belong to an asset
-- attached to a published promo, regardless of which org's folder it lives in
create policy "assets read published promo" on storage.objects for select
  using (
    bucket_id = 'promo-assets' and exists (
      select 1 from assets a
      join promo_assets pa on pa.asset_id = a.id
      join promos p on p.id = pa.promo_id
      where (a.storage_path = storage.objects.name or a.thumb_path = storage.objects.name)
        and p.status = 'published'
    )
  );
