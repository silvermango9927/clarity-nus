import Link from "next/link";
import { notFound } from "next/navigation";
import { getClarity } from "@/app/lib/clarities";
import { listAttachments } from "@/app/lib/attachments";
import { createClient } from "@/app/lib/auth-server";
import { Markdown } from "@/app/components/Markdown";
import { Attachments } from "@/app/components/Attachments";
import { deleteClarityAndGoHomeAction } from "@/app/actions";
import { AuthorByline } from "@/app/components/AuthorByline";

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = !!user && user.id === clarity.author_id;

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

      <p className="text-sm text-muted -mt-2">
     by <AuthorByline author={clarity.author} />
      </p>

      <Markdown source={clarity.body} />

      <Attachments attachments={attachments} />

      <div className="flex items-center justify-between text-xs text-muted pt-3 border-t border-rule">
        <span>
          {fmtDate(clarity.created_at)}
          {wasEdited(clarity) && ` · edited ${fmtDate(clarity.updated_at)}`}
        </span>
        {isOwner && (
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
        )}
      </div>
    </article>
  );
}