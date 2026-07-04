-- Prospects: add phone (email already existed from 0001_init.sql)
alter table prospects add column if not exists phone text;
