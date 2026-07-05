-- Left/center/right position for the brand mark (logo or title text) within
-- the text zone, independent of the main image's anchor.
alter table promos add column if not exists brand_align text default 'left'; -- left | center | right
