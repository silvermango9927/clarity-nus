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
