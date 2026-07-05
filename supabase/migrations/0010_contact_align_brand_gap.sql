-- Independent left/center/right alignment for the contact row, and an
-- adjustable gap specifically between the brand mark (logo/title) and
-- whatever comes after it in the text zone.
alter table promos add column if not exists contact_align text default 'left'; -- left | center | right
alter table promos add column if not exists brand_gap    text default 'md';   -- sm | md | lg | xl
