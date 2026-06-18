import "server-only";
import { randomUUID } from "node:crypto";
import { getServerSupabase } from "@/app/lib/supabase-server";
import {
  ATTACHMENT_BUCKET,
  checkAttachmentFile,
  type ClarityAttachment,
} from "@/app/lib/clarity-types";

const TABLE = "clarity_attachments";
const COLUMNS =
  "id, clarity_id, storage_path, file_name, content_type, size_bytes, kind, created_at";

export async function listAttachments(
  clarityId: string,
): Promise<ClarityAttachment[]> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .eq("clarity_id", clarityId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`listAttachments failed: ${error.message}`);
  return (data ?? []) as ClarityAttachment[];
}

// Upload one file to Storage and record a row. Returns the row, or null if the
// file is rejected or the upload/insert fails (caller treats it as best-effort;
// strict up-front validation in the action makes runtime failures rare).
export async function uploadClarityAttachment(
  clarityId: string,
  file: File,
): Promise<ClarityAttachment | null> {
  const check = checkAttachmentFile(file);
  if (!check.ok) return null;

  const supabase = getServerSupabase();
  // Random object name (never the user's filename) under the clarity's folder.
  const storagePath = `${clarityId}/${randomUUID()}.${check.ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error(`attachment upload failed ("${file.name}"): ${uploadError.message}`);
    return null;
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      clarity_id: clarityId,
      storage_path: storagePath,
      file_name: file.name.slice(0, 200),
      content_type: file.type,
      size_bytes: file.size,
      kind: check.kind,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    console.error(`attachment row insert failed ("${file.name}"): ${error.message}`);
    await supabase.storage.from(ATTACHMENT_BUCKET).remove([storagePath]);
    return null;
  }

  return data as ClarityAttachment;
}

// Delete specific attachments (Storage objects + rows). Storage removal is
// best-effort; the row delete is authoritative.
export async function deleteAttachments(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, storage_path")
    .in("id", ids);
  if (error) throw new Error(`deleteAttachments lookup failed: ${error.message}`);

  const paths = (data ?? []).map((r) => (r as { storage_path: string }).storage_path);
  if (paths.length > 0) {
    await supabase.storage.from(ATTACHMENT_BUCKET).remove(paths);
  }

  const { error: deleteError } = await supabase.from(TABLE).delete().in("id", ids);
  if (deleteError) throw new Error(`deleteAttachments failed: ${deleteError.message}`);
}

// Remove every Storage object for a clarity. The rows themselves are removed by
// the ON DELETE CASCADE when the clarity is deleted; this purges the files.
export async function purgeAttachmentObjects(clarityId: string): Promise<void> {
  const attachments = await listAttachments(clarityId);
  if (attachments.length === 0) return;
  const supabase = getServerSupabase();
  await supabase.storage
    .from(ATTACHMENT_BUCKET)
    .remove(attachments.map((a) => a.storage_path));
}
