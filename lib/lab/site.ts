import { clipTabs } from "./clips";
import { fixtureHeading, foundShare, foundText, visualArms } from "./meeting";
import { MEETING_GLOSSARY } from "./meetingGlossary";
import { groupName } from "./techniques";
import { techPairs } from "./techViz";
import type { GlossaryEntry, LabData, Meeting, Page, Run, Technique } from "./types";

// The multi-page site (SPEC-012, REQ-011): what each page gets, as a whitelist, and the state that lives in its URL.
// TASK-042 built the comp on it; the build TASKs (046…049) use it. Pure functions, no React.

// ---- the URL ----

export const TABS = ["summary", "items", "clips"] as const;
export type Tab = (typeof TABS)[number];
export const SORTS = ["date", "cost"] as const;
export type Sort = (typeof SORTS)[number];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** `?tab=` on a run page (SPEC-012 § Conventions): summary | items | clips; anything else → summary. */
export function parseTab(v: string | string[] | undefined): Tab {
  const t = first(v);
  return (TABS as readonly string[]).includes(t ?? "") ? (t as Tab) : "summary";
}

/** `?sort=` on the platform's runs strip: date | cost; anything else → date. */
export function parseSort(v: string | string[] | undefined): Sort {
  return first(v) === "cost" ? "cost" : "date";
}

/** `/`'s URL state (SPEC-012 D1): the search box's `q` ("" when absent), and `sort` only when the URL has one, so the
 * box keeps a sort the visitor chose and adds none. */
export function homeParams(sp: Record<string, string | string[] | undefined>): { q: string; sort?: Sort } {
  const q = first(sp.q) ?? "";
  return sp.sort === undefined ? { q } : { q, sort: parseSort(sp.sort) };
}

/** The home's URL (SPEC-012 D1): `?q=` from the search box (an empty box drops it), then `?sort=` when one is set. */
export function homeHref(q: string, sort?: Sort): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (sort) params.set("sort", sort);
  const s = params.toString();
  return s ? `/?${s}` : "/";
}

// The one-page site's hashes and the page each now lives on (SPEC-012 § Conventions, the redirect map). `#answer` is not
// here: คำตอบ stays on `/`.
const OLD_SECTIONS: Record<string, string> = {
  story: "/story",
  behind: "/about",
  clips: "/clips",
  history: "/runs",
  meeting: "/studies/r-m1",
  compare: "/compare",
  techniques: "/techniques",
  plan: "/hardware",
};

const decoded = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/** Where an old link's hash now lives: a page path, or null to stay on `/` (`#answer`, empty, unknown).
 * `#run-<id>` → `/runs/<id>` for any id, encoded so the target stays under /runs/; `#term-<n>` → `/glossary#term-<n>`. */
export function oldAnchorTarget(hash: string): string | null {
  const h = hash.replace(/^#/, "");
  if (Object.hasOwn(OLD_SECTIONS, h)) return OLD_SECTIONS[h];
  const run = /^run-(.+)$/.exec(h);
  if (run) return `/runs/${encodeURIComponent(decoded(run[1]))}`;
  if (/^term-\d+$/.test(h)) return `/glossary#${h}`;
  return null;
}

// ---- runs ----

/** A run as a list shows it. */
export type RunLine = Pick<Run, "id" | "title" | "date" | "isoDate" | "cost">;
const line = (r: Run): RunLine => ({ id: r.id, title: r.title, date: r.date, isoDate: r.isoDate, cost: r.cost });

/** date: newest first (a same-day pair: the later in pack order first); cost: cheapest first. The input is unchanged. */
export function sortRuns<T extends RunLine>(runs: readonly T[], sort: Sort): T[] {
  const newestFirst = [...runs].reverse();
  return sort === "cost"
    ? [...runs].sort((a, b) => a.cost - b.cost)
    : newestFirst.sort((a, b) => (a.isoDate < b.isoDate ? 1 : a.isoDate > b.isoDate ? -1 : 0));
}

/** The newest run by isoDate (the later in pack order on a tie). */
export function latestRun(runs: readonly Run[]): Run | undefined {
  return sortRuns(runs, "date")[0];
}

/** The ids before and after a run, in pack order (the platform's prev/next). */
export function neighbours(runs: readonly Pick<Run, "id">[], id: string): { prev: string | null; next: string | null } {
  const i = runs.findIndex((r) => r.id === id);
  if (i < 0) return { prev: null, next: null };
  return { prev: runs[i - 1]?.id ?? null, next: runs[i + 1]?.id ?? null };
}

// ---- search (the platform's home extra: titles only) ----

export interface SearchEntry {
  kind: "run" | "technique";
  id: string;
  title: string;
}

export function searchIndex(runs: readonly Run[], techniques: readonly Pick<Technique, "id" | "nameTh">[]): SearchEntry[] {
  return [
    ...runs.map((r) => ({ kind: "run" as const, id: r.id, title: r.title })),
    ...techniques.map((t) => ({ kind: "technique" as const, id: t.id, title: t.nameTh })),
  ];
}

/** Entries whose id or title holds the query, ignoring case and outer spaces; a blank query → none. */
export function searchHits(index: readonly SearchEntry[], query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index.filter((e) => e.id.toLowerCase().includes(q) || e.title.toLowerCase().includes(q));
}

// ---- the pages' slices ----

/** What Answer reads of `page` (Answer.tsx): the answer, the ladder and the gauge. */
export type AnswerPage = Pick<Page, "answer" | "ladder"> & { behind: Pick<Page["behind"], "gauge"> };

export interface HomeView {
  hero: Page["hero"];
  /** The short story block: each chapter's when and title (SPEC-012 § Site map, PM answer). */
  story: [string, string][];
  answer: { cards: Run[]; page: AnswerPage };
  latest: Run | null;
  study: { titleTh: string; questionTh: string } | null;
  /** How many things each door leads to. */
  counts: { runs: number; techniques: number; studies: number; clips: number; story: number; glossary: number; tiers: number };
  /** The platform's runs strip and search box. */
  strip: RunLine[];
  search: SearchEntry[];
}

/** The home page's slice of a toView'd body. */
export function homeView(lab: LabData): HomeView {
  const { runs, page, techniques, meeting, tiers } = lab;
  return {
    hero: page.hero,
    story: page.explain.story.map(([when, title]) => [when, title]),
    answer: {
      cards: page.answer.modelCards.map((id) => runs.find((r) => r.id === id)).filter((r): r is Run => r !== undefined),
      page: { answer: page.answer, ladder: page.ladder, behind: { gauge: page.behind.gauge } },
    },
    latest: latestRun(runs) ?? null,
    study: meeting ? { titleTh: meeting.titleTh, questionTh: meeting.questionTh } : null,
    counts: {
      runs: runs.length,
      techniques: techniques.length,
      studies: meeting ? 1 : 0,
      clips: clipTabs(runs).length,
      story: page.explain.story.length,
      glossary: page.explain.glossary.length + (meeting ? MEETING_GLOSSARY.length : 0),
      tiers: tiers.length,
    },
    strip: runs.map(line),
    search: searchIndex(runs, techniques),
  };
}

/** A run as /runs lists it: today's ประวัติ entry header (id · date, title, the machine line, the pill) and the sort keys. */
/** `minutes`: the run's time over all its items (TASK-057: /runs draws it as a bar, on one scale across runs). */
export type RunRow = RunLine & Pick<Run, "gpu" | "model" | "quant" | "ctx" | "card" | "loop" | "label" | "verdict"> & { minutes: number };

export interface RunsView {
  history: Page["history"];
  runs: RunRow[];
}

/** /runs's slice (SPEC-012 D2): the ประวัติ heading and one entry header per run, pack order (the page sorts). */
export function runsView(lab: LabData): RunsView {
  const { kicker, title, intro, missingNote } = lab.page.history;
  return {
    history: { kicker, title, intro, ...(missingNote ? { missingNote } : {}) },
    runs: lab.runs.map((r) => ({
      ...line(r),
      gpu: r.gpu,
      model: r.model,
      quant: r.quant,
      ctx: r.ctx,
      card: r.card,
      loop: r.loop,
      label: r.label,
      verdict: r.verdict,
      minutes: r.items.reduce((sum, i) => sum + i.minutes, 0),
    })),
  };
}

/** /clips's slice: every run, whole, for the player (its tabs come from each run's items; lib/lab/clips.ts takes
 * `Run[]`), and only `page.clips`. */
export function clipsView(lab: LabData): { runs: Run[]; clips: Page["clips"] } {
  const { kicker, title, note, noClip } = lab.page.clips;
  return { runs: lab.runs, clips: { kicker, title, note, noClip } };
}

// ---- techniques, compare, studies (TASK-048) ----

/** /techniques: the section head, then the techniques in one block per `group`, the blocks in the order each group first
 * appears in the pack and the cards in pack order within; each block is named by `groupName`, as the card names it. */
export interface TechniquesView {
  head: Page["techniques"];
  groups: { group: string; name: string; techniques: Technique[] }[];
}

const techHead = (lab: LabData): Page["techniques"] => {
  const { kicker, title, intro, groups } = lab.page.techniques;
  return { kicker, title, intro, groups };
};

export function techniquesView(lab: LabData): TechniquesView {
  const head = techHead(lab);
  const groups: TechniquesView["groups"] = [];
  for (const t of lab.techniques) {
    const block = groups.find((g) => g.group === t.group);
    if (block) block.techniques.push(t);
    else groups.push({ group: t.group, name: groupName(head.groups, t.group), techniques: [t] });
  }
  return { head, groups };
}

/** /techniques' readout (SPEC-013 ranked row 1; TASK-056): every technique whose before → after the page can draw
 * (techViz.ts: a pair with a number the pack's own words say), in group order, with its pairs. A card whose technique is
 * here shows its two texts, not a second drawing (SPEC-013 Q4, the default after the owner's AC-1 yes). */
export function techReadout(groups: TechniquesView["groups"]): { t: Technique; pairs: ReturnType<typeof techPairs>["pairs"] }[] {
  return groups
    .flatMap((g) => g.techniques)
    .map((t) => ({ t, pairs: techPairs(t).pairs }))
    .filter((x) => x.pairs.some((p) => p.before.value !== undefined || p.after.value !== undefined));
}

/** /techniques/[id]: one technique and the head its card reads; an unknown id (exact match) → null. */
export function techniqueView(lab: LabData, id: string): { technique: Technique; head: Page["techniques"] } | null {
  const technique = lab.techniques.find((t) => t.id === id);
  return technique ? { technique, head: techHead(lab) } : null;
}

/** /compare: today's Compare props (every run, page.compare, the card's MiB for the VRAM rows). */
export function compareView(lab: LabData): { runs: Run[]; compare: Page["compare"]; cardMiB: number } {
  const { kicker, title, note } = lab.page.compare;
  return { runs: lab.runs, compare: { kicker, title, note }, cardMiB: lab.page.behind.gauge.cardMiB };
}

/** The one study's id in its URL (SPEC-012 § Public safety: the only new id in a URL). */
export const STUDY_ID = "r-m1";

/** One row of a study's headline bars: an arm, and one cell per meeting (TASK-058). */
export interface StudyBar {
  id: string;
  label: string;
  cells: { key: string; heading: string; share: number | null; text: string }[];
}

/** The study's headline as bars (TASK-058): the arms the meeting visual shows (the first of each kind, `visualArms`), each
 * with found ÷ N per meeting, through the section's own display rules (lib/lab/meeting.ts), so the numbers read exactly
 * as in Meeting.tsx. A null or missing count → "—" and no bar. */
export function studyBars(m: Pick<Meeting, "arms" | "fixtures">): StudyBar[] {
  return visualArms(m.arms).map((a) => ({
    id: a.id,
    label: a.labelTh,
    cells: m.fixtures.map((f) => ({
      key: f.id,
      heading: fixtureHeading(f),
      share: foundShare(a.found[f.id], f.actions),
      text: foundText(a.found[f.id], f.actions),
    })),
  }));
}

/** /studies: one card per study (today the R-M1 meeting study), with its headline bars; none when the back sends no
 * meeting. */
export function studiesView(lab: LabData): { studies: { id: string; titleTh: string; questionTh: string; bars: StudyBar[] }[] } {
  const m = lab.meeting;
  return { studies: m ? [{ id: STUDY_ID, titleTh: m.titleTh, questionTh: m.questionTh, bars: studyBars(m) }] : [] };
}

/** /studies/[id]: Meeting.tsx's two props (REQ-010 Contract 3: the toView'd meeting, the page glossary). Only `r-m1`, and
 * only when the back sends the meeting; anything else → null. */
export function studyView(lab: LabData, id: string): { meeting: Meeting; glossary: GlossaryEntry[] } | null {
  return id === STUDY_ID && lab.meeting ? { meeting: lab.meeting, glossary: lab.page.explain.glossary } : null;
}

// ---- story, glossary, hardware, about (TASK-049) ----

/** /story: the chapters and the page glossary their taps match (SPEC-012 D5: the "คำศัพท์" list is on /glossary). */
export function storyView(lab: LabData): { explain: Pick<Page["explain"], "story" | "glossary"> } {
  const { story, glossary } = lab.page.explain;
  return { explain: { story, glossary } };
}

/** One /glossary entry as the list shows it: its anchor id, the term with its aliases, the plain line. */
export interface GlossaryTerm {
  id: string;
  name: string;
  plain: string;
}

/** A /glossary group (REQ-012, TASK-055): the page's own terms ("lab"), or the study's ("study", titled by the study). */
export interface GlossaryGroup {
  key: "lab" | "study";
  studyTitle?: string;
  terms: GlossaryTerm[];
}

/** /glossary: the page's entries, then MEETING_GLOSSARY when the back sends the meeting, numbered on (term-1 …), as the
 * one-page site's "คำศัพท์" list was (SPEC-011 R3, AC-8; SPEC-012 D5). */
export function glossaryView(lab: LabData): { terms: GlossaryTerm[]; groups: GlossaryGroup[] } {
  const entries: readonly GlossaryEntry[] = [...lab.page.explain.glossary, ...(lab.meeting ? MEETING_GLOSSARY : [])];
  const terms = entries.map(([term, plain, aliases], i) => ({ id: `term-${i + 1}`, name: [term, ...(aliases ?? [])].join(", "), plain }));
  const own = lab.page.explain.glossary.length;
  const groups: GlossaryGroup[] = [{ key: "lab", terms: terms.slice(0, own) }];
  if (lab.meeting && terms.length > own) groups.push({ key: "study", studyTitle: lab.meeting.titleTh, terms: terms.slice(own) });
  return { terms, groups };
}

/** /hardware: today's Plan props; of `page`, only `plan` and `spec` (what Plan reads). */
export function hardwareView(lab: LabData): { tiers: LabData["tiers"]; meta: LabData["meta"]; page: Pick<Page, "plan" | "spec"> } {
  return { tiers: lab.tiers, meta: lab.meta, page: { plan: lab.page.plan, spec: lab.page.spec } };
}

/** /about: today's Behind props; of `page`, only `behind` (what Behind reads). */
export function aboutView(lab: LabData): { runs: Run[]; meta: LabData["meta"]; page: Pick<Page, "behind"> } {
  return { runs: lab.runs, meta: lab.meta, page: { behind: lab.page.behind } };
}

export interface RunView {
  run: Run;
  clips: Page["clips"];
  /** The VRAM gauge's words and scale, as the answer cards draw it (TASK-057: the สรุป tab's readout). */
  gauge: Page["behind"]["gauge"];
  /** Every run as the platform's sidebar lists it. */
  all: Pick<Run, "id" | "title" | "date">[];
  near: { prev: string | null; next: string | null };
}

/** One run's page; an unknown id (exact match) → null, and the page calls notFound(). */
export function runView(lab: LabData, id: string): RunView | null {
  const run = lab.runs.find((r) => r.id === id);
  if (!run) return null;
  return {
    run,
    clips: lab.page.clips,
    gauge: lab.page.behind.gauge,
    all: lab.runs.map((r) => ({ id: r.id, title: r.title, date: r.date })),
    near: neighbours(lab.runs, id),
  };
}
