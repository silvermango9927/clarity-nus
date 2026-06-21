"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/app/lib/require-user";
import { castVote } from "@/app/lib/votes";

export async function voteAction(formData: FormData): Promise<void> {
  const user = await requireUser();

  const clarityId = formData.get("clarity_id");
  if (typeof clarityId !== "string" || !clarityId) return;

  const raw = formData.get("vote");
  const value = raw === "1" ? 1 : raw === "-1" ? -1 : 0;
  if (value === 0) return;

  await castVote(clarityId, user.id, value as 1 | -1);
  revalidatePath("/");
}