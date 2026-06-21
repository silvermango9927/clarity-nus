import "server-only";
import { getServerSupabase } from "@/app/lib/supabase-server";

export type VoteInfo = { score: number; userVote: -1 | 0 | 1 };

// Apply a vote with toggle semantics:
//  - no existing vote → insert
//  - same value again → remove (toggle off)
//  - opposite value   → update
export async function castVote(
  clarityId: string,
  userId: string,
  value: 1 | -1,
): Promise<void> {
  const supabase = getServerSupabase();

  const { data: existing, error: readErr } = await supabase
    .from("votes")
    .select("vote")
    .eq("clarity_id", clarityId)
    .eq("user_id", userId)
    .maybeSingle();
  if (readErr) throw new Error(`castVote read failed: ${readErr.message}`);

  if (!existing) {
    const { error } = await supabase
      .from("votes")
      .insert({ clarity_id: clarityId, user_id: userId, vote: value });
    if (error) throw new Error(`castVote insert failed: ${error.message}`);
    return;
  }

  if (existing.vote === value) {
    const { error } = await supabase
      .from("votes")
      .delete()
      .eq("clarity_id", clarityId)
      .eq("user_id", userId);
    if (error) throw new Error(`castVote delete failed: ${error.message}`);
    return;
  }

  const { error } = await supabase
    .from("votes")
    .update({ vote: value })
    .eq("clarity_id", clarityId)
    .eq("user_id", userId);
  if (error) throw new Error(`castVote update failed: ${error.message}`);
}

// Net score (sum of votes) and the current user's own vote, for a set of
// clarities. One query; we aggregate in code (fine at this scale).
export async function getVoteInfo(
  clarityIds: string[],
  userId: string | null,
): Promise<Map<string, VoteInfo>> {
  const map = new Map<string, VoteInfo>();
  for (const id of clarityIds) map.set(id, { score: 0, userVote: 0 });
  if (clarityIds.length === 0) return map;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("votes")
    .select("clarity_id, user_id, vote")
    .in("clarity_id", clarityIds);
  if (error) throw new Error(`getVoteInfo failed: ${error.message}`);

  for (const row of data ?? []) {
    const info = map.get(row.clarity_id as string);
    if (!info) continue;
    info.score += row.vote as number;
    if (userId && row.user_id === userId) {
      info.userVote = row.vote as -1 | 1;
    }
  }
  return map;
}