import Link from "next/link";
import { listClarities } from "@/app/lib/clarities";
import { getVoteInfo, type VoteInfo } from "@/app/lib/votes";
import { createClient } from "@/app/lib/auth-server";
import { deleteClarityAction } from "@/app/actions";
import { Markdown } from "@/app/components/Markdown";
import { VoteButtons } from "@/app/components/VoteButtons";
import type { Author } from "@/app/lib/clarity-types";

type SearchParams = Promise<{ module?: string | string[] }>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const fmtDate = (iso: string) => new Date(iso).toLocaleString();

const authorLabel = (a: Author | null) => {
  if (!a) return "Unknown author";
  const tail = [a.year ? `Y${a.year}` : null, a.major].filter(Boolean).join(" ");
  return tail ? `@${a.username} · ${tail}` : `@${a.username}`;
};

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const moduleFilter = first(params.module)?.trim() ?? "";
  const clarities = await listClarities({ module: moduleFilter || undefined });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const voteInfo = await getVoteInfo(
    clarities.map((c) => c.id),
    currentUserId,
  );

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <form method="get" className="flex gap-2 items-end">
        <label className="flex flex-col gap-1 flex-1">
          <span className="text-xs uppercase tracking-wider text-muted">
            Filter by module code
          </span>
          <input
            name="module"
            defaultValue={moduleFilter}
            placeholder="e.g. CS2030S"
            className="border border-rule rounded px-3 py-2 bg-transparent focus:outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="border border-foreground rounded px-4 py-2 font-medium hover:bg-foreground hover:text-background"
        >
          Filter
        </button>
        {moduleFilter && (
          <Link
            href="/"
            className="text-sm underline underline-offset-4 py-2 text-muted"
          >
            Clear
          </Link>
        )}
      </form>

      {clarities.length === 0 ? (
        <p className="text-muted">
          {moduleFilter ? (
            `No clarities found for "${moduleFilter}".`
          ) : (
            <>
              No clarities yet.{" "}
              <Link
                href="/clarities/new"
                className="underline underline-offset-4 decoration-accent decoration-2 text-foreground"
              >
                Write the first one
              </Link>
              .
            </>
          )}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {clarities.map((c) => {
            const vi: VoteInfo = voteInfo.get(c.id) ?? { score: 0, userVote: 0 };
            return (
              <li
                key={c.id}
                className="group relative isolate border border-rule rounded-lg p-5 flex flex-col gap-3 bg-white/40"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-serif text-xl leading-tight group-hover:text-accent">
                    {/* Stretched link: the ::after overlay makes the whole card
                        clickable while keeping body Markdown links out of a nested
                        <a> (invalid HTML / hydration error). */}
                    <Link
                      href={`/clarities/${c.id}`}
                      className="after:absolute after:inset-0 after:z-1 after:content-['']"
                    >
                      {c.title}
                    </Link>
                  </h2>
                  <span className="shrink-0 text-xs font-mono px-2 py-0.5 rounded-full bg-badge text-badge-fg tracking-wide">
                    {c.module_code}
                  </span>
                </div>
                <div className="clarity-clamp [--card-bg:#faf7f2]">
                  <Markdown source={c.body} />
                </div>
                <div className="relative z-10 flex items-center justify-between gap-3 text-xs text-muted pt-1 border-t border-rule">
                  <div className="flex items-center gap-3">
                    <VoteButtons
                      clarityId={c.id}
                      score={vi.score}
                      userVote={vi.userVote}
                    />
                    <span className="flex items-center gap-2">
                      <span>{authorLabel(c.author)}</span>
                      <span aria-hidden>·</span>
                      <span>{fmtDate(c.created_at)}</span>
                      {c.attachment_count > 0 && (
                        <span
                          title={`${c.attachment_count} attachment${c.attachment_count === 1 ? "" : "s"}`}
                        >
                          📎 {c.attachment_count}
                        </span>
                      )}
                    </span>
                  </div>
                  {c.author_id === currentUserId && (
                    <div className="flex gap-3 items-center">
                      <Link
                        href={`/clarities/${c.id}/edit`}
                        className="underline underline-offset-4"
                      >
                        Edit
                      </Link>
                      <form action={deleteClarityAction}>
                        <input type="hidden" name="id" value={c.id} />
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
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}