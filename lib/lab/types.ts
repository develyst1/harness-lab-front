// Shapes of Modio's data pack v3.1 as served by `GET /api/lab` (SPEC-001 § Pack v2, SPEC-003 § Contract; pack README
// § runs.json v2, § meta.json, § page.json, the Q4 item table and § Pack v3.1). Field names are the pack's, never renamed.

export type Verdict = "ok" | "part" | "bad";

export interface MutationPoint {
  label: string;
  caught: boolean;
}

/** Planted bugs the model's own tests caught, out of the total planted. */
export interface Mutations {
  caught: number;
  total: number;
  points: MutationPoint[];
}

/** One item a row was measured on. `item` is the public id (B1, B2, …), stable across rows. */
export interface Item {
  item: string;
  label: string;
  minutes: number;
  cap: number;
  timedOut: boolean;
  turns: number | null;
  compactions: number | null;
  vram: number | null;
  speed: number | null;
  result: Verdict;
  newFails: number | null;
  mutations: Mutations | null;
  review: string;
  video?: string;
}

export interface Run {
  id: string;
  rent: number;
  date: string;
  isoDate: string;
  gpu: string;
  model: string;
  quant: string;
  ctx: number;
  card: boolean;
  loop: boolean;
  cost: number;
  best?: boolean;
  title: string;
  sum: string;
  tag?: string;
  stamp?: Verdict;
  stampText?: string;
  watch?: string;
  notes: string[];
  label?: string;
  verdict?: Verdict;
  items: Item[];
}

export type RoleState = "done" | "todo" | "hold";

export interface Tier {
  id: string;
  name: string;
  budget: string;
  buy?: number;
  machine: string[];
  mem: number;
  use: number;
  models: string[];
  roles: [string, RoleState][];
  watt?: number;
  rentUsd: number;
  rentName: string;
  note: string;
  now?: boolean;
  ref?: boolean;
}

export interface Meta {
  version: number;
  spentUsd: number;
  capUsd: number;
  asOf: string;
  usdThb: number;
  note: string;
}

export interface LadderLevel {
  level: string;
  means: string;
  test: string;
  status: string;
}

/** page.json: every piece of page text. Templates `{h}`, `{d}`, `{tiers}` are filled by the front. */
export interface Page {
  version: number;
  hero: { kicker: string; title: string; lead: string; byline: string };
  answer: { kicker: string; verdict: string; verdictEmphasis: string; modelCards: string[]; how: string };
  ladder: { title: string; levels: LadderLevel[]; note: string };
  clips: { kicker: string; title: string; note: string; noClip: string };
  /** missingNote: why rents 7–8 are not on /runs (Modio A3 c, served by TASK-066); optional, so an older back still loads. */
  history: { kicker: string; title: string; intro: string; missingNote?: string };
  compare: { kicker: string; title: string; note: string };
  spec: { title: string; rows: [string, string][] };
  plan: {
    kicker: string;
    title: string;
    lead: string;
    rateNote: string;
    kwhThb: number;
    paybackSayFast: string;
    paybackSaySlow: string;
    nextTitle: string;
    next: { kicker: string; title: string; body: string; cost: string }[];
    caveats: string[];
    sources: string;
  };
  behind: {
    kicker: string;
    title: string;
    tokens: {
      title: string;
      sub: string;
      lead: string;
      bars: { label: string; total: number; parts: Record<string, number> }[];
      scaleTokens: number;
      proved: string;
    };
    loop: {
      title: string;
      sub: string;
      lead: string;
      rounds: { title: string; did: string; review: string; accepted?: boolean }[];
      proved: string;
      chartNote: string;
    };
    gauge: { title: string; sub: string; note: string; cardMiB: number; comfort: number };
    findings: [string, string][];
    guards: [string, string][];
    guardsNote: string;
    next: { title: string; sub: string; body: string };
  };
  /** pack v3: the เทคนิค section's head and the Thai name of each technique group. */
  techniques: { kicker: string; title: string; intro: string; groups: Record<string, string> };
  /** pack v3.5/v3.6: plain-language content for readers who are not AI engineers (the เรื่องเล่า section, SPEC-006). */
  explain: { note?: string; glossary: GlossaryEntry[]; story: StoryChapter[] };
  footer: string;
}

/** `[term, plain Thai]` or `[term, plain Thai, aliases]`; term and aliases are spelled exactly as the page shows them. */
export type GlossaryEntry = [string, string] | [string, string, string[]];

/** `[when, title, plain Thai]`, in the order Modio tells the story. */
export type StoryChapter = [string, string, string];

/** One entry of techniques.json (pack v3.1). The English fields, `evidence` and `date` are for reference only. */
export interface Technique {
  id: string;
  group: string;
  name: string;
  nameTh: string;
  what: string;
  whatTh: string;
  model: string;
  metric: string;
  metricTh: string;
  before: string;
  /** May be missing in a pack (TEST-012 DEF-1): the card then draws no before → after and shows its other fields. */
  beforeTh?: string;
  after: string;
  afterTh?: string;
  gain: string;
  gainTh: string;
  evidence: string;
  evidenceTh: string;
  /** Exact runs.json row ids, `[]` when the technique has no exam row. */
  rows?: string[];
  date: string;
}

/** pack v3.9 meeting.json → fixtures: one synthetic meeting of the R-M1 study (never named by id on screen). */
export interface MeetingFixture {
  id: string;
  minutes: number;
  /** N: the action items in the meeting's answer key. */
  actions: number;
  asrSec?: number;
}

/** One way of working (arm) of R-M1. `found[fixtureId]`: null = no try finished (cut) or not run; shown as —. */
export interface MeetingArm {
  id: string;
  label?: string;
  labelTh: string;
  kind: "local" | "hybrid" | "talent";
  found: Record<string, number | null>;
  /** English notes on cut tries; never sent to the browser. */
  cut?: Record<string, string>;
  /** [finished, tries]. */
  done: [number, number];
  secShort?: number;
  secLong?: number;
  /** [lo, hi] USD per meeting. */
  usdPerMeeting: [number, number];
}

export interface MeetingCutRate {
  model: string;
  cut: number;
  calls: number;
}

/** pack v3.9 meeting.json (R-M1). The browser gets only SPEC-011 § Contract 3's fields (lib/lab/view.ts); the back
 * stores and serves it without `product` and `source`. The other optional keys are for reference only. */
export interface Meeting {
  id?: string;
  date: string;
  title?: string;
  titleTh: string;
  question?: string;
  questionTh: string;
  how?: string;
  howTh: string;
  costUsd: number;
  capUsd: number;
  cutWasteUsd: number;
  costNoteTh: string;
  fixtures: MeetingFixture[];
  arms: MeetingArm[];
  foundNote?: string;
  foundNoteTh?: string;
  cutRates: MeetingCutRate[];
  findings: { en?: string; th: string }[];
  next: { th: string; usd: number }[];
}

/** The body of `GET /api/lab` from pack v3 on. Keys the front does not know are ignored. */
export interface LabData {
  runs: Run[];
  tiers: Tier[];
  meta: Meta;
  page: Page;
  techniques: Technique[];
  /** pack v3.9 (SPEC-011): optional — a back without meeting.json sends null, and the page shows no R-M1 section. */
  meeting?: Meeting | null;
}
