import {
  IconArrowsLeftRight, IconCircleCheck, IconCircleDashed, IconCpu, IconMapPin, IconMicroscope, IconPlayerPlay, IconServer,
  IconSettings, IconTimeline, IconTool, IconVocabulary, type Icon,
} from "@tabler/icons-react";
import Link from "next/link";
import { Bars, Fold, Gauge, IconCard, Pips, share, Timeline } from "@/components/partials/viz";
import { NOT_MEASURED } from "@/lib/lab/compare";
import { firstItem } from "@/lib/lab/items";
import { homeHref, type HomeView, type Sort } from "@/lib/lab/site";
import type { Page, Run } from "@/lib/lab/types";
import { gb, pct, tight } from "@/lib/lab/vram";
import { Grow } from "./Grow";
import { RunCard } from "./RunBits";
import { RunList, SortLinks } from "./RunList";
import { SiteSearch } from "./SiteSearch";
import { AREAS, W } from "./words";

// The home page (SPEC-012 § Site map; REQ-012 the comp TASK-054, the owner's AC-1 yes, TASK-055): the hero, then the
// READOUT — the answer's run cards with their VRAM gauge, caught-bug pips and minutes bar, and the verdict folded under
// its lead (at ≥ 761 px the verdict heads the readout; at 375 the cards come first, so a gauge is in the first screen) —
// the level ladder as a step track with "วัดยังไง", the story as a timeline into /story, the search, the runs strip with
// cost bars sorted by ?sort=, the doors to each area as icon cards, and the latest run and study. `q` and `sort` are the
// URL's (SPEC-012 D1). Every word is the pack's or the live components' (Answer.tsx, Ladder.tsx); the ▶ glyph is an icon.

/** The ladder's mark words, the live Ladder.tsx's (REQ-001 Q10, REQ-003 Q4). */
const MARK: Record<string, string> = { done: "ผ่านแล้ว", now: "อยู่ตรงนี้", next: "ขั้นถัดไป" };
const LEVEL_ICON: Record<string, [Icon, "ok" | "signal" | "mute"]> = {
  done: [IconCircleCheck, "ok"],
  now: [IconMapPin, "signal"],
};
const DOOR_ICON: Record<(typeof AREAS)[number]["key"], Icon> = {
  runs: IconServer,
  compare: IconArrowsLeftRight,
  techniques: IconTool,
  studies: IconMicroscope,
  hardware: IconCpu,
  clips: IconPlayerPlay,
  story: IconTimeline,
  about: IconSettings,
  glossary: IconVocabulary,
};

export function Home({ view, q = "", sort }: { view: HomeView; q?: string; sort?: Sort }) {
  const { answer, ladder, behind } = view.answer.page;
  const counts: Partial<Record<(typeof AREAS)[number]["key"], number>> = { ...view.counts, hardware: view.counts.tiers };
  const order = sort ?? "date";
  const cut = answer.verdict.indexOf(answer.verdictEmphasis);
  const maxCost = Math.max(0, ...view.strip.map((r) => r.cost));
  return (
    <>
      <Grow />
      <header className="hero cv-head cv-hero">
        <div className="run">{view.hero.kicker}</div>
        <h1>{view.hero.title}</h1>
        <p>{view.hero.lead}</p>
        <div className="who">{view.hero.byline}</div>
      </header>

      {/* id="answer": the old one-page link /#answer lands here (lib/lab/site.ts OLD_SECTIONS). */}
      <section id="answer" className="cv-readout" aria-labelledby="answer-h">
        <h2 id="answer-h" className="as-h3">
          {answer.kicker}
        </h2>
        {/* The h1's question answered in one line: the ladder's levels with their marks (the ladder's own words; the full
            ladder follows below). At ≥ 761 px it leads the readout; at 375 it follows the cards, so a gauge stays in the
            first screen (critique A7). */}
        <ol className="cv-steps" aria-label={ladder.title}>
          {ladder.levels.map((l) => {
            const [I, tone] = LEVEL_ICON[l.status] ?? [IconCircleDashed, "mute" as const];
            return (
              <li key={l.level} className={tone}>
                <I size={18} stroke={1.75} aria-hidden="true" />
                <b>{l.level}</b>
                {MARK[l.status] && <span>{MARK[l.status]}</span>}
              </li>
            );
          })}
        </ol>
        <p className="vz-marklabel cv-legend">{behind.gauge.sub}</p>
        <div className="cv-grid3 cv-models">
          {view.answer.cards.map((row) => (
            <ModelCard key={row.id} row={row} gauge={behind.gauge} />
          ))}
        </div>
        <Fold text={answer.verdict} className="cv-verdict" show={(lead) => emphasise(lead, answer.verdictEmphasis)}>
          <p className="cv-verdict">
            {cut < 0 || !answer.verdictEmphasis ? (
              answer.verdict
            ) : (
              <>
                {answer.verdict.slice(0, cut)}
                <b>{answer.verdictEmphasis}</b>
                {answer.verdict.slice(cut + answer.verdictEmphasis.length)}
              </>
            )}
          </p>
        </Fold>
      </section>

      <section className="cv-sec" aria-labelledby="ladder-h">
        <h2 id="ladder-h" className="as-h3">
          {ladder.title}
        </h2>
        <Timeline
          label={ladder.title}
          items={ladder.levels.map((l) => {
            const [I, tone] = LEVEL_ICON[l.status] ?? [IconCircleDashed, "mute" as const];
            return {
              key: l.level,
              when: MARK[l.status],
              title: l.level,
              icon: <I stroke={1.75} />,
              tone,
              body: (
                <>
                  <span>{l.means}</span>
                  <span className="mute">{l.test}</span>
                </>
              ),
            };
          })}
        />
        <p className="mute">{ladder.note}</p>
        {/* 171 characters, under AC-3's 200: open, as before. "วัดยังไง:" is the PM's label (REQ-001 Q11 (b)). */}
        <p className="how">
          <b>วัดยังไง:</b> {answer.how}
        </p>
      </section>

      <section className="cv-sec" aria-labelledby="site-story-h">
        <div className="run">{W.storyKicker}</div>
        <h2 id="site-story-h">{W.storyTitle}</h2>
        <Timeline
          label={W.storyTitle}
          items={view.story.map(([when, title], i) => ({ key: String(i), when, title, href: `/story#chapter-${i + 1}` }))}
        />
      </section>

      <SiteSearch index={view.search} initial={q} sort={sort} />

      <section className="site-strip cv-strip" aria-labelledby="site-strip-h">
        <div className="site-strip-head">
          <h2 id="site-strip-h">{W.allRuns}</h2>
          <SortLinks sort={order} href={(s) => homeHref(q, s)} />
        </div>
        <RunList
          runs={view.strip}
          sort={order}
          row={(r) => (
            <>
              <span className="site-id">{r.id}</span>
              <b>{r.title}</b>
              <span className="mute num">{`${r.date} · $${r.cost.toFixed(2)}`}</span>
              <span className="vz-track" aria-hidden="true">
                <i className="grow" style={{ width: `${share(r.cost, maxCost)}%` }} />
              </span>
            </>
          )}
        />
      </section>

      <nav className="cv-grid3 cv-doors" aria-label={W.doors}>
        {AREAS.map((a) => {
          const I = DOOR_ICON[a.key];
          const n = counts[a.key];
          return (
            <IconCard
              key={a.key}
              href={`/${a.key}`}
              icon={<I stroke={1.75} />}
              title={a.label}
              sub={"unit" in a && n !== undefined ? `${n} ${a.unit}` : undefined}
            />
          );
        })}
      </nav>

      <div className="site-latest">
        {view.latest && (
          <section aria-labelledby="site-latest-run">
            <h2 id="site-latest-run">{W.latestRun}</h2>
            <RunCard run={view.latest} />
          </section>
        )}
        {view.study && (
          <section aria-labelledby="site-latest-study">
            <h2 id="site-latest-study">{W.latestStudy}</h2>
            <Link href="/studies/r-m1" className="site-card">
              <b>{view.study.titleTh}</b>
              <span className="mute">{view.study.questionTh}</span>
            </Link>
          </section>
        )}
      </div>
    </>
  );
}

/** The verdict's lead with the pack's own bold part (`verdictEmphasis`) bold, whole or as far as the lead reaches. */
function emphasise(lead: string, em: string) {
  if (!em) return lead;
  const at = lead.indexOf(em);
  if (at >= 0)
    return (
      <>
        {lead.slice(0, at)}
        <b>{em}</b>
        {lead.slice(at + em.length)}
      </>
    );
  for (let k = em.length - 1; k >= 4; k--)
    if (lead.endsWith(em.slice(0, k)))
      return (
        <>
          {lead.slice(0, lead.length - k)}
          <b>{em.slice(0, k)}</b>
        </>
      );
  return lead;
}

/** A คำตอบ card, the old ModelCard's fields (Answer.tsx) in a new order: the stamp, the model and its quant, then the
 * readings drawn (the VRAM gauge with its 75% line, the caught-bug pips, the first item's minutes against its cap), the
 * tag and the clip link (the run's คลิป tab, SPEC-012 § Rework round 1). The labels are the old card's. */
function ModelCard({ row, gauge }: { row: Run; gauge: Page["behind"]["gauge"] }) {
  const item = firstItem(row);
  const m = item?.mutations ?? null;
  const title = `${gauge.title}${row.gpu !== "A6000" ? ` (วัดบน ${row.gpu})` : ""}`;
  const vram = item && item.vram !== null ? item.vram : null;
  const vramText = vram !== null ? `${pct(vram, gauge.cardMiB)}% · ว่าง ${gb(gauge.cardMiB - vram)} GB` : null;
  // PM, TASK-057 words 5: the caption under the big % drops the repeated %; the aria keeps the whole reading.
  const freeText = vram !== null ? `ว่าง ${gb(gauge.cardMiB - vram)} GB` : null;
  return (
    <article className={`cv-card${row.best ? " best" : ""}`}>
      <span className={`stamp ${row.stamp ?? ""}`}>{row.stampText}</span>
      <div className="cv-model-name">
        <h3>{row.model}</h3>
        <span className="mute">{`${row.quant} · ความจำ ${row.ctx}k`}</span>
      </div>
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
      </div>
      <div className="cv-stat">
        <span className="cv-k">ความผิดที่เทสต์ของโมเดลจับได้</span>
        {m ? (
          <Pips n={m.caught} of={m.total} text={`${m.caught}/${m.total}`} aria={`จับได้ ${m.caught} จาก ${m.total}`} />
        ) : (
          <span className="mute">{NOT_MEASURED}</span>
        )}
      </div>
      <div className="cv-stat">
        <span className="cv-k">เวลาทำข้อยาก (รอบแรก)</span>
        {item ? (
          <Bars
            rows={[{ name: "", value: item.minutes, text: `${item.minutes} นาที ${W.minutesOf(item.cap)}` }]}
            max={item.cap}
            aria={`เวลาทำข้อยาก (รอบแรก) ${item.minutes} นาที ${W.minutesOf(item.cap)}`}
          />
        ) : (
          <span className="mute">{NOT_MEASURED}</span>
        )}
      </div>
      <p className="tag">{row.tag}</p>
      <Link className="cv-link" href={`/runs/${row.id}?tab=clips`}>
        <IconPlayerPlay size={20} stroke={1.75} aria-hidden="true" />
        ดูคลิป
      </Link>
    </article>
  );
}
