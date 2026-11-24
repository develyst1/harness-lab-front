import { evidenceRows } from "./techniques";
import type { Item, LabData, Meeting, Meta, Page, Run, Technique, Tier } from "./types";

// The page passes the browser only what it shows (TASK-007). Next serialises every prop of a client component into the
// served HTML, shown or not, so each page hands its components this copy (then its own slice, lib/lab/site.ts) instead of
// the back's whole document.
// A whitelist, not a blacklist: a new pack field stays on the server until a component reads it and it is added here.
// Dropped on purpose (no component reads them): Run.rent, Run.isoDate · Item.turns, .result, .newFails, .review ·
// Meta.version, .asOf, .note · Page.version, Page.behind.loop.chartNote · Technique.name, .what and the English fields
// (.metric, .before, .after, .gain), .evidence, .date (SPEC-003: only the Thai text, `rows` and `evidenceTh`; `.whatTh`
// is sent since SPEC-004 § Round 2, REQ-004 AC-11) · Page.explain.note (SPEC-006: the story and the glossary are sent).
// Their types stay in types.ts, so the result is returned as LabData by one cast below; view.test.ts lists the fields
// that must survive.

function pick<T extends object, K extends keyof T>(o: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) if (o[k] !== undefined) out[k] = o[k];
  return out;
}

const RUN = ["id", "date", "gpu", "model", "quant", "ctx", "card", "loop", "cost", "best", "title", "sum", "tag", "stamp",
  "stampText", "watch", "notes", "label", "verdict"] as const satisfies readonly (keyof Run)[];
const ITEM = ["item", "label", "minutes", "cap", "timedOut", "compactions", "vram", "speed", "video"] as const satisfies
  readonly (keyof Item)[];
const TIER = ["id", "now", "ref", "name", "budget", "buy", "machine", "mem", "use", "models", "roles", "watt", "rentUsd",
  "rentName", "note"] as const satisfies readonly (keyof Tier)[];
const META = ["spentUsd", "capUsd", "usdThb"] as const satisfies readonly (keyof Meta)[];
const TECHNIQUE = ["id", "group", "nameTh", "whatTh", "model", "metricTh", "beforeTh", "afterTh", "gainTh",
  "evidenceTh"] as const satisfies readonly (keyof Technique)[];

const item = (i: Item) => ({
  ...pick(i, ITEM),
  mutations: i.mutations && {
    caught: i.mutations.caught,
    total: i.mutations.total,
    points: i.mutations.points.map((p) => ({ label: p.label, caught: p.caught })),
  },
});

const run = (r: Run) => ({ ...pick(r, RUN), items: r.items.map(item) });

const page = (p: Page) => {
  const b = p.behind;
  return {
    hero: pick(p.hero, ["kicker", "title", "lead", "byline"]),
    answer: pick(p.answer, ["kicker", "verdict", "verdictEmphasis", "modelCards", "how"]),
    ladder: { title: p.ladder.title, note: p.ladder.note, levels: p.ladder.levels.map((l) => pick(l, ["level", "means", "test", "status"])) },
    clips: pick(p.clips, ["kicker", "title", "note", "noClip"]),
    history: pick(p.history, ["kicker", "title", "intro"]),
    compare: pick(p.compare, ["kicker", "title", "note"]),
    spec: pick(p.spec, ["title", "rows"]),
    plan: {
      ...pick(p.plan, ["kicker", "title", "lead", "rateNote", "kwhThb", "paybackSayFast", "paybackSaySlow", "nextTitle", "caveats", "sources"]),
      next: p.plan.next.map((n) => pick(n, ["kicker", "title", "body", "cost"])),
    },
    behind: {
      ...pick(b, ["kicker", "title", "findings", "guards", "guardsNote"]),
      tokens: {
        ...pick(b.tokens, ["title", "sub", "lead", "scaleTokens", "proved"]),
        bars: b.tokens.bars.map((x) => ({ label: x.label, total: x.total, parts: { ...x.parts } })),
      },
      loop: {
        ...pick(b.loop, ["title", "sub", "lead", "proved"]),
        rounds: b.loop.rounds.map((r) => pick(r, ["title", "did", "review", "accepted"])),
      },
      gauge: pick(b.gauge, ["title", "sub", "note", "cardMiB", "comfort"]),
      next: pick(b.next, ["title", "sub", "body"]),
    },
    techniques: { ...pick(p.techniques, ["kicker", "title", "intro"]), groups: { ...p.techniques.groups } },
    explain: {
      story: p.explain.story.map((c) => [...c]),
      glossary: p.explain.glossary.map((g) => (g[2] ? [g[0], g[1], [...g[2]]] : [g[0], g[1]])),
    },
    footer: p.footer,
  };
};

// R-M1 (SPEC-011 § Contract 3): never `id`, `title`, `question`, `how`, `product`, `source`, `foundNote(Th)`,
// `earsVsBrain`, an arm's `label` or `cut`, a finding's `en` or a fixture's `asrSec`.
const meeting = (m: Meeting) => ({
  ...pick(m, ["titleTh", "questionTh", "howTh", "costUsd", "capUsd", "cutWasteUsd", "costNoteTh", "date"]),
  fixtures: m.fixtures.map((f) => pick(f, ["id", "minutes", "actions"])),
  arms: m.arms.map((a) => ({
    ...pick(a, ["id", "labelTh", "kind", "secShort", "secLong"]),
    found: { ...a.found },
    done: [...a.done],
    usdPerMeeting: [...a.usdPerMeeting],
  })),
  cutRates: m.cutRates.map((c) => pick(c, ["model", "cut", "calls"])),
  findings: m.findings.map((f) => ({ th: f.th })),
  next: m.next.map((n) => pick(n, ["th", "usd"])),
});

/** A copy of the back's document holding only the fields the page shows. */
export function toView(lab: LabData): LabData {
  return {
    runs: lab.runs.map(run),
    tiers: lab.tiers.map((t) => pick(t, TIER)),
    meta: pick(lab.meta, META),
    page: page(lab.page),
    techniques: lab.techniques.map((t) => ({ ...pick(t, TECHNIQUE), rows: evidenceRows(t.rows, lab.runs) })),
    meeting: lab.meeting ? meeting(lab.meeting) : null,
  } as unknown as LabData;
}
