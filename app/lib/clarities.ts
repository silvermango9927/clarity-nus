import "server-only";
import { getServerSupabase } from "@/app/lib/supabase-server";
import type {
  Author,
  Clarity,
  ClarityInput,
  ClarityListItem,
  ClarityWithAuthor,
} from "@/app/lib/clarity-types";

const TABLE = "clarities";
const COLUMNS =
  "id, title, body, module_code, created_at, updated_at, author_id";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Look up author profiles for a set of author_ids in one query, keyed by id.
async function fetchAuthors(
  ids: (string | null)[],
): Promise<Map<string, Author>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (unique.length === 0) return new Map();

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, year, major, faculty")
    .in("id", unique);

  if (error) throw new Error(`fetchAuthors failed: ${error.message}`);

  const map = new Map<string, Author>();
  for (const row of data ?? []) {
    map.set(row.id as string, {
      username: row.username as string,
      year: (row.year as number | null) ?? null,
      major: (row.major as string | null) ?? null,
      faculty: (row.faculty as string | null) ?? null,
    });
  }
  return map;
}

export async function listClarities(options?: {
  module?: string;
  q?: string;
}): Promise<ClarityListItem[]> {
  const supabase = getServerSupabase();
  let query = supabase
    .from(TABLE)
    .select(`${COLUMNS}, clarity_attachments(count)`)
    .order("created_at", { ascending: false });

  const mod = options?.module?.trim();
  if (mod) {
    const esc = mod.replace(/[\\%_]/g, "\\$&");
    query = query.ilike("module_code", `%${esc}%`);
  }

  // Full-text search. `websearch` parses the raw query the way Google does
  // (quotes, OR, -exclude) and never throws on weird input, so no escaping
  // is needed. Only apply it when there's an actual query — an empty string
  // would match nothing.
  const q = options?.q?.trim();
  if (q) {
    query = query.textSearch("search_vector", q, {
      type: "websearch",
      config: "english",
    });
  }

  const { data, error } = await query;
  if (error) throw new Error(`listClarities failed: ${error.message}`);

  const rows = (data ?? []).map((row) => {
    const { clarity_attachments, ...clarity } = row as Clarity & {
      clarity_attachments: { count: number }[];
    };
    return {
      ...clarity,
      attachment_count: clarity_attachments?.[0]?.count ?? 0,
    };
  });

  const authors = await fetchAuthors(rows.map((r) => r.author_id));
  return rows.map((row) => ({
    ...row,
    author: row.author_id ? authors.get(row.author_id) ?? null : null,
  }));
}

export async function getClarity(
  id: string,
): Promise<ClarityWithAuthor | null> {
  if (!UUID_RE.test(id)) return null;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getClarity failed: ${error.message}`);
  if (!data) return null;

  const clarity = data as Clarity;
  const authors = await fetchAuthors([clarity.author_id]);
  return {
    ...clarity,
    author: clarity.author_id ? authors.get(clarity.author_id) ?? null : null,
  };
}

// Returns just the author_id for a clarity (or null if missing).
// Used by the server actions to check ownership before edit/delete.
export async function getClarityAuthor(id: string): Promise<string | null> {
  if (!UUID_RE.test(id)) return null;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("author_id")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getClarityAuthor failed: ${error.message}`);
  return (data?.author_id as string | null) ?? null;
}

export async function createClarity(
  input: ClarityInput,
  authorId: string,
): Promise<Clarity> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      title: input.title,
      body: input.body,
      module_code: input.module_code,
      author_id: authorId,
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