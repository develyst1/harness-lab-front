import Link from "next/link";
import { type RunView, type Tab, TABS } from "@/lib/lab/site";
import { Crumbs } from "./Crumbs";
import { ItemLines, machine, Pill } from "./RunBits";
import { RunClips } from "./RunClips";
import { AREAS, W } from "./words";

// One run (SPEC-012 § Site map; AC-1 pick 1, the platform run page): breadcrumbs, its head, and tabs สรุป · รายการทดสอบ ·
// คลิป as real links in ?tab= (SPEC-012 § Conventions), so a shared link reopens the same tab; a sidebar of every run
// with the current one marked, and prev/next. Everything shown is what the one-page site's ประวัติ entry and player
// showed for this run.
export function RunPage({ view, tab }: { view: RunView; tab: Tab }) {
  const { run, all, near } = view;
  const tabHref = (t: Tab) => `/runs/${run.id}${t === "summary" ? "" : `?tab=${t}`}`;
  return (
    <div className="site-run with-side">
      <div className="site-main">
        <Crumbs trail={[{ label: W.home, href: "/" }, { label: AREAS[0].label, href: "/runs" }, { label: run.id }]} />
        <header className="site-head">
          <div className="run">{`${run.id} · ${run.date}`}</div>
          <h1>{run.title}</h1>
          <p className="mute">{machine(run)}</p>
          <p className="site-marks">
            <Pill run={run} />
            {run.stampText && <span className={`stamp ${run.stamp ?? ""}`}>{run.stampText}</span>}
          </p>
        </header>
        <nav className="site-tabs" aria-label={W.tabsLabel}>
          {TABS.map((t) => (
            <Link key={t} href={tabHref(t)} className={t === tab ? "on" : undefined} aria-current={t === tab ? "page" : undefined} scroll={false}>
              {W.tabs[t]}
            </Link>
          ))}
        </nav>
        <div className="site-panel">
          {tab === "summary" && (
            <div className="site-summary">
              <p>{run.sum}</p>
              {run.notes.length > 0 && (
                <ul>
                  {run.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {tab === "items" && <ItemLines run={run} />}
          {tab === "clips" && <RunClips runs={[run]} clips={view.clips} />}
        </div>
        <nav className="site-prevnext" aria-label={`${W.prev} / ${W.next}`}>
          {near.prev ? <Link href={`/runs/${near.prev}`}>{`← ${W.prev} · ${near.prev}`}</Link> : <span />}
          {near.next ? <Link href={`/runs/${near.next}`}>{`${W.next} · ${near.next} →`}</Link> : <span />}
        </nav>
      </div>
      <aside className="site-side" aria-labelledby="site-side-h">
        <h2 id="site-side-h">{W.allRuns}</h2>
        <ol>
          {all.map((r) => (
            <li key={r.id}>
              <Link href={`/runs/${r.id}`} aria-current={r.id === run.id ? "page" : undefined}>
                <span className="site-id">{r.id}</span>
                <span>{r.title}</span>
              </Link>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
