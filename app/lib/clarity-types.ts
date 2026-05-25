// Universal module — safe to import from client or server.
// No "server-only" guard here, no DB imports.

export type Clarity = {
  id: string;
  title: string;
  body: string;
  module_code: string;
  created_at: string;
  updated_at: string;
};

export type ClarityInput = {
  title: string;
  body: string;
  module_code: string;
};

export type ClarityActionState =
  | { ok: true }
  | { ok: false; error: string }
  | { idle: true };

export const INITIAL_CLARITY_ACTION_STATE: ClarityActionState = { idle: true };

export type ValidationResult =
  | { ok: true; value: ClarityInput }
  | { ok: false; error: string };

export function validateClarityInput(raw: {
  title: FormDataEntryValue | null;
  body: FormDataEntryValue | null;
  module_code: FormDataEntryValue | null;
}): ValidationResult {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  const moduleCodeRaw =
    typeof raw.module_code === "string" ? raw.module_code.trim() : "";

  if (!title) return { ok: false, error: "Title is required." };
  if (!body) return { ok: false, error: "Body is required." };
  if (!moduleCodeRaw) return { ok: false, error: "Module code is required." };

  return {
    ok: true,
    value: {
      title,
      body,
      module_code: moduleCodeRaw.toUpperCase(),
    },
  };
}
