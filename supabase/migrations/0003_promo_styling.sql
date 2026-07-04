-- Per-promo styling controls: font, size, image sizing, justify, padding.
-- aspect_ratio already existed as free text (no fixed enum), so it needs no migration —
-- the builder now accepts custom "W:H" values in addition to the preset chips.

alter table promos
  add column if not exists font_family  text not null default 'hanken',
  add column if not exists font_size    text not null default 'md',
  add column if not exists image_size   text not null default 'half',
  add column if not exists justify_x    text not null default 'left',
  add column if not exists justify_y    text not null default 'top',
  add column if not exists padding      text not null default 'md',
  add column if not exists line_height  text not null default 'normal';
