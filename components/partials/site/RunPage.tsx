import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { Bars, Fold, Gauge, Pips } from "@/components/partials/viz";
import { NOT_MEASURED } from "@/lib/lab/compare";
import { firstItem } from "@/lib/lab/items";
import { type RunView, type Tab, TABS } from "@/lib/lab/site";
import type { Run } from "@/lib/lab/types";
import { gb, pct, tight } from "@/lib/lab/vram";
import { Crumbs } from "./Crumbs";
import { ItemLines, machine, Pill } from "./RunBits";
import { RunClips } from "./RunClips";
import { AREAS, W } from "./words";

// One run (SPEC-012 § Site map; AC-1 pick 1, the platform run page): breadcrumbs, its head, and tabs สรุป · รายการทดสอบ ·
// คลิป as real links in ?tab= (SPEC-012 § Conventions), so a shared link reopens the same tab; a sidebar of every run
// with the current one marked, and prev/next. Everything shown is what the one-page site's ประวัติ entry and player
// showed for this run. The สรุป tab leads with a readout (TASK-057, SPEC-013 row 6): the VRAM gauge as the answer cards
// draw it, then each item's minutes against its cap and its caught-bug pips; the sum and the notes fold past 120.

/** The สรุป readout. The labels are the answer card's (Home.tsx ModelCard) and the item lines' (RunBits.tsx); a stopped
 * item's minutes read "· หมดเวลา" as ประวัติ wrote them. */
function Readout({ run, gauge }: { run: Run; gauge: RunView["gauge"] }) {
  const first = firstItem(run);
  const vram = first?.vram ?? null;
  const title = `${gauge.title}${run.gpu !== "A6000" ? ` (วัดบน ${run.gpu})` : ""}`;
  const vramText = vram !== null ? `${pct(vram, gauge.cardMiB)}% · ว่าง ${gb(gauge.cardMiB - vram)} GB` : null;
  // PM, TASK-057 words 5: the caption under the big % drops the repeated %; the aria keeps the whole reading.
  const freeText = vram !== null ? `ว่าง ${gb(gauge.cardMiB - vram)} GB` : null;
  return (
    <div className="cv-readout run-readout">
      <div className="cv-stat">
        <span className="cv-k">{title}</span>
        {vram !== null && vramText ? (
          <Gauge
            value={vram}
            max={gauge.cardMiB}
            big={`${pct(vram, gauge.cardMiB)}%`}
            caption={freeText ?? undefined}
            aria={`${title} ${vramText}; ${gauge.sub}${tight(vram, gauge.cardMiB, gauge.comfort) ? `; ${W.over}` : ""}`}
            mark={gauge.comfort}
            warn={tight(vram, gauge.cardMiB, gauge.comfort)}
          />
        ) : (
          <span className="mute">{NOT_MEASURED}</span>
        )}
        {/* The dashed line's key, the pack's words, as the home's readout shows it (critique A, P2). */}
        {vram !== null && <span className="vz-marklabel">{gauge.sub}</span>}
      </div>
      {run.items.map((i) => {
        // PM, TASK-057 words 3: a capped time reads "39 นาที จาก 70 นาที", as on the home.
        const minutes = `${i.minutes} นาที ${W.minutesOf(i.cap)}${i.timedOut ? " · หมดเวลา" : ""}`;
        return (
          <div className={`cv-stat run-item${i.timedOut ? " stopped" : ""}`} key={i.item}>
            <span className="cv-k">{i.label}</span>
            <Bars rows={[{ name: "", value: i.minutes, text: minutes }]} max={i.cap} aria={`${i.label} ${minutes}`} />
            {/* PM, TASK-057 words 4: the pips carry the home's caption. */}
            <span className="cv-k">ความผิดที่เทสต์ของโมเดลจับได้</span>
            {i.mutations ? (
              <Pips n={i.mutations.caught} of={i.mutations.total} text={`${i.mutations.caught}/${i.mutations.total}`} aria={`จับได้ ${i.mutations.caught} จาก ${i.mutations.total}`} />
            ) : (
              <span className="mute">{NOT_MEASURED}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
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
              <Readout run={run} gauge={view.gauge} />
              <Fold text={run.sum} />
              {run.notes.length > 0 && (
                <ul>
                  {run.notes.map((n) => (
                    <li key={n}>
                      <Fold text={n} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {tab === "items" && <ItemLines run={run} />}
          {tab === "clips" && <RunClips runs={[run]} clips={view.clips} />}
        </div>
        <nav className="site-prevnext" aria-label={`${W.prev} / ${W.next}`}>
          {near.prev ? (
            <Link href={`/runs/${near.prev}`}>
              <IconArrowLeft size={18} stroke={1.75} aria-hidden="true" />
              {`${W.prev} · ${near.prev}`}
            </Link>
          ) : (
            <span />
          )}
          {near.next ? (
            <Link href={`/runs/${near.next}`}>
              {`${W.next} · ${near.next}`}
              <IconArrowRight size={18} stroke={1.75} aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
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
