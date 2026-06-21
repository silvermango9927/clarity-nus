export type Clarity = {
  id: string;
  title: string;
  body: string;
  module_code: string;
  created_at: string;
  updated_at: string;
  author_id: string | null;
};

// A clarity's author, resolved from the profiles table.
export type Author = {
  username: string;
  year: number | null;
  major: string | null;
  faculty: string | null;
};

export type AttachmentKind = "image" | "pdf";

export type ClarityAttachment = {
  id: string;
  clarity_id: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  kind: AttachmentKind;
  created_at: string;
};

// A feed row carries its attachment count for the 📎 indicator,
// plus its resolved author profile.
export type ClarityListItem = Clarity & {
  attachment_count: number;
  author: Author | null;
};

// A single clarity with its resolved author profile (detail page).
export type ClarityWithAuthor = Clarity & { author: Author | null };

export const ATTACHMENT_BUCKET = "clarity-attachments";
export const MAX_ATTACHMENTS = 6;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

// The allowlist: MIME type -> { kind, ext }. Anything else is rejected on both
// the client and the server. The stored object name uses `ext`, never the
// user's filename.
export const ALLOWED_ATTACHMENT_TYPES: Record
  string,
  { kind: AttachmentKind; ext: string }
> = {
  "image/png": { kind: "image", ext: "png" },
  "image/jpeg": { kind: "image", ext: "jpg" },
  "image/gif": { kind: "image", ext: "gif" },
  "image/webp": { kind: "image", ext: "webp" },
  "application/pdf": { kind: "pdf", ext: "pdf" },
};

// `accept` attribute for the file input.
export const ATTACHMENT_ACCEPT = Object.keys(ALLOWED_ATTACHMENT_TYPES).join(",");

export type FileCheck =
  | { ok: true; kind: AttachmentKind; ext: string }
  | { ok: false; error: string };

// Validate one file against the allowlist + size cap. Used client-side (before
// adding to the box) and server-side (before upload — never trust the client).
export function checkAttachmentFile(file: {
  name: string;
  type: string;
  size: number;
}): FileCheck {
  const allowed = ALLOWED_ATTACHMENT_TYPES[file.type];
  if (!allowed) {
    return { ok: false, error: `"${file.name}": only images and PDFs are allowed.` };
  }
  if (file.size === 0) {
    return { ok: false, error: `"${file.name}": file is empty.` };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: `"${file.name}": exceeds the 10 MB limit.` };
  }
  return { ok: true, kind: allowed.kind, ext: allowed.ext };
}

// Public URL for a stored object. NEXT_PUBLIC_SUPABASE_URL is inlined on the
// client and present on the server, so this works in both places.
export function attachmentPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${ATTACHMENT_BUCKET}/${storagePath}`;
}

export function humanFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ClarityInput = {
  title: string;
  body: string;
  module_code: string;
};

export type ClarityActionState =
  | { ok: true }
  | { ok: false; error: string }
  | { idle: true };

export const INITIAL_STATE: ClarityActionState = { idle: true };

export type ValidationResult =
  | { ok: true; value: ClarityInput }
  | { ok: false; error: string };

export function validateInput(raw: {
  title: FormDataEntryValue | null;
  body: FormDataEntryValue | null;
  module_code: FormDataEntryValue | null;
}): ValidationResult {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  const mod = typeof raw.module_code === "string" ? raw.module_code.trim() : "";

  if (!title) return { ok: false, error: "Title is required." };
  if (!body) return { ok: false, error: "Body is required." };
  if (!mod) return { ok: false, error: "Module code is required." };

  return {
    ok: true,
    value: { title, body, module_code: mod.toUpperCase() },
  };
}