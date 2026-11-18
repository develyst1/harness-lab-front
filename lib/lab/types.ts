// Shapes of Modio's data pack v2 as served by `GET /api/lab` (SPEC-001 § Pack v2; pack README § runs.json v2,
// § meta.json, § page.json and the Q4 item table). Field names are the pack's, never renamed.

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
  history: { kicker: string; title: string; intro: string };
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
  footer: string;
}

/** The body of `GET /api/lab` from pack v2 on. Keys the front does not know are ignored. */
export interface LabData {
  runs: Run[];
  tiers: Tier[];
  meta: Meta;
  page: Page;
}
