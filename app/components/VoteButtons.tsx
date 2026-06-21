import { voteAction } from "@/app/vote-actions";

export function VoteButtons({
  clarityId,
  score,
  userVote,
}: {
  clarityId: string;
  score: number;
  userVote: -1 | 0 | 1;
}) {
  const base = "px-1 leading-none text-sm transition-colors hover:text-foreground";
  return (
    <div className="flex items-center gap-1">
      <form action={voteAction}>
        <input type="hidden" name="clarity_id" value={clarityId} />
        <input type="hidden" name="vote" value="1" />
        <button
          type="submit"
          aria-label="Upvote"
          className={`${base} ${userVote === 1 ? "text-accent" : "text-muted"}`}
        >
          ▲
        </button>
      </form>
      <span className="min-w-[1.5rem] text-center font-mono text-foreground">
        {score}
      </span>
      <form action={voteAction}>
        <input type="hidden" name="clarity_id" value={clarityId} />
        <input type="hidden" name="vote" value="-1" />
        <button
          type="submit"
          aria-label="Downvote"
          className={`${base} ${userVote === -1 ? "text-accent" : "text-muted"}`}
        >
          ▼
        </button>
      </form>
    </div>
  );
}