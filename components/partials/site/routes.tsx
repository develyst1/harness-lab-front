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
  storyView, studiesView, studyView, techniquesView, techniqueView,
} from "@/lib/lab/site";
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
  return <Techniques head={head} groups={groups} titleAs="h1" />;
}

/** /techniques/[id]: crumbs, then the one card, whose name is the page's h1. An unknown id → the 404 page. */
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
      <ol className="techs">
        <TechCard t={t} groups={head.groups} own />
      </ol>
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

/** /studies: the nav label as h1, then one card per study (as the home's latest-study card); none without a meeting. */
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
            <li key={s.id}>
              <Link href={`/studies/${s.id}`} className="site-card">
                <b>{s.titleTh}</b>
                <span className="mute">{s.questionTh}</span>
              </Link>
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

/** /glossary: the nav label as h1, then every entry (page, then the meeting's), anchored term-<n> (D5). */
export async function GlossaryRoute() {
  const lab = await loadLab();
  if (!lab) return loadError;
  return (
    <section>
      <h1 className="as-h2">{areaLabel("glossary")}</h1>
      <div className="site-glossary">
        <Glossary terms={glossaryView(toView(lab)).terms} />
      </div>
    </section>
  );
}

/** /hardware: today's สเปกและงบ; the section title is the page's h1 (D11). Plan's prop is typed `Page`; it reads only the
 * two keys the slice keeps (the cast, as AnswerLinks does). */
export async function HardwareRoute() {
  const lab = await loadLab();
  if (!lab) return loadError;
  const { tiers, meta, page } = hardwareView(toView(lab));
  return <Plan tiers={tiers} meta={meta} page={page as Page} titleAs="h1" />;
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
