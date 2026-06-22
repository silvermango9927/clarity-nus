import { getSiteStats } from "@/app/lib/stats";

export async function StatsCard() {
  const stats = await getSiteStats();
  const nf = new Intl.NumberFormat("en-US");

  return (
    <aside className="bg-card border border-rule rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted mb-3.5">
        The library so far
      </p>

      <div className="font-serif text-3xl leading-none text-foreground">
        {nf.format(stats.clarities)}
      </div>
      <div className="text-xs text-muted mt-1">clarities</div>

      <div className="h-px bg-rule my-3.5" />

      <div className="font-serif text-3xl leading-none text-foreground">
        {nf.format(stats.votes)}
      </div>
      <div className="text-xs text-muted mt-1">votes cast</div>

      <div className="h-px bg-rule my-3.5" />

      <div className="font-serif text-3xl leading-none text-foreground">
        {nf.format(stats.modules)}
      </div>
      <div className="text-xs text-muted mt-1">modules covered</div>
    </aside>
  );
}