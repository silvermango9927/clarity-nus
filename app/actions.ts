"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createClarity,
  updateClarity,
  deleteClarity,
} from "@/app/lib/clarities";
import {
  deleteAttachments,
  listAttachments,
  purgeAttachmentObjects,
  uploadClarityAttachment,
} from "@/app/lib/attachments";
import {
  MAX_ATTACHMENTS,
  checkAttachmentFile,
  validateInput,
  type ClarityActionState,
} from "@/app/lib/clarity-types";

// Real (non-empty) File entries from the dropzone's hidden input.
function pickFiles(formData: FormData): File[] {
  return formData
    .getAll("attachments")
    .filter((v): v is File => v instanceof File && v.size > 0);
}

// Server-side re-validation (never trust the client). Returns the first error.
function firstFileError(files: File[]): string | null {
  for (const file of files) {
    const check = checkAttachmentFile(file);
    if (!check.ok) return check.error;
  }
  return null;
}

function parseRemovedIds(formData: FormData): string[] {
  const raw = formData.get("removed_attachments");
  if (typeof raw !== "string" || !raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

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

  const files = pickFiles(formData);
  if (files.length > MAX_ATTACHMENTS) {
    return { ok: false, error: `At most ${MAX_ATTACHMENTS} attachments allowed.` };
  }
  const fileError = firstFileError(files);
  if (fileError) return { ok: false, error: fileError };

  let clarity;
  try {
    clarity = await createClarity(result.value);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to create clarity.",
    };
  }

  // Best-effort uploads; strict validation above makes runtime failures rare.
  for (const file of files) {
    await uploadClarityAttachment(clarity.id, file);
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

  const files = pickFiles(formData);
  const fileError = firstFileError(files);
  if (fileError) return { ok: false, error: fileError };

  // Enforce the total cap against what survives the requested removals.
  const removedIds = parseRemovedIds(formData);
  const existing = await listAttachments(id);
  const ownIds = new Set(existing.map((a) => a.id));
  const toRemove = removedIds.filter((rid) => ownIds.has(rid));
  const surviving = existing.length - toRemove.length;
  if (surviving + files.length > MAX_ATTACHMENTS) {
    return { ok: false, error: `At most ${MAX_ATTACHMENTS} attachments allowed.` };
  }

  try {
    await updateClarity(id, result.value);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Failed to update clarity.",
    };
  }

  if (toRemove.length) await deleteAttachments(toRemove);
  for (const file of files) {
    await uploadClarityAttachment(id, file);
  }

  revalidatePath("/");
  revalidatePath(`/clarities/${id}`);
  redirect("/");
}

export async function deleteClarityAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !id) return;
  // Remove the Storage objects (rows cascade on the clarity delete).
  // Best-effort: a cleanup failure must not block deleting the clarity.
  try {
    await purgeAttachmentObjects(id);
  } catch (e) {
    console.error("purgeAttachmentObjects failed:", e);
  }
  await deleteClarity(id);
  revalidatePath("/");
}

// Detail-page delete: the row is gone, so we cannot stay on /clarities/[id].
// Delete, refresh the feed, then send the user back home.
export async function deleteClarityAndGoHomeAction(
  formData: FormData,
): Promise<void> {
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    try {
      await purgeAttachmentObjects(id);
    } catch (e) {
      console.error("purgeAttachmentObjects failed:", e);
    }
    await deleteClarity(id);
    revalidatePath("/");
  }
  redirect("/");
}
