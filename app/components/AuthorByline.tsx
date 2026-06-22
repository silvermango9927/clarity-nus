import Link from "next/link";
import type { Author } from "@/app/lib/clarity-types";

// Renders "@username · Y3 Major", with @username linking to the profile.
// One component for every surface (feed + detail) so the byline never diverges.
export function AuthorByline({ author }: { author: Author | null }) {
  if (!author || !author.username) return <span>Unknown author</span>;

  const tail = [author.year ? `Y${author.year}` : null, author.major]
    .filter(Boolean)
    .join(" ");

  return (
    <span>
      <Link
        href={`/u/${encodeURIComponent(author.username)}`}
        className="hover:text-accent underline underline-offset-2"
      >
        @{author.username}
      </Link>
      {tail && ` · ${tail}`}
    </span>
  );
}