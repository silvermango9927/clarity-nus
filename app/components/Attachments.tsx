import {
  attachmentPublicUrl,
  humanFileSize,
  type ClarityAttachment,
} from "@/app/lib/clarity-types";

// Renders a clarity's attachments beneath its body: images as a thumbnail grid
// (click to open full), PDFs as cards that open in a new tab.
export function Attachments({
  attachments,
}: {
  attachments: ClarityAttachment[];
}) {
  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.kind === "image");
  const pdfs = attachments.filter((a) => a.kind === "pdf");

  return (
    <section className="flex flex-col gap-4 border-t border-rule pt-5">
      <h2 className="text-xs uppercase tracking-wider text-muted">
        Attachments
      </h2>

      {images.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((a) => (
            <li key={a.id}>
              <a
                href={attachmentPublicUrl(a.storage_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-lg border border-rule bg-white/40 hover:border-accent"
                title={a.file_name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachmentPublicUrl(a.storage_path)}
                  alt={a.file_name}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
              </a>
            </li>
          ))}
        </ul>
      )}

      {pdfs.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pdfs.map((a) => (
            <li key={a.id}>
              <a
                href={attachmentPublicUrl(a.storage_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-rule bg-white/40 px-4 py-3 hover:border-accent"
              >
                <PdfIcon />
                <span className="flex flex-col">
                  <span className="text-sm font-medium break-all">
                    {a.file_name}
                  </span>
                  <span className="text-xs text-muted">
                    PDF · {humanFileSize(a.size_bytes)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PdfIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-accent"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9zM9 13v6" />
      <path d="M14 19v-6h2.5" />
      <path d="M14 16h2" />
    </svg>
  );
}
