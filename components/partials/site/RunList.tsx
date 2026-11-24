import Link from "next/link";
import type { ReactNode } from "react";
import { share, Track } from "@/components/partials/viz";
import { type RunLine, type RunRow, type RunsView, type Sort, SORTS, sortRuns } from "@/lib/lab/site";
import { machine, Pill } from "./RunBits";
import { W } from "./words";

/** /runs only (PM, TASK-057 words 1): the machine line without its cost token, which the row's cost bar already says.
 * The shared machine() keeps it for the run page and the home (TASK-058 Q1, the SA). */
const machineNoCost = (r: Parameters<typeof machine>[0]) => machine(r).replace(/ · \$[\d.]+$/, "");

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

/** The labels are /compare's own metric names (lib/lab/compare.ts), so no new word: a run's time over its items and the
 * machine's cost, each as a bar on one scale across the runs (TASK-057; SPEC-013 row 6). */
const TIME = "เวลารวมทั้งรอบ"; // PM, TASK-057 words 2 (REQ-012): the run's minutes over all its items
const COST = "ค่าเครื่องทั้งรอบ";

function RunMeters({ run, maxMinutes, maxCost }: { run: RunRow; maxMinutes: number; maxCost: number }) {
  const cost = `$${run.cost.toFixed(2)}`;
  return (
    <span className="run-meters" role="img" aria-label={`${TIME} ${run.minutes} นาที; ${COST} ${cost}`}>
      <span className="rm">
        <span className="rm-k">{TIME}</span>
        <span className="rm-v num">{`${run.minutes} นาที`}</span>
        <Track pct={share(run.minutes, maxMinutes)} />
      </span>
      <span className="rm">
        <span className="rm-k">{COST}</span>
        <span className="rm-v num">{cost}</span>
        <Track pct={share(run.cost, maxCost)} />
      </span>
    </span>
  );
}

/** /runs (SPEC-012 D2): today's ประวัติ heading, the sort control, then one row per run as today's entry header (id ·
 * date, title, the machine line, the pill with its icon) and its time and cost bars. The whole row is a link to the
 * run's page; there is no fold. */
export function RunsPage({ view, sort }: { view: RunsView; sort: Sort }) {
  const { history, runs } = view;
  const maxMinutes = Math.max(0, ...runs.map((r) => r.minutes));
  const maxCost = Math.max(0, ...runs.map((r) => r.cost));
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
              <span>{machineNoCost(r)}</span>
            </span>
            <Pill run={r} />
            <RunMeters run={r} maxMinutes={maxMinutes} maxCost={maxCost} />
          </>
        )}
      />
      {/* Modio A3 c (REQ-012 § Modio's text fixes 2): why rents 7–8 are not in the list, under it, as the pack writes it. */}
      {history.missingNote && <p className="mute site-missing">{history.missingNote}</p>}
    </section>
  );
}
