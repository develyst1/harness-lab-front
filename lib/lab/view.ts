import type { Item, LabData, Meta, Page, Run, Tier } from "./types";

// The page passes the browser only what it shows (TASK-007). Next serialises every prop of a client component into the
// served HTML, shown or not, so `app/page.tsx` hands `LabContent` this copy instead of the back's whole document.
// A whitelist, not a blacklist: a new pack field stays on the server until a component reads it and it is added here.
// Dropped on purpose (no component reads them): Run.rent, Run.isoDate · Item.turns, .result, .newFails, .review ·
// Meta.version, .asOf, .note · Page.version, Page.behind.loop.chartNote. Their types stay in types.ts, so the result is
// returned as LabData by one cast below; view.test.ts lists the fields that must survive.

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
    footer: p.footer,
  };
};

/** A copy of the back's document holding only the fields the page shows. */
export function toView(lab: LabData): LabData {
  return {
    runs: lab.runs.map(run),
    tiers: lab.tiers.map((t) => pick(t, TIER)),
    meta: pick(lab.meta, META),
    page: page(lab.page),
  } as unknown as LabData;
}
