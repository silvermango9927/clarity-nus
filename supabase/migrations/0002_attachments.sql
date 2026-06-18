-- ClarityNUS attachments (F: PDFs + images on a clarity)
-- Run this in the Supabase SQL editor after 0001.

-- 1. Attachment rows, one per uploaded file, owned by a clarity.
create table if not exists public.clarity_attachments (
  id uuid primary key default gen_random_uuid(),
  clarity_id uuid not null references public.clarities (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  content_type text not null,
  size_bytes bigint not null,
  kind text not null check (kind in ('image', 'pdf')),
  created_at timestamptz not null default now()
);

create index if not exists clarity_attachments_clarity_id_idx
  on public.clarity_attachments (clarity_id);

-- Locked down like clarities: only the server (secret key, bypasses RLS)
-- reads or writes. When auth lands we add policies.
alter table public.clarity_attachments enable row level security;

-- 2. Public-read storage bucket for the files themselves.
-- Uploads go through the server (service role, bypasses storage RLS);
-- reads are public via /storage/v1/object/public/clarity-attachments/<path>.
insert into storage.buckets (id, name, public)
values ('clarity-attachments', 'clarity-attachments', true)
on conflict (id) do nothing;
