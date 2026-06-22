import "server-only";
import { getServerSupabase } from "@/app/lib/supabase-server";

export type SiteStats = {
  clarities: number;
  votes: number;
  modules: number;
};

export async function getSiteStats(): Promise<SiteStats> {
  const supabase = getServerSupabase();

  const [claritiesRes, votesRes, modulesRes] = await Promise.all([
    supabase.from("clarities").select("*", { count: "exact", head: true }),
    supabase.from("votes").select("*", { count: "exact", head: true }),
    supabase.from("clarities").select("module_code"),
  ]);

  const modules = new Set(
    (modulesRes.data ?? []).map((r) =>
      String(r.module_code).trim().toLowerCase(),
    ),
  ).size;

  return {
    clarities: claritiesRes.count ?? 0,
    votes: votesRes.count ?? 0,
    modules,
  };
}