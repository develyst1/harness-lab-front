import { describe, expect, test } from "bun:test";
import type { LabData } from "./types";
import { toView } from "./view";

// A pack-v3.1-shaped document with every field the pack carries (README § runs.json v2, Q4 table, meta.json, page.json,
// § Pack v3.1 techniques.json), plus made-up extra fields. Test data only; R5·B4's `review` and the technique's English
// fields and `evidence` stand in for the text that must not reach the browser.
const lab = {
  runs: [{
    id: "R5", rent: 5, date: "18 พ.ย.", isoDate: "2026-11-18", gpu: "A40 / A6000", model: "M", quant: "Q8", ctx: 128,
    card: true, loop: false, cost: 1.73, best: true, title: "t", sum: "s", tag: "g", stamp: "ok", stampText: "st", watch: "<b>w</b>",
    notes: ["n"], label: "l", verdict: "part", extraRow: "drop me",
    items: [{
      item: "B4", label: "il", minutes: 70, cap: 70, timedOut: true, turns: 120, compactions: 0, vram: 32966, speed: 11,
      result: "part", newFails: 0, review: "TEST REVIEW TEXT", video: "v.mp4", extraItem: "drop me",
      mutations: { caught: 7, total: 7, points: [{ label: "p1", caught: true, extraPoint: "drop me" }] },
    }],
  }],
  tiers: [{ id: "T1", now: true, name: "n", budget: "b", buy: 1, machine: ["m"], mem: 48, use: 32.2, models: ["x"],
    roles: [["r", "done"]], watt: 450, rentUsd: 0.69, rentName: "rn", note: "nt", ref: false, extraTier: "drop me" }],
  meta: { version: 2, spentUsd: 5.24, capUsd: 10, asOf: "2026-11-18", usdThb: 33.6, note: "team note", extraMeta: "drop me" },
  page: {
    version: 2,
    hero: { kicker: "k", title: "t", lead: "l", byline: "b", extraHero: "drop me" },
    answer: { kicker: "k", verdict: "v", verdictEmphasis: "e", modelCards: ["R5"], how: "h" },
    ladder: { title: "t", note: "n", levels: [{ level: "Junior", means: "m", test: "t", status: "now" }] },
    clips: { kicker: "k", title: "t", note: "n", noClip: "nc" },
    history: { kicker: "k", title: "t", intro: "i", missingNote: "mn" },
    compare: { kicker: "k", title: "t", note: "n" },
    spec: { title: "t", rows: [["a", "b"]] },
    plan: { kicker: "k", title: "t", lead: "l", rateNote: "r", kwhThb: 4.84, paybackSayFast: "f", paybackSaySlow: "s",
      nextTitle: "nt", next: [{ kicker: "k", title: "t", body: "b", cost: "c" }], caveats: ["c"], sources: "s" },
    behind: {
      kicker: "k", title: "t",
      tokens: { title: "t", sub: "s", lead: "l", bars: [{ label: "--bare", total: 944, parts: { system: 74, tools: 870 } }],
        scaleTokens: 65536, proved: "p" },
      loop: { title: "t", sub: "s", lead: "l", rounds: [{ title: "r", did: "d", review: "rv", accepted: true }], proved: "p",
        chartNote: "note to the team" },
      gauge: { title: "t", sub: "s", note: "n", cardMiB: 49140, comfort: 0.75 },
      findings: [["f", "d"]], guards: [["g", "d"]], guardsNote: "gn",
      next: { title: "nx", sub: "ns", body: "nb", extraNext: "drop me" },
    },
    techniques: { kicker: "k", title: "t", intro: "i", groups: { harness: "gh", process: "gp" }, extraTech: "drop me" },
    explain: { note: "NOTE TO THE TEAM", glossary: [["27B", "p1", ["284B"]], ["MTP", "p2"]], story: [["w", "t", "x MTP"]] },
    footer: "f",
  },
  techniques: [{
    id: "T07", group: "harness", name: "EN NAME", nameTh: "nth", what: "EN WHAT", whatTh: "WHAT TH", model: "mdl",
    metric: "EN METRIC", metricTh: "mth", before: "EN BEFORE", beforeTh: "bth", after: "EN AFTER", afterTh: "ath",
    gain: "EN GAIN", gainTh: "gth", evidence: "Modio's run log", evidenceTh: "eth", rows: ["R99", "R5"], date: "2026-11-19",
    extraTechnique: "drop me",
  }],
} as unknown as LabData;

const view = toView(lab);
const at = (o: unknown, path: string) => path.split(".").reduce<unknown>((v, k) => (v as Record<string, unknown>)?.[k], o);

// Every field a component reads (TASK-007 Implementation Notes: Answer, Ladder, Clips, History, Compare, Plan, Behind,
// Footer, the one-page wrapper (deleted in TASK-048) and lib/lab/{items,compare,plan,vram}). Written out here on purpose,
// not imported from view.ts.
const READ = [
  ...["id", "date", "gpu", "model", "quant", "ctx", "card", "loop", "cost", "best", "title", "sum", "tag", "stamp", "stampText",
    "watch", "notes", "label", "verdict"].map((f) => `runs.0.${f}`),
  ...["item", "label", "minutes", "cap", "timedOut", "compactions", "vram", "speed", "video", "mutations.caught",
    "mutations.total", "mutations.points.0.label", "mutations.points.0.caught"].map((f) => `runs.0.items.0.${f}`),
  ...["id", "now", "name", "budget", "buy", "machine", "mem", "use", "models", "roles", "watt", "rentUsd", "rentName", "note", "ref"]
    .map((f) => `tiers.0.${f}`),
  "meta.spentUsd", "meta.capUsd", "meta.usdThb",
  "page.hero.kicker", "page.hero.title", "page.hero.lead", "page.hero.byline",
  "page.answer.kicker", "page.answer.verdict", "page.answer.verdictEmphasis", "page.answer.modelCards", "page.answer.how",
  "page.ladder.title", "page.ladder.note", "page.ladder.levels.0.level", "page.ladder.levels.0.means",
  "page.ladder.levels.0.test", "page.ladder.levels.0.status",
  "page.clips.kicker", "page.clips.title", "page.clips.note", "page.clips.noClip",
  "page.history.kicker", "page.history.title", "page.history.intro", "page.history.missingNote",
  "page.compare.kicker", "page.compare.title", "page.compare.note",
  "page.spec.title", "page.spec.rows",
  ...["kicker", "title", "lead", "rateNote", "kwhThb", "paybackSayFast", "paybackSaySlow", "nextTitle", "caveats", "sources",
    "next.0.kicker", "next.0.title", "next.0.body", "next.0.cost"].map((f) => `page.plan.${f}`),
  ...["kicker", "title", "findings", "guards", "guardsNote", "tokens.title", "tokens.sub", "tokens.lead", "tokens.scaleTokens",
    "tokens.proved", "tokens.bars.0.label", "tokens.bars.0.total", "tokens.bars.0.parts", "loop.title", "loop.sub", "loop.lead",
    "loop.proved", "loop.rounds.0.title", "loop.rounds.0.did", "loop.rounds.0.review", "loop.rounds.0.accepted",
    "gauge.title", "gauge.sub", "gauge.note", "gauge.cardMiB", "gauge.comfort", "next.title", "next.sub", "next.body"]
    .map((f) => `page.behind.${f}`),
  "page.techniques.kicker", "page.techniques.title", "page.techniques.intro", "page.techniques.groups",
  "page.explain.story", "page.explain.glossary",
  ...["id", "group", "nameTh", "whatTh", "model", "metricTh", "beforeTh", "afterTh", "gainTh", "evidenceTh"].map((f) => `techniques.0.${f}`),
  "page.footer",
];

describe("toView — the browser gets only what the page shows", () => {
  test("R5·B4 keeps no `review` (nor turns, result, newFails)", () => {
    const item = at(view, "runs.0.items.0") as Record<string, unknown>;
    expect("review" in item).toBe(false);
    expect(["turns", "result", "newFails"].filter((k) => k in item)).toEqual([]);
    expect(JSON.stringify(view)).not.toContain("TEST REVIEW TEXT");
  });

  test("made-up fields on a row, an item, a point, a tier, meta and page.hero are dropped", () => {
    const json = JSON.stringify(view);
    expect(json).not.toContain("drop me");
  });

  test("unshown pack fields are dropped: rent, isoDate, meta.version/asOf/note, page.version, loop.chartNote", () => {
    expect([at(view, "runs.0.rent"), at(view, "runs.0.isoDate"), at(view, "meta.version"), at(view, "meta.asOf"),
      at(view, "meta.note"), at(view, "page.version"), at(view, "page.behind.loop.chartNote")]).toEqual(Array(7).fill(undefined));
  });

  test("every field a component reads survives, unchanged", () => {
    const lost = READ.filter((p) => JSON.stringify(at(view, p)) !== JSON.stringify(at(lab, p)) || at(view, p) === undefined);
    expect(lost).toEqual([]);
  });

  test("a technique keeps exactly the eleven fields the card shows (SPEC-003; whatTh by SPEC-004 § Round 2)", () => {
    expect(Object.keys(view.techniques[0]).sort()).toEqual(
      ["afterTh", "beforeTh", "evidenceTh", "gainTh", "group", "id", "metricTh", "model", "nameTh", "rows", "whatTh"],
    );
  });

  test("a technique's rows keep only ids that have a row on the page", () => {
    expect(view.techniques[0].rows).toEqual(["R5"]);
  });

  test("no technique name, `what`, English field, `evidence` or file name reaches the browser (REQ-003 req 5)", () => {
    const json = JSON.stringify(view);
    expect(['"evidence":', '"what":', "Modio's run log", "MODIO-LOG", ".jsonl", '.log"'].filter((s) => json.includes(s)))
      .toEqual([]);
    expect(["EN NAME", "EN WHAT", "EN METRIC", "EN BEFORE", "EN AFTER", "EN GAIN", "2026-11-19"].filter((s) => json.includes(s)))
      .toEqual([]);
    // `"name":` only over the techniques: tiers keep their `name`, which สเปกและงบ shows.
    expect(JSON.stringify(view.techniques)).not.toContain('"name":');
  });

  test("page.explain keeps exactly story and glossary; its note does not reach the browser (SPEC-006)", () => {
    expect(Object.keys(view.page.explain).sort()).toEqual(["glossary", "story"]);
    expect(JSON.stringify(view)).not.toContain("NOTE TO THE TEAM");
  });

  test("page.explain is a copy: changing the view leaves the back's document alone", () => {
    expect(view.page.explain.glossary).not.toBe(lab.page.explain.glossary);
    expect(view.page.explain.glossary[0][2]).not.toBe(lab.page.explain.glossary[0][2]);
    expect(view.page.explain.story[0]).not.toBe(lab.page.explain.story[0]);
  });

  test("a row's mutations: null stays null", () => {
    const nullMut = { ...lab, runs: [{ ...lab.runs[0], items: [{ ...lab.runs[0].items[0], mutations: null }] }] } as LabData;
    expect(toView(nullMut).runs[0].items[0].mutations).toBeNull();
  });
});

// pack v3.9 meeting.json, every key the pack carries plus made-up ones (SPEC-011 § Contract 3). Test data only: the
// English text, `product`, `source` and the fixture names stand in for what must not reach the browser.
const meeting = {
  id: "R-M1", date: "2026-11-23", product: "PRODUCT-REPO", title: "EN TITLE", titleTh: "tth", question: "EN QUESTION",
  questionTh: "qth", how: "EN HOW", howTh: "hth", costUsd: 5.48, capUsd: 6, cutWasteUsd: 2.42, costNoteTh: "cth",
  fixtures: [{ id: "mm-a", minutes: 4.1, actions: 5, asrSec: 42, extraFixture: "drop me" }],
  arms: [{ id: "L", label: "EN LABEL", labelTh: "lth", kind: "local", found: { "mm-a": null }, cut: { "mm-a": "EN CUT" },
    done: [4, 5], secShort: 143, usdPerMeeting: [0, 0], extraArm: "drop me" }],
  foundNote: "EN NOTE", foundNoteTh: "NOTE TH", cutRates: [{ model: "m", cut: 7, calls: 13, extraCut: "drop me" }],
  earsVsBrain: { local: { asr: [2], gold: [2] } }, findings: [{ en: "EN FINDING", th: "fth" }],
  next: [{ th: "nth", usd: 0.1, extraNext: "drop me" }], source: "SOURCE/PATH",
};

describe("toView — meeting (SPEC-011 § Contract 3)", () => {
  const mv = toView({ ...lab, meeting } as unknown as LabData).meeting!;

  test("exactly the contract's fields, at every level", () => {
    expect(Object.keys(mv).sort()).toEqual(["arms", "capUsd", "costNoteTh", "costUsd", "cutRates", "cutWasteUsd", "date",
      "findings", "fixtures", "howTh", "next", "questionTh", "titleTh"]);
    expect(Object.keys(mv.fixtures[0]).sort()).toEqual(["actions", "id", "minutes"]);
    expect(Object.keys(mv.arms[0]).sort()).toEqual(["done", "found", "id", "kind", "labelTh", "secShort", "usdPerMeeting"]);
    expect(Object.keys(mv.cutRates[0]).sort()).toEqual(["calls", "cut", "model"]);
    expect(Object.keys(mv.findings[0])).toEqual(["th"]);
    expect(Object.keys(mv.next[0]).sort()).toEqual(["th", "usd"]);
  });

  test("a null in found stays null (shown as —), values unchanged", () => {
    expect(mv.arms[0].found).toEqual({ "mm-a": null });
    expect(mv.arms[0].done).toEqual([4, 5]);
    expect(mv.costUsd).toBe(5.48);
  });

  test("no product, source, English text, legend note or made-up field reaches the browser (req 6)", () => {
    const json = JSON.stringify(mv);
    expect(["PRODUCT-REPO", "SOURCE/PATH", "EN TITLE", "EN QUESTION", "EN HOW", "EN LABEL", "EN CUT", "EN NOTE", "NOTE TH",
      "EN FINDING", "drop me", "asrSec", "earsVsBrain", '"R-M1"'].filter((s) => json.includes(s))).toEqual([]);
  });

  test("no meeting in the back's body → null; the other five keys are as before", () => {
    expect(toView(lab).meeting).toBeNull();
  });
});
