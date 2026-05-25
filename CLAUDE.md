@AGENTS.md

# ClarityNUS

Web app for NUS students to share short, peer-written explanations ("clarities") of course concepts, organised by module code. Original proposal: Orbital 26 (Project Gemini), team Band4Band.

The full proposal (motivation, user stories, all milestones, full feature list) lives outside this repo. The design and plan below capture only what's actually been built so far.

## Current state — Technical POC (Milestone 1, partial)

Anonymous CRUD on a single `clarities` table. No auth, no markdown rendering, no votes, no tags, no profiles. Those land in later milestones.

- Spec: [docs/superpowers/specs/2026-05-25-claritynus-poc-design.md](docs/superpowers/specs/2026-05-25-claritynus-poc-design.md)
- Plan: [docs/superpowers/plans/2026-05-25-claritynus-poc.md](docs/superpowers/plans/2026-05-25-claritynus-poc.md)
- PR: https://github.com/silvermango9927/clarity-nus/pull/1 (branch `feat/poc-crud`)

### Routes
- `/` — server-rendered feed of clarities, sorted by recency, with a GET-based `?module=...` filter and per-row Edit / Delete controls.
- `/clarities/new` — create form.
- `/clarities/[id]/edit` — edit form. `notFound()` if the id doesn't exist.

### Data model

Single table `public.clarities`:

| column        | type                                  |
|---------------|---------------------------------------|
| `id`          | `uuid pk default gen_random_uuid()`   |
| `title`       | `text not null`                       |
| `body`        | `text not null`                       |
| `module_code` | `text not null` (stored upper-case)   |
| `created_at`  | `timestamptz not null default now()`  |
| `updated_at`  | `timestamptz not null default now()`  |

Indexes: `created_at desc`, `lower(module_code)`. RLS enabled with **no policies** — the table is locked down; only the server (using the secret key, which bypasses RLS) can read or write. When auth lands, add an `author_id uuid references auth.users` column and write explicit policies.

### Architecture

Three layers, hard server/client boundary:

```
Browser  →  Server Component pages          →  app/page.tsx, app/clarities/.../page.tsx
              + 'use client' ClarityForm       app/components/ClarityForm.tsx
              |
              ▼  <form action={serverAction}>
            Server Actions                  →  app/actions.ts
              ▼
            Data layer (server-only)        →  app/lib/clarities.ts
              ▼
            Supabase client (server-only)   →  app/lib/supabase-server.ts
              ▼
            Postgres (Supabase)
```

- **Universal module:** [app/lib/clarity-types.ts](app/lib/clarity-types.ts) — types (`Clarity`, `ClarityInput`, `ClarityActionState`), `INITIAL_CLARITY_ACTION_STATE`, and the pure `validateClarityInput` helper. Safe to import from client OR server.
- **Server-only modules:** [app/lib/clarities.ts](app/lib/clarities.ts) and [app/lib/supabase-server.ts](app/lib/supabase-server.ts). Both start with `import "server-only"`. They must NEVER be imported by a client component — the build will fail if they are.
- **Sole client component:** [app/components/ClarityForm.tsx](app/components/ClarityForm.tsx). Uses React 19 `useActionState`. Bound to the create or update server action via prop.
- **Existing browser-side Supabase client** at [app/lib/supabase.ts](app/lib/supabase.ts) is preserved but unused. Reserved for future client-side reads after auth lands.

### Env vars

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # client-safe
SUPABASE_SECRET_KEY=                    # server-only, bypasses RLS
```

`SUPABASE_SECRET_KEY` MUST NOT be prefixed with `NEXT_PUBLIC_`. If the Supabase project uses legacy key naming, this is the `service_role` key.

## Local development

```bash
npm install
# Create .env.local from .env.local.example and fill in the three values.
# Run supabase/migrations/0001_clarities.sql in the Supabase SQL editor once.
npm run dev          # http://localhost:3000
npx tsc --noEmit     # type-check the whole project
npm run build        # production build
npm run lint         # eslint
```

## Tech stack

- Next.js 16.2.6 (App Router, Turbopack) — **breaking changes from older versions; see [AGENTS.md](AGENTS.md)**
- React 19.2
- TypeScript 5 (strict)
- `@supabase/supabase-js` ^2.106
- Tailwind CSS v4 (via PostCSS plugin)
- `server-only` (dev dep) — provides the server/client guard

Key Next 16 specifics that differ from older versions: `params` and `searchParams` are now `Promise<...>` and must be `await`-ed in server components. Server actions still use `'use server'`. React 19's `useActionState` returns `[state, formAction, pending]` with action signature `(prevState, formData) => newState`.

## Verification checklist for the POC (acceptance criteria)

With `.env.local` populated and the migration run, the following should all work:

1. `/` shows an empty state and "Write the first one" link.
2. `/clarities/new` accepts a valid clarity; lands back on `/` with the new row at the top; `module_code` is stored upper-case.
3. Submitting `/clarities/new` with an empty field shows an inline error and creates no row.
4. Edit on a listed clarity updates the title; change reflected on `/`.
5. Delete removes the clarity from `/` and from the DB.
6. Filter by partial / mixed-case module code returns matching clarities only; "Clear" resets.
7. Supabase Table Editor matches the UI after each action.

## Next steps (after this POC merges)

Roughly in order of value vs. effort. Pick one slice and brainstorm/spec it before coding.

**Closest to the current scope:**
- **Supabase Auth (email/password)** — sign up / log in / log out, add `author_id uuid references auth.users` to `clarities`, write RLS policies (anyone can read; only the author can update/delete their own row), move from the secret-key server client to a per-request client that respects the user's session. This completes Milestone 1.
- **Markdown editor + render** — replace the plain textarea with a markdown editor that has live preview; render clarities with `react-markdown` plus `rehype-highlight` for code blocks and `rehype-katex` for LaTeX. (Milestone 2.)
- **Topic tags** — add `tags text[]` column with a GIN index; freetext input with autocomplete; show tag chips in the feed; filter by tag in addition to module. (Milestone 2.)

**Slightly bigger:**
- **Upvote / downvote + Wilson-score ranking** — separate `votes (user_id, clarity_id, value)` table, denormalised score on `clarities`, ranking algorithm in the feed query, rate limiting on votes. Requires auth. (Milestone 2.)
- **User profiles** — `/u/[handle]` page with contribution stats and reputation tier. Trivial once auth + votes are in place. (Milestone 2.)
- **Image uploads in the body** — Supabase Storage bucket, signed-URL flow, paste-image support in the editor. (Milestone 2.)
- **Full-text search** — Postgres `tsvector` column on `title || body`, trigram or `tsquery` UI in the header. (Milestone 2.)

**Polish / housekeeping:**
- Remove `app/lib/supabase.ts` if we end up never using the browser-side client.
- Real tests — at minimum, Playwright smoke tests for the seven acceptance-criteria flows. The POC ships without tests by spec exclusion.
- Pagination on the feed (currently unbounded — fine for the POC, will hurt once cohorts contribute regularly).
- Better error UI than the inline string (toast / banner; pending state on the Delete button).

**Out of scope until the above are in place:** bookmarks / study collections, remix / fork, trending dashboard, weekly digest, dark mode. (These are the Milestone 3 extensions in the original proposal.)

## Useful references in the codebase

- [docs/superpowers/specs/](docs/superpowers/specs/) — design specs (one per major feature).
- [docs/superpowers/plans/](docs/superpowers/plans/) — implementation plans corresponding to specs.
- [supabase/migrations/](supabase/migrations/) — SQL migrations. Numbered and applied manually in the Supabase SQL editor.
- [AGENTS.md](AGENTS.md) — Next.js 16 warning about API drift from older docs. Heed it.
