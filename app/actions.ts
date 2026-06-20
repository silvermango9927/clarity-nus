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
import { requireUser } from "@/app/lib/require-user";

export async function createClarityAction(
  _prevState: ClarityActionState,
  formData: FormData,
): Promise<ClarityActionState> {
  await requireUser();

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
  await requireUser();

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
  await requireUser();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    // No-op on missing id. The Delete button in the feed always sends one;
    // this branch only protects against a malformed request.
    return;
  }
  await deleteClarity(id);
  revalidatePath("/");
}