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
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-vote-bg px-2.5 py-1">
      <form action={voteAction} className="flex">
        <input type="hidden" name="clarity_id" value={clarityId} />
        <input type="hidden" name="vote" value="1" />
        <button
          type="submit"
          aria-label="Upvote"
          className={`text-xs leading-none transition-colors hover:text-accent ${
            userVote === 1 ? "text-accent" : "text-muted"
          }`}
        >
          ▲
        </button>
      </form>
      <span className="min-w-[1.25rem] text-center font-mono text-xs font-medium text-foreground">
        {score}
      </span>
      <form action={voteAction} className="flex">
        <input type="hidden" name="clarity_id" value={clarityId} />
        <input type="hidden" name="vote" value="-1" />
        <button
          type="submit"
          aria-label="Downvote"
          className={`text-xs leading-none transition-colors hover:text-accent ${
            userVote === -1 ? "text-accent" : "text-muted"
          }`}
        >
          ▼
        </button>
      </form>
    </div>
  );
}