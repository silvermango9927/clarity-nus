"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENTS,
  attachmentPublicUrl,
  checkAttachmentFile,
  humanFileSize,
  type AttachmentKind,
  type ClarityAttachment,
} from "@/app/lib/clarity-types";

type Picked = { key: string; file: File; previewUrl: string | null };

// Drag-and-drop (and click-to-browse) box for images/PDFs. Selected files are
// kept in state and mirrored into a hidden <input type="file" name="attachments">
// via DataTransfer, so they submit with the create/update server action.
// On edit, `existing` attachments render with a remove (×); removed ids are
// written into the hidden `removed_attachments` field.
export function AttachmentDropzone({
  existing = [],
}: {
  existing?: ClarityAttachment[];
}) {
  const [picked, setPicked] = useState<Picked[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  // Two inputs: `picker` opens the OS dialog (not submitted); `submit` is the
  // named input that actually posts, driven solely by validated `picked` state.
  // Keeping them separate means rejected files never linger in the submission.
  const pickerRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLInputElement>(null);

  const survivingExisting = existing.filter((a) => !removedIds.includes(a.id));
  const total = survivingExisting.length + picked.length;
  const full = total >= MAX_ATTACHMENTS;

  // Mirror exactly the validated picked files into the submitted input.
  useEffect(() => {
    if (!submitRef.current) return;
    const dt = new DataTransfer();
    picked.forEach((p) => dt.items.add(p.file));
    submitRef.current.files = dt.files;
  }, [picked]);

  // Release object URLs when the component unmounts.
  useEffect(
    () => () => {
      picked.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function addFiles(fileList: FileList) {
    const nextErrors: string[] = [];
    const accepted: Picked[] = [];
    let room = MAX_ATTACHMENTS - total;

    for (const file of Array.from(fileList)) {
      const check = checkAttachmentFile(file);
      if (!check.ok) {
        nextErrors.push(check.error);
        continue;
      }
      if (room <= 0) {
        nextErrors.push(`At most ${MAX_ATTACHMENTS} files allowed.`);
        break;
      }
      accepted.push({
        key: `${file.name}-${file.size}-${file.lastModified}-${accepted.length}`,
        file,
        previewUrl: check.kind === "image" ? URL.createObjectURL(file) : null,
      });
      room--;
    }

    if (accepted.length) setPicked((prev) => [...prev, ...accepted]);
    setErrors(nextErrors);
  }

  function removePicked(key: string) {
    setPicked((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
    setErrors([]);
  }

  function handleDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Attachments</span>
      <span className="text-xs text-muted">
        Images and PDFs, up to 10&nbsp;MB each, {MAX_ATTACHMENTS} max.
      </span>

      {/* Picker only — never submitted. Reset value after each pick so the
          same file can be chosen again. */}
      <input
        ref={pickerRef}
        type="file"
        multiple
        accept={ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {/* Submitted input, driven only by validated `picked` via the effect. */}
      <input
        ref={submitRef}
        type="file"
        name="attachments"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />
      <input type="hidden" name="removed_attachments" value={removedIds.join(",")} />

      <button
        type="button"
        disabled={full}
        onClick={() => pickerRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`rounded-lg border border-dashed px-4 py-8 text-center text-sm transition-colors ${
          dragging ? "border-accent bg-accent/5" : "border-rule"
        } ${full ? "opacity-50 cursor-not-allowed" : "hover:border-accent"}`}
      >
        <span className="text-muted">
          {full ? (
            "Attachment limit reached"
          ) : (
            <>
              Drag &amp; drop files here, or{" "}
              <span className="text-accent underline underline-offset-2">
                browse
              </span>
            </>
          )}
        </span>
      </button>

      {errors.length > 0 && (
        <ul
          aria-live="polite"
          className="flex flex-col gap-0.5 text-xs text-red-600"
        >
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}

      {total > 0 && (
        <ul className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {survivingExisting.map((a) => (
            <li key={a.id}>
              <AttachmentTile
                name={a.file_name}
                kind={a.kind}
                previewUrl={
                  a.kind === "image"
                    ? attachmentPublicUrl(a.storage_path)
                    : null
                }
                sizeLabel={humanFileSize(a.size_bytes)}
                onRemove={() => {
                  setRemovedIds((prev) => [...prev, a.id]);
                  setErrors([]);
                }}
              />
            </li>
          ))}
          {picked.map((p) => (
            <li key={p.key}>
              <AttachmentTile
                name={p.file.name}
                kind={p.file.type === "application/pdf" ? "pdf" : "image"}
                previewUrl={p.previewUrl}
                sizeLabel={humanFileSize(p.file.size)}
                onRemove={() => removePicked(p.key)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AttachmentTile({
  name,
  kind,
  previewUrl,
  sizeLabel,
  onRemove,
}: {
  name: string;
  kind: AttachmentKind;
  previewUrl: string | null;
  sizeLabel: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-rule bg-white/40">
      {kind === "image" && previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={name} className="h-24 w-full object-cover" />
      ) : (
        <div className="flex h-24 w-full items-center justify-center text-xs font-mono text-accent">
          PDF
        </div>
      )}
      <div className="flex items-center justify-between gap-1 px-2 py-1">
        <span className="truncate text-[11px]" title={name}>
          {name}
        </span>
        <span className="shrink-0 text-[10px] text-muted">{sizeLabel}</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-xs leading-none text-background hover:bg-accent"
      >
        ×
      </button>
    </div>
  );
}
