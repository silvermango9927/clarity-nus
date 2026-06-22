import "server-only";
import { getServerSupabase } from "@/app/lib/supabase-server";
import type { Author } from "@/app/lib/clarity-types";

// A profile is an Author (username/year/major/faculty) plus its id.
export type Profile = Author & { id: string };

export type ReputationTier = "Novice" | "Contributor" | "Expert" | "Sage";

// Tier is derived from total upvotes received. Thresholds live here so they're
// trivial to tune in one place. Pure function → easy to unit-test later.
export function reputationTier(upvotes: number): ReputationTier {
  if (upvotes >= 100) return "Sage";
  if (upvotes >= 25) return "Expert";
  if (upvotes >= 5) return "Contributor";
  return "Novice";
}

export type ProfileStats = {
  clarities: number;
  upvotes: number;
  modules: number;
  tier: ReputationTier;
};

// Look up one profile by username. Uses .eq (NOT .ilike): usernames often
// contain underscores, and `_` is a single-char wildcard in ILIKE — exact
// match avoids that trap. limit(1) instead of maybeSingle() so a (rare)
// duplicate username can't throw.
export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, year, major, faculty")
    .eq("username", username)
    .limit(1);

  if (error) throw new Error(`getProfileByUsername failed: ${error.message}`);

  const row = data?.[0];
  if (!row) return null;

  return {
    id: row.id as string,
    username: row.username as string,
    year: (row.year as number | null) ?? null,
    major: (row.major as string | null) ?? null,
    faculty: (row.faculty as string | null) ?? null,
  };
}

// Contribution stats for one user: clarities written, distinct modules
// covered, and upvotes received across all their clarities.
export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = getServerSupabase();

  // Their clarities — ids (for the vote query) and modules in one read.
  const { data: rows, error: e1 } = await supabase
    .from("clarities")
    .select("id, module_code")
    .eq("author_id", userId);
  if (e1) throw new Error(`getProfileStats clarities failed: ${e1.message}`);

  const clarityIds = (rows ?? []).map((r) => r.id as string);
  const modules = new Set(
    (rows ?? []).map((r) => String(r.module_code).toUpperCase()),
  ).size;

  // Count +1 votes on those clarities. Skip the query entirely if they have
  // no clarities (nothing could have been upvoted).
  let upvotes = 0;
  if (clarityIds.length > 0) {
    const { count, error: e2 } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .in("clarity_id", clarityIds)
      .eq("vote", 1);
    if (e2) throw new Error(`getProfileStats votes failed: ${e2.message}`);
    upvotes = count ?? 0;
  }

  return {
    clarities: clarityIds.length,
    upvotes,
    modules,
    tier: reputationTier(upvotes),
  };
}