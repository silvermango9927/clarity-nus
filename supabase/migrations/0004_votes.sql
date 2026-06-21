-- 0004_votes.sql
-- One row per (clarity, user). The composite primary key enforces
-- one vote per person per clarity.
create table public.votes (
  clarity_id  uuid        not null references public.clarities(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  vote        smallint    not null check (vote in (-1, 1)),
  created_at  timestamptz not null default now(),
  primary key (clarity_id, user_id)
);

alter table public.votes enable row level security;
-- No policies → server-only access via the secret key, same as clarities.