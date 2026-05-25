# ClarityNUS POC — Design Spec

**Date:** 2026-05-25
**Status:** Approved (ready for implementation plan)
**Scope:** Technical proof of concept — anonymous CRUD on "clarities," persisted in Supabase, surfaced through a minimal Next.js UI.

## 1. Goal

Ship the smallest possible end-to-end slice of ClarityNUS: a user can create, list, filter, edit, and delete clarities, with state consistent across the frontend, backend, and database. No auth, no markdown, no votes, no tags, no profiles — those land in later milestones.

This spec corresponds to a subset of Milestone 1 from the Orbital proposal (the form + feed + filter pieces), explicitly deferring authentication.

## 2. Non-goals

The following are explicitly **out of scope** for this POC:

- Authentication, sign-up, login, profiles
- Markdown rendering, KaTeX, syntax highlighting
- Image uploads
- Voting and ranking
- Topic tags (only `module_code` is supported)
- Full-text search
- Pagination
- Bookmarks, study collections
- Remix / fork
- Trending dashboard, email digest
- Dark mode, responsive polish, custom design system
- Automated tests (manual verification only for this POC)

Anything not listed in Section 5 should not be built.

## 3. Data model

Single table `clarities` in the project's Supabase Postgres database.

| Column        | Type                              | Notes                                                    |
|---------------|-----------------------------------|----------------------------------------------------------|
| `id`          | `uuid primary key`                | `default gen_random_uuid()`                              |
| `title`       | `text not null`                   | required, trimmed, non-empty                             |
| `body`        | `text not null`                   | required, trimmed, non-empty, plain text                 |
| `module_code` | `text not null`                   | required, normalized to upper-case on write              |
| `created_at`  | `timestamptz not null default now()` |                                                       |
| `updated_at`  | `timestamptz not null default now()` | set explicitly by `updateClarity`                     |

**Indexes:**
- `clarities_created_at_idx` on `created_at desc` — supports the recency-sorted feed.
- `clarities_module_code_lower_idx` on `lower(module_code)` — supports the case-insensitive module filter.

**Row Level Security:**
RLS is **enabled with no policies**. This locks out the `anon` and `authenticated` Postgres roles entirely. All access in this POC goes through the server using the service role key, which bypasses RLS. When auth is added in a later milestone, we will add an `author_id uuid references auth.users` column and write explicit RLS policies.

**Migration file:** `supabase/migrations/0001_clarities.sql` — to be run manually in the Supabase SQL editor.

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Server-rendered pages (RSC)                         │   │
│  │  /  ·  /clarities/new  ·  /clarities/[id]/edit       │   │
│  │  Forms submit via <form action={serverAction}>       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼  (Next.js server)
┌─────────────────────────────────────────────────────────────┐
│  app/actions.ts                                             │
│  - createClarityAction / updateClarityAction /              │
│    deleteClarityAction                                      │
│  - Parse FormData, validate, call data layer,               │
│    revalidatePath('/'), redirect                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  app/lib/clarities.ts (data layer)                          │
│  - listClarities({ module? })                               │
│  - getClarity(id)                                           │
│  - createClarity(input) / updateClarity(id, input) /        │
│    deleteClarity(id)                                        │
│  - validateClarityInput(input)                              │
│  - Clarity, ClarityInput types                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  app/lib/supabase-server.ts                                 │
│  - Server-only Supabase client using                        │
│    SUPABASE_SERVICE_ROLE_KEY                                │
│  - Never imported from a client component                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Postgres — clarities table                        │
└─────────────────────────────────────────────────────────────┘
```

The existing `app/lib/supabase.ts` (browser-side client using the publishable key) is left in place but unused in this POC. It stays for future client-side reads after auth lands.

## 5. Deliverables

### 5.1 Database
1. `supabase/migrations/0001_clarities.sql` — DDL for the `clarities` table, indexes, and `alter table … enable row level security;`.

### 5.2 Environment
2. `.env.local.example` — template listing `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the new `SUPABASE_SERVICE_ROLE_KEY`. The user populates `.env.local` from this.

### 5.3 Server / backend code
3. `app/lib/supabase-server.ts` — exports a singleton Supabase client constructed from server-only env vars. Guarded with a runtime check that `SUPABASE_SERVICE_ROLE_KEY` is set.
4. `app/lib/clarities.ts` — data layer functions and types. Pure data access; no Next.js imports.
5. `app/actions.ts` — `'use server'` directives, the three mutating server actions. Each calls `revalidatePath('/')`; create + update also `redirect('/')` on success.

### 5.4 Frontend code
6. `app/page.tsx` — replaces the placeholder. Reads `searchParams.module`, calls `listClarities`, renders:
   - Header with title link to `/` and a "New clarity" link to `/clarities/new`.
   - A `<form method="get">` containing a `module` text input and a Submit button (and a "Clear" link to `/`).
   - The list of clarities (title, module, body excerpt, created date) with per-item Edit link and Delete `<form>`.
   - An empty state when no clarities match.
7. `app/clarities/new/page.tsx` — server component rendering the create form (title, module, body) bound to `createClarityAction`.
8. `app/clarities/[id]/edit/page.tsx` — server component that fetches the clarity by id (`notFound()` if missing) and renders the form pre-filled, bound to `updateClarityAction`.
9. `app/layout.tsx` — fix the placeholder `metadata` ("Create Next App" → "ClarityNUS") and update the body wrapper styles if needed for the nav layout.

### 5.5 Optional shared form component
10. If the create and edit forms share enough structure, extract a `<ClarityForm>` server-or-client component. Decide during implementation — if duplication is small (under ~30 lines), skip the extraction.

## 6. Validation and error handling

- `validateClarityInput({ title, body, module_code })` trims all three, requires each to be non-empty after trim, and upper-cases `module_code`. Returns `{ ok: true, value }` or `{ ok: false, error: string }`.
- Server actions accept `(prevState, formData)` signatures compatible with React 19's `useActionState`. On validation failure they return `{ error: string }`; on success they `revalidatePath('/')` and either `redirect('/')` (create/update) or return `{ ok: true }` (delete).
- The create and edit form components are marked `'use client'` (because they use `useActionState` to surface the error string above the submit button). They are the only client components in the POC. The Delete button in the feed is a tiny `<form action={deleteClarityAction}>` with a hidden `id` input — server-side, no `useActionState` needed.
- Edit page calls `notFound()` if the id does not resolve to a row.
- Other failure modes (network, DB) bubble up as 500s — acceptable for a POC.

## 7. Module filter behavior

- The feed reads `searchParams.module` (a string, optional).
- When present and non-empty (trimmed), the data layer applies `ilike '%' || $value || '%'` on `module_code`. Case-insensitive substring match.
- When absent or empty, no filter is applied — all clarities are returned, newest first.
- The filter input is a single text field with a submit button. No autocomplete, no chips, no debounce.

## 8. Env vars

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...     # existing, used by app/lib/supabase.ts
SUPABASE_SERVICE_ROLE_KEY=...                # NEW, server-only, used by app/lib/supabase-server.ts
```

`SUPABASE_SERVICE_ROLE_KEY` MUST NOT be prefixed with `NEXT_PUBLIC_`. `app/lib/supabase-server.ts` MUST NOT be imported from any client component.

## 9. Acceptance criteria

The POC is "done" when, with a fresh `.env.local` and the migration applied, a user can:

1. Visit `/`, see an empty state and a "New clarity" link.
2. Visit `/clarities/new`, submit a valid clarity, land back on `/` and see it at the top of the list.
3. Submit an invalid form (empty field) on `/clarities/new` and see an inline error without a row being created.
4. Click "Edit" on a listed clarity, modify the title, submit, and see the change reflected on `/`.
5. Click "Delete" on a clarity, confirm via the form submission, and see it disappear from `/`.
6. Filter the feed by entering a module code (full or partial, any case), see only matching clarities, and clear the filter to see all again.
7. Verify in Supabase that the table reflects exactly what the UI shows after each action — no orphan rows, no stale UI.

## 10. Implementation notes (for the planning phase)

- Project uses **Next.js 16.2.6 with Turbopack** and **React 19**. Per `AGENTS.md`, this version has breaking changes from training data — **consult `node_modules/next/dist/docs/` before implementing each Next-specific API** (server actions signatures, `cookies()` async vs sync, dynamic params shape, `searchParams` typing, `notFound()`, `redirect()`, `revalidatePath()`).
- The implementation plan should split work along the **frontend / backend** seam so the two halves can be built in parallel by separate subagents:
  - **Backend track:** migration SQL, env template, `supabase-server.ts`, `clarities.ts` data layer, `actions.ts` server actions.
  - **Frontend track:** the three route pages, layout/nav tweaks, optional shared form component.
  - The shared contract is the exported types and server-action signatures in `app/lib/clarities.ts` and `app/actions.ts` — define these first, then both tracks can proceed independently.
- After both tracks land, a single integration pass: wire forms to actions, run the dev server, walk the acceptance criteria, fix anything broken.
