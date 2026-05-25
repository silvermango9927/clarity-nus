-- ClarityNUS POC schema
-- Run this in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.clarities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  module_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clarities_created_at_idx
  on public.clarities (created_at desc);

create index if not exists clarities_module_code_lower_idx
  on public.clarities (lower(module_code));

-- Lock the table down. Only the server (using the secret key, which
-- bypasses RLS) can read or write. When auth lands we will add an
-- author_id column and policies.
alter table public.clarities enable row level security;
