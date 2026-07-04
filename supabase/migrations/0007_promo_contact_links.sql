-- Replace the single CTA link+label with a contact row: one phone number and
-- up to two links (portfolio, IG, LinkedIn, etc). Each renders exactly what's
-- typed as the visible text — cta_text (this session's earlier design) is no
-- longer needed now that the label and the typed value are the same thing.
alter table promos rename column link_url to link_url_1;
alter table promos add column if not exists link_url_2 text;
alter table promos add column if not exists contact_phone text;
alter table promos drop column if exists cta_text;
