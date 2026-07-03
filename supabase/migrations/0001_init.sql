-- =====================================================================
-- Promo CRM — v1 schema
-- Six objects: assets · promos · messages · prospects · interactions · lists
-- Tenancy (org_id) + RLS on every table. Solo today, multi-tenant-ready.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ORGS + MEMBERSHIP
-- ---------------------------------------------------------------------
create table orgs (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz default now()
);

create table org_members (
  org_id   uuid references orgs(id) on delete cascade,
  user_id  uuid references auth.users(id) on delete cascade,
  role     text not null default 'owner',   -- owner | member
  primary key (org_id, user_id)
);
create index on org_members (user_id);

-- helper: is the current user a member of this org?
create or replace function is_org_member(target uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from org_members
    where org_id = target and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- shared updated_at trigger
-- ---------------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ---------------------------------------------------------------------
-- ASSETS  (media library)
-- ---------------------------------------------------------------------
create table assets (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  owner_id      uuid not null references auth.users(id),
  storage_path  text not null,
  thumb_path    text not null,
  filename      text,
  width         int,
  height        int,
  orientation   text,                       -- landscape | portrait | square
  sector        text[] default '{}',        -- {hospitality, fashion, ecomm, agency}
  shoot         text,
  south_america boolean default false,
  tags          text[] default '{}',
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index on assets (org_id);
create index on assets using gin (sector);
create trigger t_assets_touch before update on assets
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------
-- PROMOS  (visual cards)
-- ---------------------------------------------------------------------
create table promos (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references orgs(id) on delete cascade,
  owner_id       uuid not null references auth.users(id),
  name           text not null,
  template_key   text not null default 'placeholder',
  aspect_ratio   text,                       -- 1.91:1 | 1:1 | 4:5 | 9:16 | letter
  headline       text,
  body_copy      text,
  link_url       text,
  sector         text[] default '{}',
  angle          text,
  og_image_path  text,
  og_title       text,
  og_description text,
  public_token   text unique,
  pdf_path       text,
  view_count     int default 0,
  status         text default 'draft',       -- draft | published
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index on promos (org_id);
create trigger t_promos_touch before update on promos
  for each row execute function touch_updated_at();

create table promo_assets (
  promo_id   uuid references promos(id) on delete cascade,
  asset_id   uuid references assets(id) on delete restrict,
  slot       int not null,
  primary key (promo_id, asset_id, slot)
);

-- ---------------------------------------------------------------------
-- MESSAGES  (copy library)
-- ---------------------------------------------------------------------
create table messages (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references orgs(id) on delete cascade,
  owner_id     uuid not null references auth.users(id),
  label        text not null,
  body         text not null,
  msg_type     text not null,               -- intro | follow_up | industry | referral | reengage
  sector       text,
  channel_hint text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index on messages (org_id, msg_type);
create trigger t_messages_touch before update on messages
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------
-- PROSPECTS
-- ---------------------------------------------------------------------
create table prospects (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  owner_id      uuid not null references auth.users(id),
  name          text not null,
  title         text,
  company       text,
  sector        text,
  region        text,
  tier          text,                        -- A | B | C
  linkedin_url  text,
  email         text,
  instagram     text,
  state         text default 'prospect',     -- prospect | contacted | in_convo | booked | dormant
  last_touched  date,
  south_america_relevant boolean default false,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index on prospects (org_id, state);
create index on prospects (org_id, last_touched);
create trigger t_prospects_touch before update on prospects
  for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------
-- INTERACTIONS  (the join)
-- ---------------------------------------------------------------------
create table interactions (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references orgs(id) on delete cascade,
  owner_id      uuid not null references auth.users(id),
  prospect_id   uuid not null references prospects(id) on delete cascade,
  promo_id      uuid references promos(id) on delete set null,
  message_id    uuid references messages(id) on delete set null,
  channel       text not null,               -- linkedin_dm | email | ig_dm | call | other
  direction     text default 'outbound',     -- outbound | inbound
  note          text,
  occurred_at   timestamptz default now(),
  created_at    timestamptz default now()
);
create index on interactions (org_id, prospect_id, occurred_at);
create index on interactions (org_id, promo_id);
create index on interactions (org_id, channel);

-- logging an outbound interaction bumps the prospect's last_touched
create or replace function bump_last_touched()
returns trigger language plpgsql as $$
begin
  if new.direction = 'outbound' then
    update prospects
      set last_touched = greatest(coalesce(last_touched, '1900-01-01'), new.occurred_at::date)
      where id = new.prospect_id;
  end if;
  return new;
end; $$;
create trigger t_interactions_bump after insert on interactions
  for each row execute function bump_last_touched();

-- ---------------------------------------------------------------------
-- LISTS  (worklists — walked one-by-one, NOT blast lists)
-- ---------------------------------------------------------------------
create table lists (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references orgs(id) on delete cascade,
  owner_id    uuid not null references auth.users(id),
  name        text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create trigger t_lists_touch before update on lists
  for each row execute function touch_updated_at();

create table list_members (
  list_id     uuid references lists(id) on delete cascade,
  prospect_id uuid references prospects(id) on delete cascade,
  position    int,
  done        boolean default false,
  primary key (list_id, prospect_id)
);
create index on list_members (list_id, position);

-- =====================================================================
-- ROW-LEVEL SECURITY
-- Every org-scoped table: you can see/write rows only in orgs you belong to.
-- =====================================================================
alter table orgs           enable row level security;
alter table org_members    enable row level security;
alter table assets         enable row level security;
alter table promos         enable row level security;
alter table promo_assets   enable row level security;
alter table messages       enable row level security;
alter table prospects      enable row level security;
alter table interactions   enable row level security;
alter table lists          enable row level security;
alter table list_members   enable row level security;

-- orgs: visible to members
create policy orgs_select on orgs for select using (is_org_member(id));
create policy orgs_insert on orgs for insert with check (true);  -- bootstrap; membership added right after

-- org_members: you can see rows for orgs you're in; you can add yourself on bootstrap
create policy om_select on org_members for select using (user_id = auth.uid() or is_org_member(org_id));
create policy om_insert on org_members for insert with check (user_id = auth.uid());

-- generic org-scoped policy applied to the six objects + joins
create policy assets_all       on assets       for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy promos_all        on promos        for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy messages_all      on messages      for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy prospects_all     on prospects     for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy interactions_all  on interactions  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy lists_all         on lists         for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- join tables: gate through their parent
create policy promo_assets_all on promo_assets for all
  using (exists (select 1 from promos p where p.id = promo_id and is_org_member(p.org_id)))
  with check (exists (select 1 from promos p where p.id = promo_id and is_org_member(p.org_id)));

create policy list_members_all on list_members for all
  using (exists (select 1 from lists l where l.id = list_id and is_org_member(l.org_id)))
  with check (exists (select 1 from lists l where l.id = list_id and is_org_member(l.org_id)));
