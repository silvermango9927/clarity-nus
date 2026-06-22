-- 0005_search.sql
-- Full-text search over clarities.
--
-- `search_vector` is a GENERATED column: Postgres recomputes it automatically
-- on every insert/update from title + body + module_code, so we never have to
-- keep it in sync ourselves. Existing rows are backfilled when this runs.
--
-- The two-argument form to_tsvector('english', ...) is IMMUTABLE, which is
-- required for a generated column (the one-argument form is not).
alter table public.clarities
  add column search_vector tsvector
  generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' ||
      coalesce(body, '') || ' ' ||
      coalesce(module_code, '')
    )
  ) stored;

-- GIN is the right index type for tsvector @@ tsquery lookups.
create index clarities_search_idx
  on public.clarities using gin (search_vector);