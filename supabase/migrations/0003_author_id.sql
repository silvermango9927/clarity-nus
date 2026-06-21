-- 0003_author_id.sql
-- Add author tracking to clarities.

-- Add the column. Nullable + "on delete set null" so nothing ever breaks,
-- even if a user is later deleted.
alter table public.clarities
  add column author_id uuid references auth.users(id) on delete set null;

-- Clear out the old authorless test clarities.
-- They were created before auth existed and have no real owner.
delete from public.clarities where author_id is null;