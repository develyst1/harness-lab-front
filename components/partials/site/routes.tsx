import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadLab } from "@/lib/lab/load";
import { Behind } from "@/components/partials/lab/Behind";
import { Compare } from "@/components/partials/lab/Compare";
import { Meeting } from "@/components/partials/lab/Meeting";
import { Plan } from "@/components/partials/lab/Plan";
import { Glossary, Story } from "@/components/partials/lab/Story";
import { TechCard, Techniques } from "@/components/partials/lab/Techniques";
import {
  aboutView, clipsView, compareView, glossaryView, hardwareView, homeParams, homeView, parseSort, parseTab, runsView, runView, STUDY_ID,
  storyView, studiesView, studyBars, type StudyBar, studyView, techniquesView, techniqueView,
} from "@/lib/lab/site";
import { MEETING_WORDS } from "@/lib/lab/meeting";
import { Track } from "@/components/partials/viz";
import type { Page } from "@/lib/lab/types";
import { toView } from "@/lib/lab/view";
import { Crumbs } from "./Crumbs";
import { Grow } from "./Grow";
import { Home } from "./Home";
import { RunClips } from "./RunClips";
import { RunsPage } from "./RunList";
import { RunPage } from "./RunPage";
import { areaLabel, pageTitle, W } from "./words";

// The site's pages. Each is a server component that reads the back (lib/lab/load.ts, per request), whitelists through
// toView and then its own slice (lib/lab/site.ts), so a client component gets only what its page shows (SPEC-012
// § Conventions). A load failure gives today's load-error line on that page.

type Search = Promise<Record<string, string | string[] | undefined>>;
const loadError = <p role="alert">{W.loadError}</p>;

export async function HomeRoute({ searchParams }: { searchParams: Search }) {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { q, sort } = homeParams(await searchParams);
  return <Home view={homeView(toView(lab))} q={q} sort={sort} />;
}

/** /runs: the list, `?sort=date|cost` (SPEC-012 D2). */
export async function RunsRoute({ searchParams }: { searchParams: Search }) {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { sort } = await searchParams;
  return <RunsPage view={runsView(toView(lab))} sort={parseSort(sort)} />;
}

/** /runs/[id]: one run, `?tab=`; an unknown id → the 404 page. */
export async function RunRoute({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Search }) {
  const lab = await loadLab();
  if (!lab) return loadError;
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  const view = runView(toView(lab), decodeURIComponent(id));
  if (!view) notFound();
  return <RunPage view={view} tab={parseTab(tab)} />;
}

/** /clips: today's player over every run; its title is the page's h1 (SPEC-012 D11). */
export async function ClipsRoute() {
  const lab = await loadLab();
  if (!lab) return loadError;
  const view = clipsView(toView(lab));
  return <RunClips runs={view.runs} clips={view.clips} titleAs="h1" />;
}

/** /techniques: the section head, then the cards grouped by `group`; the section title is the page's h1. */
export async function TechniquesRoute() {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { head, groups } = techniquesView(toView(lab));
  return <Techniques head={head} groups={groups} />;
}

/** /techniques/[id]: crumbs, then the one card, whose name is the page's h1 and whose drawing leads (TASK-056). An
 * unknown id → the 404 page. */
export async function TechniqueRoute({ params }: { params: Promise<{ id: string }> }) {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { id } = await params;
  const view = techniqueView(toView(lab), decodeURIComponent(id));
  if (!view) notFound();
  const { technique: t, head } = view;
  return (
    <div className="site-tech">
      <Crumbs trail={[{ label: W.home, href: "/" }, { label: areaLabel("techniques"), href: "/techniques" }, { label: t.id }]} />
      <TechCard t={t} own={{ groups: head.groups }} />
    </div>
  );
}

/** /compare: today's เทียบเอง, its pick in component state (SPEC-012 D1); the section title is the page's h1. */
export async function CompareRoute() {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { runs, compare, cardMiB } = compareView(toView(lab));
  return <Compare runs={runs} compare={compare} cardMiB={cardMiB} titleAs="h1" />;
}

/** A study's headline as bars (TASK-058, SPEC-013 row 6): one row per way of working (the meeting visual's arms), one
 * small bar per meeting, each with its found/N beside it, the numbers through the section's own display rules. The
 * caption is the meeting visual's own title. Its text equivalent is itself: the label and every count are real text, and
 * each bar's meeting is named for a screen reader. Meeting headings show over the columns where there is room. */
function StudyBars({ bars }: { bars: StudyBar[] }) {
  const heads = bars[0]?.cells.map((c) => c.heading) ?? [];
  // One picture for a screen reader (not-ai-look: the readout is the page's picture), its label holding every number.
  const aria = `${MEETING_WORDS.visualTitle}: ${bars.map((b) => `${b.label} ${b.cells.map((c) => `${c.heading} ${c.text}`).join(", ")}`).join("; ")}`;
  return (
    <figure className="st-bars" role="img" aria-label={aria}>
      <figcaption>{MEETING_WORDS.visualTitle}</figcaption>
      <div className="st-row st-head" aria-hidden="true">
        <span />
        {heads.map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      <ul>
        {bars.map((b) => (
          <li key={b.id} className="st-row">
            <span className="st-name">{b.label}</span>
            {b.cells.map((c) => (
              <span key={c.key} className="st-cell">
                <span className="sr">{c.heading}</span>
                <Track pct={c.share === null ? 0 : c.share * 100} />
                <span className="num">{c.text}</span>
              </span>
            ))}
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** /studies: the nav label as h1, then one card per study (the home's latest-study card) with its headline bars (TASK-058);
 * none without a meeting. The title is the card's link; the whole card answers a tap. */
export async function StudiesRoute() {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { studies } = studiesView(toView(lab));
  return (
    <section className="site-studies">
      <h1 className="as-h2">{areaLabel("studies")}</h1>
      {studies.length > 0 && (
        <ul>
          {studies.map((s) => (
            <li key={s.id} className="site-card st-card">
              <Link href={`/studies/${s.id}`} className="st-link">
                <b>{s.titleTh}</b>
              </Link>
              <span className="mute">{s.questionTh}</span>
              <StudyBars bars={s.bars} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** /studies/[id]: REQ-010's study, Meeting.tsx unchanged (Contract 3), with the bar growth (D6). Meeting.tsx is frozen,
 * so the page's h1 is a screen-reader copy of its title (D11). Only r-m1 with a meeting; anything else → 404. */
export async function StudyRoute({ params }: { params: Promise<{ id: string }> }) {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { id } = await params;
  const view = studyView(toView(lab), decodeURIComponent(id));
  if (!view) notFound();
  const { titleTh } = view.meeting;
  return (
    <>
      <Crumbs trail={[{ label: W.home, href: "/" }, { label: areaLabel("studies"), href: "/studies" }, { label: titleTh }]} />
      <h1 className="sr">{titleTh}</h1>
      <Grow />
      {/* TASK-058: the headline drawn first, as new chrome around Meeting.tsx, which is unchanged (REQ-010 Contract 3). */}
      <div className="st-readout">
        <StudyBars bars={studyBars(view.meeting)} />
      </div>
      <Meeting meeting={view.meeting} glossary={view.glossary} />
    </>
  );
}

/** /story: the chapters with their taps, unchanged; the section title is the page's h1 (D11). */
export async function StoryRoute() {
  const lab = await loadLab();
  if (!lab) return loadError;
  return <Story explain={storyView(toView(lab)).explain} titleAs="h1" />;
}

/** /glossary: the nav label as h1, then every entry (page, then the meeting's), anchored term-<n> (D5), searchable by
 * `?q=` (REQ-012 row 3, TASK-055). */
export async function GlossaryRoute({ searchParams }: { searchParams: Search }) {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { q } = await searchParams;
  return (
    <div className="cv-gloss">
      <h1 className="as-h2">{areaLabel("glossary")}</h1>
      <Glossary groups={glossaryView(toView(lab)).groups} initial={typeof q === "string" ? q : ""} />
    </div>
  );
}

/** /hardware: today's สเปกและงบ, answer first (TASK-056); the section title is the page's h1 (D11). */
export async function HardwareRoute() {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { tiers, meta, page } = hardwareView(toView(lab));
  return <Plan tiers={tiers} meta={meta} page={page} />;
}

/** /about: today's เบื้องหลัง with the bar growth (D6); the section title is the page's h1 (D11). Behind reads only
 * `page.behind` (the cast, as above). */
export async function AboutRoute() {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { runs, meta, page } = aboutView(toView(lab));
  return (
    <>
      <Grow />
      <Behind runs={runs} meta={meta} page={page as Page} titleAs="h1" />
    </>
  );
}

/** `<nameTh> · Harness Lab`. */
export async function techniqueMetadata(params: Promise<{ id: string }>): Promise<Metadata> {
  const lab = await loadLab();
  const { id } = await params;
  const t = lab?.techniques.find((x) => x.id === decodeURIComponent(id));
  return { title: t ? pageTitle(t.nameTh) : "Harness Lab" };
}

/** `<titleTh> · Harness Lab`. */
export async function studyMetadata(params: Promise<{ id: string }>): Promise<Metadata> {
  const lab = await loadLab();
  const { id } = await params;
  const m = decodeURIComponent(id) === STUDY_ID ? lab?.meeting : null;
  return { title: m ? pageTitle(m.titleTh) : "Harness Lab" };
}

/** `<run title> · Harness Lab` (SPEC-012 § Site map). */
export async function runMetadata(params: Promise<{ id: string }>): Promise<Metadata> {
  const lab = await loadLab();
  const { id } = await params;
  const run = lab?.runs.find((r) => r.id === decodeURIComponent(id));
  return { title: run ? `${run.title} · Harness Lab` : "Harness Lab" };
}
