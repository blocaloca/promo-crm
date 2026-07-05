-- Adaptive promo template: one layout driven by text placement, a 3x3 image
-- anchor (no-crop, object-contain), and a logo-or-title brand mark. The brand
-- mark has no manual mode toggle — a logo, if set, always wins; brand_title
-- is just the fallback text shown when no logo is chosen.
alter table promos add column if not exists text_placement text default 'bottom';   -- bottom | right | left | top
alter table promos add column if not exists image_anchor  text default 'center center'; -- e.g. 'left top', 'right bottom'
alter table promos add column if not exists brand_title   text;
alter table promos add column if not exists logo_asset_id uuid references assets(id) on delete set null;

-- the logo is referenced directly via logo_asset_id, not through promo_assets,
-- so the existing public-read policies (0004) don't cover it — add matching ones
create policy assets_public_read_logo on assets for select
  using (exists (select 1 from promos p where p.logo_asset_id = assets.id and p.status = 'published'));

create policy "logo read published promo" on storage.objects for select
  using (
    bucket_id = 'promo-assets' and exists (
      select 1 from assets a
      join promos p on p.logo_asset_id = a.id
      where (a.storage_path = storage.objects.name or a.thumb_path = storage.objects.name)
        and p.status = 'published'
    )
  );
