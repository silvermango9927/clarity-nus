# ClarityNUS POC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship anonymous CRUD on a `clarities` table through Next.js 16 server actions and a server-only Supabase client, exposing three routes (`/`, `/clarities/new`, `/clarities/[id]/edit`) plus module-code filtering.

**Architecture:** All mutations go through Next.js server actions that call a thin data layer over a server-only Supabase client (`SUPABASE_SECRET_KEY`). Reads happen in Server Components calling the same data layer. RLS is enabled with no policies, so only the server-side secret key can read or write. The create/edit form is the sole client component (needed for `useActionState`).

**Tech Stack:** Next.js 16.2.6 (App Router, Turbopack), React 19.2, TypeScript 5, `@supabase/supabase-js` ^2.106, Tailwind v4.

**Spec:** [docs/superpowers/specs/2026-05-25-claritynus-poc-design.md](../specs/2026-05-25-claritynus-poc-design.md)

---

## Conventions for this plan

- **No automated tests.** The spec explicitly excludes tests for this POC. Every task uses **write code → type-check or manual verify → commit** instead of TDD.
- **Next.js 16 specifics confirmed against `node_modules/next/dist/docs/`:** `params` and `searchParams` are `Promise<...>` and must be `await`-ed. Server actions still use `'use server'`. `useActionState` returns `[state, formAction, pending]` with action signature `(prevState, formData) => newState`.
- **All file paths are absolute from the repo root** `/Users/abhayganti/clarity-nus`.
- **TypeScript path alias:** the project uses `@/*` → `./*` per `tsconfig.json`. Prefer `@/app/lib/...` style imports.
- **Commit cadence:** one commit per task. Use the messages shown.

## Parallelization map

After **Task 2** (shared contract) lands, the remaining tasks split into two independent tracks that a subagent team can run in parallel:

- **Backend track:** Tasks 3 → 4 → 5 (sequential within track)
- **Frontend track:** Tasks 6 → 7 → 8 → 9 → 10 (sequential within track)
- **Integration:** Task 11 runs after both tracks are done

The shared contract (types + stub server actions) in Task 2 is what unblocks the parallelism: the frontend imports the stub actions, the backend fills them in, no merge conflict because they touch different files.

---

## Task 1: Database migration + env template

**Goal:** Land the SQL schema and document the required env vars. The user runs the SQL in the Supabase SQL editor manually.

**Files:**
- Create: `supabase/migrations/0001_clarities.sql`
- Create: `.env.local.example`

- [ ] **Step 1.1: Write the migration SQL**

Create `/Users/abhayganti/clarity-nus/supabase/migrations/0001_clarities.sql`:

```sql
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
```

- [ ] **Step 1.2: Write the env template**

Create `/Users/abhayganti/clarity-nus/.env.local.example`:

```
# Existing client-side keys (already wired up in app/lib/supabase.ts)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# NEW: server-only key for writes/reads through server actions.
# In Supabase dashboard: Project Settings -> API -> "secret" key
# (or "service_role" if your project still uses legacy key naming).
SUPABASE_SECRET_KEY=
```

- [ ] **Step 1.3: Verify .gitignore covers .env.local**

Run:

```bash
grep -E '^\.env\*?' /Users/abhayganti/clarity-nus/.gitignore
```

Expected output includes `.env*`. The `.env.local.example` file is *not* ignored (it lacks `.local`), so it will commit fine.

- [ ] **Step 1.4: Commit**

```bash
cd /Users/abhayganti/clarity-nus
git add supabase/migrations/0001_clarities.sql .env.local.example
git commit -m "Add clarities table migration and env template"
```

- [ ] **Step 1.5: User action required (NOT performed by the agent)**

After this task, the user must:
1. Paste the contents of `supabase/migrations/0001_clarities.sql` into the Supabase SQL editor and run it.
2. Create `.env.local` from `.env.local.example` and fill in all three values.

The agent records this in the task report and moves on. Subsequent backend tasks will fail at runtime without these — that's fine, they fail loud and the user does the setup before integration (Task 11).

---

## Task 2: Shared contract — types, validation, stub actions

**Goal:** Define the types and server-action stubs that the frontend imports. This unblocks the frontend track to start before the backend implementation lands.

**Files structure (note the split):**
- `app/lib/clarity-types.ts` — types + validator + initial state. **Universal** (importable from client or server).
- `app/lib/clarities.ts` — data-layer functions only. **Server-only** (created later in Task 4).
- `app/actions.ts` — server actions.

Splitting types out of the data layer is necessary because the client form component (Task 7) imports the initial-state constant at runtime; if it lived in a `server-only` module the build would fail.

**Files:**
- Create: `app/lib/clarity-types.ts`
- Create: `app/actions.ts`

- [ ] **Step 2.1: Write `app/lib/clarity-types.ts`**

Create `/Users/abhayganti/clarity-nus/app/lib/clarity-types.ts`:

```ts
// Universal module — safe to import from client or server.
// No "server-only" guard here, no DB imports.

export type Clarity = {
  id: string;
  title: string;
  body: string;
  module_code: string;
  created_at: string;
  updated_at: string;
};

export type ClarityInput = {
  title: string;
  body: string;
  module_code: string;
};

export type ClarityActionState =
  | { ok: true }
  | { ok: false; error: string }
  | { idle: true };

export const INITIAL_CLARITY_ACTION_STATE: ClarityActionState = { idle: true };

export type ValidationResult =
  | { ok: true; value: ClarityInput }
  | { ok: false; error: string };

export function validateClarityInput(raw: {
  title: FormDataEntryValue | null;
  body: FormDataEntryValue | null;
  module_code: FormDataEntryValue | null;
}): ValidationResult {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  const moduleCodeRaw =
    typeof raw.module_code === "string" ? raw.module_code.trim() : "";

  if (!title) return { ok: false, error: "Title is required." };
  if (!body) return { ok: false, error: "Body is required." };
  if (!moduleCodeRaw) return { ok: false, error: "Module code is required." };

  return {
    ok: true,
    value: {
      title,
      body,
      module_code: moduleCodeRaw.toUpperCase(),
    },
  };
}
```

- [ ] **Step 2.2: Write `app/actions.ts` with stubs**

Create `/Users/abhayganti/clarity-nus/app/actions.ts`:

```ts
"use server";

import type { ClarityActionState } from "@/app/lib/clarity-types";

// Stub bodies. Real implementations land in Task 5.
// They return an error state so the frontend can be wired against them
// without crashing.

export async function createClarityAction(
  _prevState: ClarityActionState,
  _formData: FormData,
): Promise<ClarityActionState> {
  return { ok: false, error: "createClarityAction not implemented yet." };
}

export async function updateClarityAction(
  _prevState: ClarityActionState,
  _formData: FormData,
): Promise<ClarityActionState> {
  return { ok: false, error: "updateClarityAction not implemented yet." };
}

export async function deleteClarityAction(formData: FormData): Promise<void> {
  void formData;
  // Real impl in Task 5.
}
```

- [ ] **Step 2.3: Type-check**

Run:

```bash
cd /Users/abhayganti/clarity-nus && npx tsc --noEmit
```

Expected: exit code 0, no errors.

- [ ] **Step 2.4: Commit**

```bash
cd /Users/abhayganti/clarity-nus
git add app/lib/clarity-types.ts app/actions.ts
git commit -m "Add Clarity types, validator, and server action stubs"
```

---

# BACKEND TRACK

## Task 3: Server-only Supabase client

**Goal:** Provide a singleton Supabase client constructed from the server-only secret key.

**Files:**
- Create: `app/lib/supabase-server.ts`

- [ ] **Step 3.1: Write the server client**

Create `/Users/abhayganti/clarity-nus/app/lib/supabase-server.ts`:

```ts
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY is not set");
  }

  cached = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}
```

The `import "server-only"` line makes the build fail if this file is ever imported from a client component — exactly what we want for a secret-key client.

- [ ] **Step 3.2: Confirm `server-only` is available**

Run:

```bash
ls /Users/abhayganti/clarity-nus/node_modules/server-only 2>/dev/null && echo "OK"
```

Expected: directory listing followed by `OK`. (`server-only` ships transitively via Next.js.)

- [ ] **Step 3.3: Type-check**

Run:

```bash
cd /Users/abhayganti/clarity-nus && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 3.4: Commit**

```bash
cd /Users/abhayganti/clarity-nus
git add app/lib/supabase-server.ts
git commit -m "Add server-only Supabase client"
```

---

## Task 4: Data layer implementation

**Goal:** Create the server-only data layer that exposes Supabase-backed CRUD functions.

**Files:**
- Create: `app/lib/clarities.ts`

- [ ] **Step 4.1: Write `app/lib/clarities.ts`**

Create `/Users/abhayganti/clarity-nus/app/lib/clarities.ts`:

```ts
import "server-only";
import { getServerSupabase } from "@/app/lib/supabase-server";
import type { Clarity, ClarityInput } from "@/app/lib/clarity-types";

const TABLE = "clarities";
const COLUMNS = "id, title, body, module_code, created_at, updated_at";

export async function listClarities(options?: {
  module?: string;
}): Promise<Clarity[]> {
  const supabase = getServerSupabase();
  let query = supabase
    .from(TABLE)
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  const moduleFilter = options?.module?.trim();
  if (moduleFilter) {
    // Case-insensitive contains match on module_code.
    query = query.ilike("module_code", `%${moduleFilter}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`listClarities failed: ${error.message}`);
  return (data ?? []) as Clarity[];
}

export async function getClarity(id: string): Promise<Clarity | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getClarity failed: ${error.message}`);
  return (data as Clarity | null) ?? null;
}

export async function createClarity(input: ClarityInput): Promise<Clarity> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      title: input.title,
      body: input.body,
      module_code: input.module_code,
    })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`createClarity failed: ${error.message}`);
  return data as Clarity;
}

export async function updateClarity(
  id: string,
  input: ClarityInput,
): Promise<Clarity> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      title: input.title,
      body: input.body,
      module_code: input.module_code,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`updateClarity failed: ${error.message}`);
  return data as Clarity;
}

export async function deleteClarity(id: string): Promise<void> {
  const supabase = getServerSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(`deleteClarity failed: ${error.message}`);
}
```

- [ ] **Step 4.2: Type-check**

Run:

```bash
cd /Users/abhayganti/clarity-nus && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 4.3: Commit**

```bash
cd /Users/abhayganti/clarity-nus
git add app/lib/clarities.ts
git commit -m "Add server-only data layer for clarities"
```

---

## Task 5: Server actions implementation

**Goal:** Replace the stubs in `app/actions.ts` with real implementations that validate, mutate, revalidate, and redirect.

**Files:**
- Modify: `app/actions.ts`

- [ ] **Step 5.1: Rewrite `app/actions.ts`**

Replace the entire contents of `/Users/abhayganti/clarity-nus/app/actions.ts` with:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createClarity,
  updateClarity,
  deleteClarity,
} from "@/app/lib/clarities";
import {
  validateClarityInput,
  type ClarityActionState,
} from "@/app/lib/clarity-types";

export async function createClarityAction(
  _prevState: ClarityActionState,
  formData: FormData,
): Promise<ClarityActionState> {
  const result = validateClarityInput({
    title: formData.get("title"),
    body: formData.get("body"),
    module_code: formData.get("module_code"),
  });
  if (!result.ok) return { ok: false, error: result.error };

  try {
    await createClarity(result.value);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create clarity.",
    };
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateClarityAction(
  _prevState: ClarityActionState,
  formData: FormData,
): Promise<ClarityActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing clarity id." };
  }

  const result = validateClarityInput({
    title: formData.get("title"),
    body: formData.get("body"),
    module_code: formData.get("module_code"),
  });
  if (!result.ok) return { ok: false, error: result.error };

  try {
    await updateClarity(id, result.value);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update clarity.",
    };
  }

  revalidatePath("/");
  redirect("/");
}

export async function deleteClarityAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    // No-op on missing id. The Delete button in the feed always sends one;
    // this branch only protects against a malformed request.
    return;
  }
  await deleteClarity(id);
  revalidatePath("/");
}
```

Notes:
- `redirect()` throws a `NEXT_REDIRECT` exception, which is why it sits outside the `try` block.
- `deleteClarityAction` does not use `useActionState` — it's bound directly to a tiny inline form per item in the feed. Its signature is `(FormData) => Promise<void>`.

- [ ] **Step 5.2: Type-check**

Run:

```bash
cd /Users/abhayganti/clarity-nus && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 5.3: Commit**

```bash
cd /Users/abhayganti/clarity-nus
git add app/actions.ts
git commit -m "Implement create/update/delete server actions for clarities"
```

---

# FRONTEND TRACK

## Task 6: Layout metadata and nav

**Goal:** Fix the placeholder "Create Next App" metadata and add a top header with title + "New clarity" link.

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 6.1: Rewrite layout.tsx**

Replace the entire contents of `/Users/abhayganti/clarity-nus/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClarityNUS",
  description: "Bite-sized clarity, crowd-sourced understanding.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold">
            ClarityNUS
          </Link>
          <Link
            href="/clarities/new"
            className="text-sm underline underline-offset-4"
          >
            New clarity
          </Link>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 6.2: Type-check**

Run:

```bash
cd /Users/abhayganti/clarity-nus && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 6.3: Commit**

```bash
cd /Users/abhayganti/clarity-nus
git add app/layout.tsx
git commit -m "Update root layout with ClarityNUS metadata and nav"
```

---

## Task 7: Shared client form component

**Goal:** Build the create/edit form as a single client component bound to a passed-in server action. Both `/clarities/new` and `/clarities/[id]/edit` use it.

**Files:**
- Create: `app/components/ClarityForm.tsx`

- [ ] **Step 7.1: Write the form component**

Create `/Users/abhayganti/clarity-nus/app/components/ClarityForm.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  INITIAL_CLARITY_ACTION_STATE,
  type Clarity,
  type ClarityActionState,
} from "@/app/lib/clarity-types";

type FormAction = (
  prevState: ClarityActionState,
  formData: FormData,
) => Promise<ClarityActionState>;

type Props = {
  action: FormAction;
  initial?: Clarity;
  submitLabel: string;
};

export function ClarityForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_CLARITY_ACTION_STATE,
  );

  const errorMessage =
    state && "ok" in state && state.ok === false ? state.error : null;

  return (
    <form action={formAction} className="flex flex-col gap-4 max-w-2xl">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Title</span>
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Module code</span>
        <input
          name="module_code"
          required
          placeholder="e.g. CS2030S"
          defaultValue={initial?.module_code ?? ""}
          className="border rounded px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Body</span>
        <textarea
          name="body"
          required
          rows={10}
          defaultValue={initial?.body ?? ""}
          className="border rounded px-3 py-2 font-mono text-sm"
        />
      </label>

      {errorMessage && (
        <p aria-live="polite" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="flex gap-3 items-center">
        <button
          type="submit"
          disabled={pending}
          className="border rounded px-4 py-2 font-medium disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        <Link href="/" className="text-sm underline underline-offset-4">
          Cancel
        </Link>
      </div>
    </form>
  );
}
```

- [ ] **Step 7.2: Type-check**

Run:

```bash
cd /Users/abhayganti/clarity-nus && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 7.3: Commit**

```bash
cd /Users/abhayganti/clarity-nus
git add app/components/ClarityForm.tsx
git commit -m "Add shared ClarityForm client component"
```

---

## Task 8: Feed page with filter and delete

**Goal:** Replace the placeholder homepage with a feed of clarities, a module filter form, and per-item Edit / Delete controls.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 8.1: Rewrite page.tsx**

Replace the entire contents of `/Users/abhayganti/clarity-nus/app/page.tsx` with:

```tsx
import Link from "next/link";
import { listClarities } from "@/app/lib/clarities";
import { deleteClarityAction } from "@/app/actions";

type SearchParams = Promise<{ module?: string | string[] }>;

function firstString(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function excerpt(body: string, max = 180): string {
  const trimmed = body.trim().replace(/\s+/g, " ");
  return trimmed.length > max ? trimmed.slice(0, max) + "…" : trimmed;
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const moduleFilter = firstString(params.module)?.trim() ?? "";
  const clarities = await listClarities({ module: moduleFilter || undefined });

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <form method="get" className="flex gap-2 items-end">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-sm font-medium">Filter by module code</span>
          <input
            name="module"
            defaultValue={moduleFilter}
            placeholder="e.g. CS2030S"
            className="border rounded px-3 py-2"
          />
        </label>
        <button type="submit" className="border rounded px-4 py-2">
          Filter
        </button>
        {moduleFilter && (
          <Link href="/" className="text-sm underline underline-offset-4 py-2">
            Clear
          </Link>
        )}
      </form>

      {clarities.length === 0 ? (
        <p className="text-gray-600">
          {moduleFilter
            ? `No clarities found for "${moduleFilter}".`
            : "No clarities yet. "}
          <Link
            href="/clarities/new"
            className="underline underline-offset-4"
          >
            Write the first one
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {clarities.map((c) => (
            <li key={c.id} className="border rounded p-4 flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold">{c.title}</h2>
                <span className="text-xs font-mono text-gray-500">
                  {c.module_code}
                </span>
              </div>
              <p className="text-sm text-gray-700">{excerpt(c.body)}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(c.created_at)}</span>
                <div className="flex gap-3 items-center">
                  <Link
                    href={`/clarities/${c.id}/edit`}
                    className="underline underline-offset-4"
                  >
                    Edit
                  </Link>
                  <form action={deleteClarityAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="underline underline-offset-4 text-red-600"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 8.2: Type-check**

Run:

```bash
cd /Users/abhayganti/clarity-nus && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 8.3: Commit**

```bash
cd /Users/abhayganti/clarity-nus
git add app/page.tsx
git commit -m "Replace homepage with clarities feed, module filter, and delete"
```

---

## Task 9: Create page

**Goal:** Add the `/clarities/new` route.

**Files:**
- Create: `app/clarities/new/page.tsx`

- [ ] **Step 9.1: Write the page**

Create `/Users/abhayganti/clarity-nus/app/clarities/new/page.tsx`:

```tsx
import { ClarityForm } from "@/app/components/ClarityForm";
import { createClarityAction } from "@/app/actions";

export default function NewClarityPage() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-2xl font-bold">New clarity</h1>
      <ClarityForm action={createClarityAction} submitLabel="Create" />
    </div>
  );
}
```

- [ ] **Step 9.2: Type-check**

Run:

```bash
cd /Users/abhayganti/clarity-nus && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 9.3: Commit**

```bash
cd /Users/abhayganti/clarity-nus
git add app/clarities/new/page.tsx
git commit -m "Add /clarities/new route"
```

---

## Task 10: Edit page

**Goal:** Add the `/clarities/[id]/edit` route. 404 if id is unknown.

**Files:**
- Create: `app/clarities/[id]/edit/page.tsx`

- [ ] **Step 10.1: Write the page**

Create `/Users/abhayganti/clarity-nus/app/clarities/[id]/edit/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { ClarityForm } from "@/app/components/ClarityForm";
import { updateClarityAction } from "@/app/actions";
import { getClarity } from "@/app/lib/clarities";

type Params = Promise<{ id: string }>;

export default async function EditClarityPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const clarity = await getClarity(id);
  if (!clarity) notFound();

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Edit clarity</h1>
      <ClarityForm
        action={updateClarityAction}
        initial={clarity}
        submitLabel="Save"
      />
    </div>
  );
}
```

- [ ] **Step 10.2: Type-check**

Run:

```bash
cd /Users/abhayganti/clarity-nus && npx tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 10.3: Commit**

```bash
cd /Users/abhayganti/clarity-nus
git add app/clarities/[id]/edit/page.tsx
git commit -m "Add /clarities/[id]/edit route"
```

---

# INTEGRATION

## Task 11: End-to-end manual verification

**Goal:** Confirm the acceptance criteria from spec Section 9 by driving the running app and observing both UI and database state.

**Files:** No new files. May produce small fixes to any of the above on failure.

**Pre-requisite:** The user must have completed the manual steps from Task 1.5 (run the SQL, populate `.env.local`).

- [ ] **Step 11.1: Start the dev server (background)**

Run in background:

```bash
cd /Users/abhayganti/clarity-nus && npm run dev
```

Wait until the log shows `Ready in …`. The server is at `http://localhost:3000`.

- [ ] **Step 11.2: Walk acceptance criterion 1 — empty state**

```bash
curl -s http://localhost:3000/ | grep -E "No clarities yet|Filter by module|New clarity"
```

Expected: matches all three strings (empty state, filter form, nav link).

- [ ] **Step 11.3: Walk acceptance criteria 2-3 — create + validation**

Visit `http://localhost:3000/clarities/new` in a browser. Submit the form once with an empty title — confirm an inline error appears and no row is inserted (refresh `/` to confirm). Then submit a valid clarity, e.g. title "Recursion in CS2030S", module "cs2030s" (lowercase — should be stored as `CS2030S`), body "A function that calls itself...".

After redirect to `/`, confirm the new clarity appears at the top with `CS2030S` as the module.

- [ ] **Step 11.4: Walk acceptance criterion 4 — edit**

Click Edit on the clarity from Step 11.3. Change the title, submit, confirm the change is reflected on `/`.

- [ ] **Step 11.5: Walk acceptance criterion 5 — delete**

Click Delete. Confirm the row disappears from `/`.

- [ ] **Step 11.6: Walk acceptance criterion 6 — filter**

Create two clarities with different module codes (e.g. `CS2030S` and `MA1521`). On `/`, enter `cs` in the filter and submit — only the CS one should show. Enter `MA` — only the MA one. Click Clear — both show.

- [ ] **Step 11.7: Walk acceptance criterion 7 — DB consistency**

In the Supabase dashboard SQL editor, run:

```sql
select id, title, module_code, created_at, updated_at from clarities order by created_at desc;
```

Confirm the table contents match what the UI shows. `module_code` should be upper-case for all rows, regardless of how it was entered.

- [ ] **Step 11.8: Stop the dev server**

Use TaskStop on the background bash task that runs `npm run dev`.

- [ ] **Step 11.9: Final commit if any fixes were made**

If Steps 11.2–11.7 surfaced any bugs, fix them, then commit:

```bash
cd /Users/abhayganti/clarity-nus
git add -A
git commit -m "Fix issues found during POC verification"
```

If everything passed first try, no final commit is needed.

---

## Done

The POC is complete when all 11 tasks are checked off and Task 11 ran clean. The next milestone (auth) starts with a new spec.
