import Link from "next/link";
import { notFound } from "next/navigation";
import { getClarity } from "@/app/lib/clarities";
import { listAttachments } from "@/app/lib/attachments";
import { Markdown } from "@/app/components/Markdown";
import { Attachments } from "@/app/components/Attachments";
import { deleteClarityAndGoHomeAction } from "@/app/actions";

type Params = Promise<{ id: string }>;

const fmtDate = (iso: string) => new Date(iso).toLocaleString();

// Only flag "edited" when the update is meaningfully after creation — a fresh
// row's created_at/updated_at can differ by microseconds.
const wasEdited = (c: { created_at: string; updated_at: string }) =>
  new Date(c.updated_at).getTime() - new Date(c.created_at).getTime() > 1000;

export default async function ClarityDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const clarity = await getClarity(id);
  if (!clarity) notFound();

  const attachments = await listAttachments(clarity.id);

  return (
    <article className="flex flex-col gap-5 max-w-3xl">
      <Link
        href="/"
        className="text-sm text-muted underline underline-offset-4 w-fit"
      >
        ← Back to feed
      </Link>

      <div className="flex items-baseline justify-between gap-3">
        <h1 className="font-serif text-3xl leading-tight">{clarity.title}</h1>
        <span className="shrink-0 text-xs font-mono px-2 py-0.5 rounded-full bg-badge text-badge-fg tracking-wide">
          {clarity.module_code}
        </span>
      </div>

      <Markdown source={clarity.body} />

      <Attachments attachments={attachments} />

      <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-rule">
        <span>
          {fmtDate(clarity.created_at)}
          {wasEdited(clarity) && ` · edited ${fmtDate(clarity.updated_at)}`}
        </span>
        <div className="flex gap-3 items-center">
          <Link
            href={`/clarities/${clarity.id}/edit`}
            className="underline underline-offset-4"
          >
            Edit
          </Link>
          <form action={deleteClarityAndGoHomeAction}>
            <input type="hidden" name="id" value={clarity.id} />
            <button
              type="submit"
              className="underline underline-offset-4 text-accent"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
