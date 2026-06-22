import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getProfileById,
  getProfileStats,
} from "@/app/lib/profiles";
import { listClarities } from "@/app/lib/clarities";
import { getVoteInfo } from "@/app/lib/votes";

type Params = Promise<{ id: string }>;

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

const TIER_BLURB: Record<string, string> = {
  Novice: "Just getting started.",
  Contributor: "Regularly helping classmates.",
  Expert: "A trusted explainer.",
  Sage: "A pillar of the community.",
};

export default async function ProfilePage({ params }: { params: Params }) {
  const { id } = await params;
  const profile = await getProfileById(id);
  if (!profile) notFound();

  const stats = await getProfileStats(profile.id);
  const clarities = await listClarities({ authorId: profile.id });
  const voteInfo = await getVoteInfo(
    clarities.map((c) => c.id),
    null,
  );

  const subtitle = [
    profile.year ? `Year ${profile.year}` : null,
    profile.major,
    profile.faculty,
  ]
    .filter(Boolean)
    .join(" · ");

  const statCards = [
    { n: stats.clarities, label: "clarities written" },
    { n: stats.upvotes, label: "upvotes received" },
    { n: stats.modules, label: "modules covered" },
  ];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-7">
      <Link
        href="/"
        className="text-sm text-muted underline underline-offset-4 w-fit"
      >
        ← Back to feed
      </Link>

      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-serif text-3xl leading-tight">
            @{profile.username}
          </h1>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-highlight text-foreground">
            {stats.tier}
          </span>
        </div>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        <p className="font-serif italic text-muted text-[15px]">
          {TIER_BLURB[stats.tier]}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="bg-card border border-rule rounded-2xl p-4 flex flex-col gap-1"
          >
            <span className="font-serif text-3xl">{s.n}</span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-muted">
          <span>Clarities</span>
          <span className="flex-1 h-px bg-rule" />
        </div>

        {clarities.length === 0 ? (
          <p className="text-sm text-muted">No clarities yet.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {clarities.map((c) => {
              const score = voteInfo.get(c.id)?.score ?? 0;
              return (
                <li
                  key={c.id}
                  className="bg-card border border-rule rounded-xl p-4 flex items-baseline justify-between gap-3"
                >
                  <Link
                    href={`/clarities/${c.id}`}
                    className="font-serif text-base leading-snug hover:text-accent min-w-0"
                  >
                    {c.title}
                  </Link>
                  <span className="shrink-0 flex items-center gap-3 text-xs text-muted">
                    <span className="font-mono text-[11px] text-badge-fg bg-badge rounded-md px-2 py-0.5">
                      {c.module_code}
                    </span>
                    <span className="tabular-nums">
                      {score >= 0 ? `+${score}` : score}
                    </span>
                    <span>{fmtDate(c.created_at)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}