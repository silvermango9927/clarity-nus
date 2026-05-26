import "server-only";
import { getServerSupabase } from "@/app/lib/supabase-server";
import type { Clarity, ClarityInput } from "@/app/lib/clarity-types";

const TABLE = "clarities";
const COLUMNS = "id, title, body, module_code, created_at, updated_at";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    // Case-insensitive contains match. Escape ilike wildcards so user input
    // is treated as a literal substring.
    const escaped = moduleFilter.replace(/[\\%_]/g, "\\$&");
    query = query.ilike("module_code", `%${escaped}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`listClarities failed: ${error.message}`);
  return (data ?? []) as Clarity[];
}

export async function getClarity(id: string): Promise<Clarity | null> {
  // A non-UUID id can't possibly resolve to a row, and the Postgres uuid
  // column rejects it with a 22P02 error. Treat it as "not found" so the
  // edit page renders a clean 404 instead of a 500.
  if (!UUID_RE.test(id)) return null;

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
