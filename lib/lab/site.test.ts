import { describe, expect, test } from "bun:test";
import { MEETING_GLOSSARY } from "./meetingGlossary";
import {
  aboutView, clipsView, compareView, glossaryView, hardwareView, homeHref, homeParams, homeView, latestRun, neighbours, oldAnchorTarget, parseSort,
  parseTab, runsView, runView, searchHits, searchIndex, sortRuns, storyView, studiesView, studyBars, studyView, techniquesView,
  techniqueView, techReadout,
} from "./site";
import { groupName } from "./techniques";
import type { LabData, Run } from "./types";

// lib/lab/site.ts (SPEC-012 § Conventions, § The comp): what each comp page gets, and the URL's ?tab= / ?sort=. Test
// data only: made-up runs in the pack's shape.
const run = (id: string, isoDate: string, cost: number, title = `title ${id}`): Run =>
  ({ id, isoDate, cost, title, date: isoDate.slice(5), rent: 1, gpu: "g", model: "m", quant: "q", ctx: 1, card: false,
    loop: false, best: false, sum: "s", tag: "t", stamp: "ok", stampText: "st", watch: "w", notes: [], label: "l",
    verdict: "ok", items: [] }) as Run;
const runs = [run("R1", "2026-11-17", 0.54), run("R2", "2026-11-17", 0.84), run("R4a", "2026-11-18", 0.91),
  run("R4b", "2026-11-18", 0.44), run("R10", "2026-11-22", 0.83, "harness ของเราเอง")];

describe("parseTab — ?tab= (SPEC-012: summary | items | clips, default summary)", () => {
  test("a known tab is kept", () => {
    expect(parseTab("summary")).toBe("summary");
    expect(parseTab("items")).toBe("items");
    expect(parseTab("clips")).toBe("clips");
  });

  test("unknown, empty, missing or a different case → summary; a repeated param takes the first", () => {
    for (const v of ["bogus", "", undefined, "Items", "clips "]) expect(parseTab(v)).toBe("summary");
    expect(parseTab(["items", "clips"])).toBe("items");
    expect(parseTab([])).toBe("summary");
  });
});

describe("parseSort and sortRuns — ?sort= on the platform's runs strip (date | cost, default date)", () => {
  test("parseSort: date or cost; anything else → date", () => {
    expect(parseSort("cost")).toBe("cost");
    expect(parseSort("date")).toBe("date");
    for (const v of ["price", undefined, "", ["cost"]]) expect(parseSort(v)).toBe(v?.[0] === "cost" ? "cost" : "date");
  });

  test("date: newest first, a same-day pair newest in pack order first; cost: cheapest first", () => {
    expect(sortRuns(runs, "date").map((r) => r.id)).toEqual(["R10", "R4b", "R4a", "R2", "R1"]);
    expect(sortRuns(runs, "cost").map((r) => r.id)).toEqual(["R4b", "R1", "R10", "R2", "R4a"]);
    expect(runs.map((r) => r.id)).toEqual(["R1", "R2", "R4a", "R4b", "R10"]); // the input is not changed
  });
});

describe("latestRun and neighbours", () => {
  test("latest: the newest isoDate, the later in pack order on a tie; none → undefined", () => {
    expect(latestRun(runs)?.id).toBe("R10");
    expect(latestRun(runs.slice(0, 2))?.id).toBe("R2");
    expect(latestRun([])).toBeUndefined();
  });

  test("prev/next in pack order; the ends have none; an unknown id has none", () => {
    expect(neighbours(runs, "R4a")).toEqual({ prev: "R2", next: "R4b" });
    expect(neighbours(runs, "R1")).toEqual({ prev: null, next: "R2" });
    expect(neighbours(runs, "R10")).toEqual({ prev: "R4b", next: null });
    expect(neighbours(runs, "R99")).toEqual({ prev: null, next: null });
  });
});

describe("search — titles only, runs and techniques (the platform's home extra)", () => {
  const index = searchIndex(runs, [{ id: "T19", nameTh: "ในเครื่องจด แล้วให้สมองเสริมตรวจ" }, { id: "T05", nameTh: "MTP" }] as never);

  test("the index holds each run's id + title and each technique's id + nameTh, nothing else", () => {
    expect(index[4]).toEqual({ kind: "run", id: "R10", title: "harness ของเราเอง" });
    expect(index[5]).toEqual({ kind: "technique", id: "T19", title: "ในเครื่องจด แล้วให้สมองเสริมตรวจ" });
    expect(index.length).toBe(7);
  });

  test("a query matches the id or the title, ignoring case and outer spaces; blank → no hits", () => {
    expect(searchHits(index, "r10").map((h) => h.id)).toEqual(["R10"]);
    expect(searchHits(index, " mtp ").map((h) => h.id)).toEqual(["T05"]);
    expect(searchHits(index, "สมองเสริม").map((h) => h.id)).toEqual(["T19"]);
    expect(searchHits(index, "R4").map((h) => h.id)).toEqual(["R4a", "R4b"]);
    expect(searchHits(index, "   ")).toEqual([]);
    expect(searchHits(index, "zzz")).toEqual([]);
  });
});

// A served body as toView gives it, with the fields each page must not carry.
const lab = {
  runs,
  tiers: [{ id: "T1" }, { id: "T2" }],
  meta: { spentUsd: 9.08 },
  page: {
    hero: { kicker: "k", title: "t", lead: "l", byline: "b" },
    answer: { kicker: "ak", verdict: "v", verdictEmphasis: "", modelCards: ["R4a", "R99"], how: "h" },
    ladder: { title: "lt", note: "ln", levels: [] },
    behind: { kicker: "bk", gauge: { title: "gt", sub: "", note: "", cardMiB: 49140, comfort: 0.75 }, findings: [["f", "d"]] },
    clips: { kicker: "ck", title: "ct", note: "cn", noClip: "nc" },
    history: { kicker: "hk", title: "ht", intro: "hi" },
    explain: { glossary: [["a", "b"], ["c", "d"]], story: [["w1", "บทแรก", "TEXT ONE"], ["w2", "บทสอง", "TEXT TWO"]] },
    footer: "f",
    plan: { lead: "PLAN LEAD" },
  },
  techniques: [{ id: "T19", nameTh: "n19", whatTh: "WHAT" }],
  meeting: { titleTh: "mt", questionTh: "mq", howTh: "HOW", arms: [], fixtures: [], findings: [], next: [], cutRates: [] },
} as unknown as LabData;

describe("homeView — the home page's slice (a whitelist)", () => {
  const v = homeView(lab);

  test("hero, the 7-chapter story block as titles only, the Answer's cards and its three page parts", () => {
    expect(v.hero).toEqual({ kicker: "k", title: "t", lead: "l", byline: "b" });
    expect(v.story).toEqual([["w1", "บทแรก"], ["w2", "บทสอง"]]);
    expect(v.answer.cards.map((r) => r.id)).toEqual(["R4a"]);
    expect(Object.keys(v.answer.page).sort()).toEqual(["answer", "behind", "ladder"]);
    expect(Object.keys(v.answer.page.behind)).toEqual(["gauge"]);
  });

  test("the latest run, the study's title and question, the doors' counts", () => {
    expect(v.latest?.id).toBe("R10");
    expect(v.study).toEqual({ titleTh: "mt", questionTh: "mq" });
    expect(v.counts).toEqual({ runs: 5, techniques: 1, studies: 1, clips: 0, story: 2, glossary: 2 + MEETING_GLOSSARY.length, tiers: 2 });
    expect(homeView({ ...lab, meeting: null }).study).toBeNull();
    expect(homeView({ ...lab, meeting: null }).counts.glossary).toBe(2);
  });

  test("the platform's runs strip and search index carry only id, title, date, isoDate, cost", () => {
    expect(Object.keys(v.strip[0]).sort()).toEqual(["cost", "date", "id", "isoDate", "title"]);
    expect(v.search.length).toBe(6);
  });

  test("nothing else of the body reaches the page: no story text, no plan, no technique text, no meeting how", () => {
    const json = JSON.stringify(v);
    expect(["TEXT ONE", "PLAN LEAD", "WHAT", "HOW", '"findings":[["f"'].filter((s) => json.includes(s))).toEqual([]);
  });
});

describe("runView — one run's slice; an unknown id → null (notFound)", () => {
  test("the run, the clip words, and every run as id + title + date (the platform's sidebar), with prev/next", () => {
    const v = runView(lab, "R4a")!;
    expect(v.run.id).toBe("R4a");
    expect(v.clips).toEqual({ kicker: "ck", title: "ct", note: "cn", noClip: "nc" });
    expect(v.gauge).toEqual({ title: "gt", sub: "", note: "", cardMiB: 49140, comfort: 0.75 });
    expect(v.all.map((r) => Object.keys(r).sort().join(","))).toEqual(Array(5).fill("date,id,title"));
    expect(v.near).toEqual({ prev: "R2", next: "R4b" });
    expect(JSON.stringify(v)).not.toContain("TEXT ONE");
  });

  test("unknown or different-case id → null", () => {
    expect(runView(lab, "R99")).toBeNull();
    expect(runView(lab, "r10")).toBeNull();
  });
});

describe("runsView — /runs's slice (SPEC-012 D2, D9): today's ประวัติ heading and each run's entry header", () => {
  const v = runsView(lab);

  test("the back's missingNote (TASK-066) comes through when it is sent, and is simply absent when not (TASK-058 Q4)", () => {
    const withNote = { ...lab, page: { ...lab.page, history: { ...lab.page.history, missingNote: "mn" } } };
    expect(runsView(withNote).history.missingNote).toBe("mn");
    expect("missingNote" in runsView(lab).history).toBe(false);
  });

  test("the heading is history's kicker, title and intro; every run is there, in pack order", () => {
    expect(v.history).toEqual({ kicker: "hk", title: "ht", intro: "hi" });
    expect(v.runs.map((r) => r.id)).toEqual(["R1", "R2", "R4a", "R4b", "R10"]);
  });

  test("a row carries only what the entry header shows: id, date, title, the machine line's parts, the pill, the sort keys", () => {
    expect(Object.keys(v.runs[0]).sort()).toEqual(
      ["card", "cost", "ctx", "date", "gpu", "id", "isoDate", "label", "loop", "minutes", "model", "quant", "title", "verdict"].sort(),
    );
    const json = JSON.stringify(v);
    expect(["\"sum\"", "\"notes\"", "\"items\"", "\"watch\"", "TEXT ONE", "PLAN LEAD"].filter((s) => json.includes(s))).toEqual([]);
  });

  test("minutes: the run's time over all its items (TASK-057's bar), 0 for a run with none", () => {
    const withItems = { ...lab, runs: [{ ...runs[0]!, items: [{ minutes: 35 }, { minutes: 70 }, { minutes: 41 }] }] } as unknown as LabData;
    expect(runsView(withItems).runs[0]!.minutes).toBe(146);
    expect(v.runs[0]!.minutes).toBe(0);
  });
});

describe("clipsView — /clips's slice (SPEC-012 D9): every run for the player, and only page.clips", () => {
  test("the runs (the player's tabs come from their items) and the clip words; no other page part", () => {
    const v = clipsView(lab);
    expect(v.runs.map((r) => r.id)).toEqual(["R1", "R2", "R4a", "R4b", "R10"]);
    expect(v.clips).toEqual({ kicker: "ck", title: "ct", note: "cn", noClip: "nc" });
    expect(Object.keys(v).sort()).toEqual(["clips", "runs"]);
    expect(JSON.stringify(v)).not.toContain("TEXT ONE");
  });
});

// TASK-048's pages read page.techniques and page.compare, and techniques with a group: a body that has them.
const techLab = {
  ...lab,
  techniques: [
    { id: "T01", group: "speed", nameTh: "n1", whatTh: "w1", rows: ["R1"] },
    { id: "T02", group: "card", nameTh: "n2", whatTh: "w2" },
    { id: "T03", group: "speed", nameTh: "n3", whatTh: "w3" },
    { id: "T04", group: "loop", nameTh: "n4", whatTh: "w4" },
  ],
  page: {
    ...lab.page,
    techniques: { kicker: "tk", title: "tt", intro: "ti", groups: { speed: "เร็ว", card: "การ์ด" } },
    compare: { kicker: "cok", title: "cot", note: "con" },
  },
} as unknown as LabData;

describe("techniquesView — /techniques's slice (grouped by group, SPEC-012 § Site map)", () => {
  const v = techniquesView(techLab);

  test("the section head; one block per group in the order each first appears, named as the card names it", () => {
    expect(v.head).toEqual({ kicker: "tk", title: "tt", intro: "ti", groups: { speed: "เร็ว", card: "การ์ด" } });
    expect(v.groups.map((g) => [g.group, g.name, g.techniques.map((t) => t.id)])).toEqual([
      ["speed", "เร็ว", ["T01", "T03"]],
      ["card", "การ์ด", ["T02"]],
      ["loop", groupName(v.head.groups, "loop"), ["T04"]],
    ]);
  });

  test("every technique once; no other page part", () => {
    expect(v.groups.flatMap((g) => g.techniques).length).toBe(4);
    expect(Object.keys(v).sort()).toEqual(["groups", "head"]);
    expect(JSON.stringify(v)).not.toContain("TEXT ONE");
  });
});

describe("techReadout — /techniques' readout: the techniques it can draw, in group order (TASK-056)", () => {
  const tech = (id: string, beforeTh: string, afterTh: string) =>
    ({ id, group: "g", nameTh: id, whatTh: "w", model: "m", metricTh: "token ก่อนเริ่มงาน", beforeTh, afterTh, gainTh: "g", evidenceTh: "e" }) as never;
  const groups = [
    { group: "a", name: "A", techniques: [tech("T02", "ไม่มีเลข", "ไม่มีเลข"), tech("T01", "~17,100 (โหมดเต็ม)", "~944 (--bare)")] },
    { group: "b", name: "B", techniques: [tech("T04", "3/4", "4/4")] },
  ];

  test("only techniques with a drawable number, in group then pack order, with the values techViz reads", () => {
    const r = techReadout(groups);
    expect(r.map((x) => x.t.id)).toEqual(["T01", "T04"]);
    expect(r[0]!.pairs[0]!.before.value).toBe(17100);
    expect(r[1]!.pairs[0]!.after).toMatchObject({ value: 4, of: 4 });
  });

  test("a technique whose words changed drops out of the readout (its card then shows the words)", () => {
    expect(techReadout([{ group: "a", name: "A", techniques: [tech("T01", "~17,000 (โหมดเต็ม)", "~944 (--bare)")] }])).toEqual([]);
  });
});

describe("techniqueView — /techniques/[id]'s slice; an unknown id → null (notFound)", () => {
  test("the technique and the section head (the card names its group from it)", () => {
    const v = techniqueView(techLab, "T03")!;
    expect(v.technique.id).toBe("T03");
    expect(v.head.groups).toEqual({ speed: "เร็ว", card: "การ์ด" });
    expect(Object.keys(v).sort()).toEqual(["head", "technique"]);
  });

  test("unknown or different-case id → null", () => {
    expect(techniqueView(techLab, "T99")).toBeNull();
    expect(techniqueView(techLab, "t03")).toBeNull();
  });
});

describe("compareView — /compare's slice: today's Compare props, and nothing else", () => {
  test("every run, page.compare's three keys, the card's MiB", () => {
    const v = compareView(techLab);
    expect(v.runs.map((r) => r.id)).toEqual(["R1", "R2", "R4a", "R4b", "R10"]);
    expect(v.compare).toEqual({ kicker: "cok", title: "cot", note: "con" });
    expect(v.cardMiB).toBe(49140);
    expect(Object.keys(v).sort()).toEqual(["cardMiB", "compare", "runs"]);
  });
});

describe("studiesView and studyView — /studies and /studies/r-m1 (REQ-010 Contract 3 for the study)", () => {
  test("/studies: one card per study (id, title, question, its headline bars); none when the back sends no meeting", () => {
    expect(studiesView(lab)).toEqual({ studies: [{ id: "r-m1", titleTh: "mt", questionTh: "mq", bars: [] }] });
    expect(studiesView({ ...lab, meeting: null })).toEqual({ studies: [] });
  });

  test("/studies/r-m1: the meeting and the page glossary, as Meeting.tsx takes them", () => {
    const v = studyView(lab, "r-m1")!;
    expect(v.meeting).toBe(lab.meeting!);
    expect(v.glossary).toEqual([["a", "b"], ["c", "d"]]);
    expect(Object.keys(v).sort()).toEqual(["glossary", "meeting"]);
  });

  test("any other id, a different case, or no meeting → null", () => {
    expect(studyView(lab, "x")).toBeNull();
    expect(studyView(lab, "R-M1")).toBeNull();
    expect(studyView({ ...lab, meeting: null }, "r-m1")).toBeNull();
  });
});

describe("studyBars — the study's headline as bars (TASK-058): the first arm of each kind × every meeting", () => {
  const arm = (id: string, kind: "local" | "hybrid" | "talent", found: Record<string, number | null>) =>
    ({ id, kind, labelTh: `label ${id}`, found, done: [1, 1], secShort: 1, secLong: null, usdPerMeeting: [0, 0] }) as never;
  const meeting = {
    fixtures: [{ id: "a", minutes: 4.1, actions: 5, asrSec: 1 }, { id: "b", minutes: 56.4, actions: 42, asrSec: 1 }],
    arms: [arm("L", "local", { a: 2, b: null }), arm("H1", "hybrid", { a: 5 }), arm("H2", "hybrid", { a: 4, b: 1 }),
      arm("T1", "talent", { a: 5, b: 38 })],
  } as never;
  test("one row per kind, in pack order (the visual's arms); one cell per meeting, in fixture order", () => {
    const rows = studyBars(meeting);
    expect(rows.map((r) => [r.id, r.label])).toEqual([["L", "label L"], ["H1", "label H1"], ["T1", "label T1"]]);
    expect(rows[0].cells.map((c) => c.key)).toEqual(["a", "b"]);
  });
  test("each cell: the display rules' text, share and heading; null or missing → — and no bar", () => {
    const [l, h, t] = studyBars(meeting);
    expect(l.cells[0]).toEqual({ key: "a", heading: "4.1 นาที · 5 งาน", share: 0.4, text: "2/5" });
    expect(l.cells[1]).toEqual({ key: "b", heading: "56.4 นาที · 42 งาน", share: null, text: "—" });
    expect(h.cells[1]).toEqual({ key: "b", heading: "56.4 นาที · 42 งาน", share: null, text: "—" });
    expect(t.cells[1].text).toBe("38/42");
  });
});

describe("storyView — /story's slice: the chapters and the page glossary their taps match (SPEC-012 D5)", () => {
  test("explain's story and glossary, nothing else of the page", () => {
    const v = storyView(lab);
    expect(v.explain.story).toEqual([["w1", "บทแรก", "TEXT ONE"], ["w2", "บทสอง", "TEXT TWO"]]);
    expect(v.explain.glossary).toEqual([["a", "b"], ["c", "d"]]);
    expect(Object.keys(v)).toEqual(["explain"]);
    expect(Object.keys(v.explain).sort()).toEqual(["glossary", "story"]);
    expect(JSON.stringify(v)).not.toContain("PLAN LEAD");
  });
});

// The case TASK-048 Q2 dropped from view.test.ts (SPEC-011 R3, AC-8 glossary count), now on /glossary.
describe("glossaryView — /glossary: the page's entries, then MEETING_GLOSSARY when the meeting is present, numbered on", () => {
  test("with the meeting: the page's 2, then the 11 new ones, ids term-1 … term-13 in order", () => {
    const v = glossaryView(lab);
    expect(v.terms.length).toBe(2 + MEETING_GLOSSARY.length);
    expect(v.terms.map((t) => t.id)).toEqual(Array.from({ length: 2 + MEETING_GLOSSARY.length }, (_, i) => `term-${i + 1}`));
    expect(v.terms.slice(0, 2)).toEqual([{ id: "term-1", name: "a", plain: "b" }, { id: "term-2", name: "c", plain: "d" }]);
    expect(v.terms[2].name).toBe("สมองเสริม, talent");
    expect(v.terms[12].name).toBe("… ล้วน (สมองเสริม)");
  });

  test("REQ-012 (TASK-055): the terms in two groups, the page's then the study's (titled by the study), same ids", () => {
    const v = glossaryView(lab);
    expect(v.groups.map((g) => [g.key, g.studyTitle ?? null, g.terms.length])).toEqual([
      ["lab", null, 2],
      ["study", lab.meeting!.titleTh, MEETING_GLOSSARY.length],
    ]);
    expect(v.groups.flatMap((g) => g.terms)).toEqual(v.terms);
    expect(glossaryView({ ...lab, meeting: null }).groups.map((g) => g.key)).toEqual(["lab"]);
  });

  test("without the meeting: the page's entries only; aliases follow the term, comma-joined", () => {
    expect(glossaryView({ ...lab, meeting: null }).terms.map((t) => t.id)).toEqual(["term-1", "term-2"]);
    const aliased = { ...lab, meeting: null, page: { ...lab.page, explain: { ...lab.page.explain, glossary: [["a", "b", ["x", "y"]], ["c", "d"]] } } } as unknown as LabData;
    expect(glossaryView(aliased).terms[0]).toEqual({ id: "term-1", name: "a, x, y", plain: "b" });
  });
});

describe("hardwareView and aboutView — today's Plan and Behind props, page cut to the keys each reads", () => {
  const full = { ...lab, page: { ...lab.page, spec: { title: "st", rows: [] }, plan: { lead: "PLAN LEAD", title: "pt" } } } as unknown as LabData;

  test("/hardware: tiers, meta, and page.plan + page.spec only", () => {
    const v = hardwareView(full);
    expect(v.tiers).toEqual([{ id: "T1" }, { id: "T2" }] as never);
    expect(v.meta).toEqual({ spentUsd: 9.08 } as never);
    expect(Object.keys(v.page).sort()).toEqual(["plan", "spec"]);
  });

  test("/about: every run, meta, and page.behind only", () => {
    const v = aboutView(full);
    expect(v.runs.map((r) => r.id)).toEqual(["R1", "R2", "R4a", "R4b", "R10"]);
    expect(v.meta).toEqual({ spentUsd: 9.08 } as never);
    expect(Object.keys(v.page)).toEqual(["behind"]);
    expect(JSON.stringify(v)).not.toContain("PLAN LEAD");
  });
});

describe("homeParams — reading / 's URL (SPEC-012 D1)", () => {
  test("q as given (\"\" when absent, the first when repeated); sort only when the URL has one, parsed", () => {
    expect(homeParams({})).toEqual({ q: "" });
    expect("sort" in homeParams({ q: "R1" })).toBe(false);
    expect(homeParams({ q: "R1", sort: "cost" })).toEqual({ q: "R1", sort: "cost" });
    expect(homeParams({ q: ["a", "b"], sort: "bogus" })).toEqual({ q: "a", sort: "date" });
    expect(homeParams({ sort: "" })).toEqual({ q: "", sort: "date" });
  });
});

describe("homeHref — the home's URL state (SPEC-012 D1: ?q= from the search box, ?sort= from the strip)", () => {
  test("no q and no sort → /; an empty q is dropped; q before sort", () => {
    expect(homeHref("")).toBe("/");
    expect(homeHref("R1")).toBe("/?q=R1");
    expect(homeHref("", "cost")).toBe("/?sort=cost");
    expect(homeHref("R1", "cost")).toBe("/?q=R1&sort=cost");
    expect(homeHref("R1", "date")).toBe("/?q=R1&sort=date");
  });

  test("a q with spaces or Thai reads back as typed", () => {
    const url = new URL(homeHref("ซ้ำ ๆ & R1", "date"), "http://x");
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("q")).toBe("ซ้ำ ๆ & R1");
    expect(url.searchParams.get("sort")).toBe("date");
  });
});

describe("oldAnchorTarget — the old one-page links (SPEC-012 § Conventions, the redirect map)", () => {
  test("each section hash goes to its page", () => {
    expect(oldAnchorTarget("#story")).toBe("/story");
    expect(oldAnchorTarget("#behind")).toBe("/about");
    expect(oldAnchorTarget("#clips")).toBe("/clips");
    expect(oldAnchorTarget("#history")).toBe("/runs");
    expect(oldAnchorTarget("#meeting")).toBe("/studies/r-m1");
    expect(oldAnchorTarget("#compare")).toBe("/compare");
    expect(oldAnchorTarget("#techniques")).toBe("/techniques");
    expect(oldAnchorTarget("#plan")).toBe("/hardware");
  });

  test("#run-<id> → /runs/<id> for any id (the run page 404s an unknown one); #term-<n> → /glossary#term-<n>", () => {
    expect(oldAnchorTarget("#run-R3")).toBe("/runs/R3");
    expect(oldAnchorTarget("#run-R4a")).toBe("/runs/R4a");
    expect(oldAnchorTarget("#run-R99")).toBe("/runs/R99");
    expect(oldAnchorTarget("#run-a%20b")).toBe("/runs/a%20b");
    expect(oldAnchorTarget("#run-../about")).toBe("/runs/..%2Fabout"); // the target stays under /runs/
    expect(oldAnchorTarget("#term-1")).toBe("/glossary#term-1");
    expect(oldAnchorTarget("#term-27")).toBe("/glossary#term-27");
  });

  test("#answer, an empty hash and anything unknown → null (stay on /)", () => {
    for (const h of ["#answer", "", "#", "#nope", "#Story", "#story-1", "#run-", "#term-", "#term-x"]) expect(oldAnchorTarget(h)).toBeNull();
  });
});
