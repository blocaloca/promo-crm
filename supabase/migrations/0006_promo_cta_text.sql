-- CTA link label, separate from the URL — the public card should show the
-- text the user typed (e.g. "Book a shoot"), never the raw link_url.
alter table promos add column if not exists cta_text text;
