import Link from "next/link";
import type { Author } from "@/app/lib/clarity-types";

// Renders "@username · Y3 Major", with @username linking to the author's
// profile. Links by authorId (the unique user id), NOT username — usernames
// aren't unique, so a username link could point at the wrong person.
// One component for every surface (feed + detail) so the byline never diverges.
export function AuthorByline({
  author,
  authorId,
}: {
  author: Author | null;
  authorId: string | null;
}) {
  if (!author || !author.username || !authorId) {
    return <span>Unknown author</span>;
  }

  const tail = [author.year ? `Y${author.year}` : null, author.major]
    .filter(Boolean)
    .join(" ");

  return (
    <span>
      <Link
        href={`/u/${authorId}`}
        className="hover:text-accent underline underline-offset-2"
      >
        @{author.username}
      </Link>
      {tail && ` · ${tail}`}
    </span>
  );
}