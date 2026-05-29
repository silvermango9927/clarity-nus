import Link from "next/link";
import { listClarities } from "@/app/lib/clarities";
import { deleteClarityAction } from "@/app/actions";

type SearchParams = Promise<{ module?: string | string[] }>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

const fmtDate = (iso: string) => new Date(iso).toLocaleString();

function excerpt(body: string, max = 180) {
  const t = body.trim().replace(/\s+/g, " ");
  return t.length > max ? t.slice(0, max) + "…" : t;
}

export default async function Home({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const moduleFilter = first(params.module)?.trim() ?? "";
  const clarities = await listClarities({ module: moduleFilter || undefined });

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
          {clarities.map((c) => (
            <li
              key={c.id}
              className="border border-rule rounded-lg p-5 flex flex-col gap-3 bg-white/40"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-serif text-xl leading-tight">{c.title}</h2>
                <span className="shrink-0 text-xs font-mono px-2 py-0.5 rounded-full bg-badge text-badge-fg tracking-wide">
                  {c.module_code}
                </span>
              </div>
              <p className="text-sm text-(--foreground)/80 leading-relaxed">
                {excerpt(c.body)}
              </p>
              <div className="flex items-center justify-between text-xs text-muted pt-1 border-t border-rule">
                <span>{fmtDate(c.created_at)}</span>
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
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
