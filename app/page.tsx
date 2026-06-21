import Link from "next/link";
import { listClarities } from "@/app/lib/clarities";
import { getVoteInfo, type VoteInfo } from "@/app/lib/votes";
import { createClient } from "@/app/lib/auth-server";
import { deleteClarityAction } from "@/app/actions";
import { Markdown } from "@/app/components/Markdown";
import { VoteButtons } from "@/app/components/VoteButtons";
import { StatsCard } from "@/app/components/StatsCard";
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
    <div className="max-w-5xl mx-auto lg:grid lg:grid-cols-[1fr_200px] lg:gap-8 lg:items-start">
      <div className="mb-6 lg:mb-0 lg:order-2 lg:sticky lg:top-8">
        <StatsCard />
      </div>

      <div className="lg:order-1 flex flex-col gap-7 min-w-0">
        <p className="font-serif italic text-muted text-[15px]">
          The clearest explanation, written by someone who just sat where you're
          sitting.
        </p>

        <form method="get" className="flex gap-2 items-center">
          <input
            name="module"
            defaultValue={moduleFilter}
            placeholder="Filter by module code — e.g. CS2030S"
            className="flex-1 bg-card border border-rule rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Filter
          </button>
          {moduleFilter && (
            <Link
              href="/"
              className="text-sm text-muted underline underline-offset-4 px-1"
            >
              Clear
            </Link>
          )}
        </form>

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted">
          <span>
            {moduleFilter ? `Filtered · ${moduleFilter.toUpperCase()}` : "Newest first"}
          </span>
          <span className="flex-1 h-px bg-rule" />
        </div>

        {clarities.length === 0 ? (
          <p className="text-muted">
            {moduleFilter ? (
              `No clarities found for "${moduleFilter}".`
            ) : (
              <>
                No clarities yet.{" "}
                <Link
                  href="/clarities/new"
                  className="text-foreground underline underline-offset-4 decoration-accent decoration-2"
                >
                  Write the first one
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <ul className="flex flex-col gap-3.5">
            {clarities.map((c) => {
              const vi: VoteInfo = voteInfo.get(c.id) ?? { score: 0, userVote: 0 };
              return (
                <li
                  key={c.id}
                  className="group relative isolate bg-card border border-rule rounded-2xl p-5 flex flex-col gap-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="font-serif text-lg leading-snug">
                      <Link
                        href={`/clarities/${c.id}`}
                        className="after:absolute after:inset-0 after:z-1 after:content-['']"
                      >
                        <span className="clarity-mark">{c.title}</span>
                      </Link>
                    </h2>
                    <span className="shrink-0 font-mono text-[11px] text-badge-fg bg-badge rounded-md px-2 py-0.5">
                      {c.module_code}
                    </span>
                  </div>

                  <div className="clarity-clamp [--card-bg:#ffffff]">
                    <Markdown source={c.body} />
                  </div>

                  <div className="relative z-10 flex items-center justify-between gap-3 pt-3 border-t border-rule text-xs text-muted">
                    <VoteButtons
                      clarityId={c.id}
                      score={vi.score}
                      userVote={vi.userVote}
                    />
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span className="text-foreground/70">{authorLabel(c.author)}</span>
                      <span aria-hidden>·</span>
                      <span>{fmtDate(c.created_at)}</span>
                      {c.attachment_count > 0 && (
                        <>
                          <span aria-hidden>·</span>
                          <span
                            title={`${c.attachment_count} attachment${c.attachment_count === 1 ? "" : "s"}`}
                          >
                            📎 {c.attachment_count}
                          </span>
                        </>
                      )}
                      {c.author_id === currentUserId && (
                        <>
                          <span aria-hidden>·</span>
                          <Link
                            href={`/clarities/${c.id}/edit`}
                            className="hover:text-accent underline underline-offset-2"
                          >
                            Edit
                          </Link>
                          <form action={deleteClarityAction} className="inline">
                            <input type="hidden" name="id" value={c.id} />
                            <button
                              type="submit"
                              className="text-accent hover:opacity-80 underline underline-offset-2"
                            >
                              Delete
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}