import Link from "next/link";
import { Hero } from "@/components/partials/lab/Hero";
import { homeHref, type HomeView, type Sort } from "@/lib/lab/site";
import { AnswerLinks } from "./AnswerLinks";
import { Grow } from "./Grow";
import { RunCard } from "./RunBits";
import { RunList, SortLinks } from "./RunList";
import { SiteSearch } from "./SiteSearch";
import { AREAS, W } from "./words";

// The home page (SPEC-012 § Site map, with the PM's answer; AC-1 = the platform home): the search box, Hero, the short
// story block (the 8 chapter titles, each a link into /story), คำตอบ, the runs strip sorted by ?sort=, the doors to each
// area, and the latest run and study. `q` and `sort` are the URL's (SPEC-012 D1); `sort` is undefined when it has none.
export function Home({ view, q = "", sort }: { view: HomeView; q?: string; sort?: Sort }) {
  const counts: Partial<Record<(typeof AREAS)[number]["key"], number>> = { ...view.counts, hardware: view.counts.tiers };
  const order = sort ?? "date";
  return (
    <>
      <Grow />
      <SiteSearch index={view.search} initial={q} sort={sort} />
      <Hero hero={view.hero} />
      <section className="site-story" aria-labelledby="site-story-h">
        <div className="run">{W.storyKicker}</div>
        <h2 id="site-story-h">{W.storyTitle}</h2>
        <ol>
          {view.story.map(([when, title], i) => (
            <li key={i}>
              <Link href={`/story#chapter-${i + 1}`}>
                <span className="when">{when}</span>
                <b>{title}</b>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <AnswerLinks cards={view.answer.cards} page={view.answer.page} />
      <section className="site-strip" aria-labelledby="site-strip-h">
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
            </>
          )}
        />
      </section>
      <nav className="site-doors" aria-label={W.doors}>
        {AREAS.map((a) => (
          <Link key={a.key} href={`/${a.key}`}>
            <b>{a.label}</b>
            {"unit" in a && counts[a.key] !== undefined && <span className="mute">{`${counts[a.key]} ${a.unit}`}</span>}
          </Link>
        ))}
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
