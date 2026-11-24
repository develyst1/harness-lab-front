import Link from "next/link";
import type { ReactNode } from "react";
import { type RunLine, type RunsView, type Sort, SORTS, sortRuns } from "@/lib/lab/site";
import { machine, Pill } from "./RunBits";
import { W } from "./words";

/** A runs list's sort control (`?sort=date|cost`, SPEC-012 D1): the home strip's, shared with /runs. */
export function SortLinks({ sort, href }: { sort: Sort; href: (s: Sort) => string }) {
  return (
    <p className="site-sort">
      <span className="mute">{W.sortBy}</span>
      {SORTS.map((s) => (
        <Link key={s} href={href(s)} className={s === sort ? "on" : undefined} aria-current={s === sort ? "true" : undefined} scroll={false}>
          {W.sort[s]}
        </Link>
      ))}
    </p>
  );
}

/** Runs in `sort` order, each row a link to its page (SPEC-012 D2). The home strip and /runs share it; each draws its
 * own row content. */
export function RunList<T extends RunLine>({ runs, sort, row, className, itemClassName }: {
  runs: readonly T[];
  sort: Sort;
  row: (run: T) => ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  return (
    <ol className={className}>
      {sortRuns(runs, sort).map((r) => (
        <li key={r.id} className={itemClassName}>
          <Link href={`/runs/${r.id}`}>{row(r)}</Link>
        </li>
      ))}
    </ol>
  );
}

/** /runs (SPEC-012 D2): today's ประวัติ heading, the sort control, then one row per run as today's entry header (id ·
 * date, title, the machine line, the pill). The whole row is a link to the run's page; there is no fold. */
export function RunsPage({ view, sort }: { view: RunsView; sort: Sort }) {
  const { history, runs } = view;
  return (
    <section className="site-runs">
      <header className="site-head">
        <div className="run">{history.kicker}</div>
        <h1>{history.title}</h1>
        <p className="mute">{history.intro}</p>
      </header>
      <SortLinks sort={sort} href={(s) => `/runs?sort=${s}`} />
      <RunList
        runs={runs}
        sort={sort}
        className="log site-log"
        itemClassName="entry"
        row={(r) => (
          <>
            <span className="id">{`${r.id} · ${r.date}`}</span>
            <span className="what">
              <b>{r.title}</b>
              <span>{machine(r)}</span>
            </span>
            <Pill run={r} />
          </>
        )}
      />
    </section>
  );
}
