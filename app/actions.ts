"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createClarity,
  updateClarity,
  deleteClarity,
} from "@/app/lib/clarities";
import {
  validateInput,
  type ClarityActionState,
} from "@/app/lib/clarity-types";

export async function createClarityAction(
  _prev: ClarityActionState,
  formData: FormData,
): Promise<ClarityActionState> {
  const result = validateInput({
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
  _prev: ClarityActionState,
  formData: FormData,
): Promise<ClarityActionState> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { ok: false, error: "Missing clarity id." };
  }

  const result = validateInput({
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
  if (typeof id !== "string" || !id) return;
  await deleteClarity(id);
  revalidatePath("/");
}
