import { describe, expect, test } from "bun:test";
import { commonItems, compareRows, NOT_MEASURED } from "./compare";
import type { Item, Run } from "./types";

// Item values copied from pack v2 runs.json (read 2026-11-18); point labels are test placeholders.
const it = (item: string, minutes: number, compactions: number | null, speed: number | null, vram: number | null,
  mut: [number, number] | null): Item => ({
  item, label: `label ${item}`, minutes, cap: 70, timedOut: false, turns: null, compactions, vram, speed, result: "ok",
  newFails: 0, review: "",
  mutations: mut ? { caught: mut[0], total: mut[1], points: Array.from({ length: mut[1] }, (_, i) => ({ label: `p${i + 1}`, caught: i < mut[0] })) } : null,
});
const run = (id: string, cost: number, items: Item[]): Run => ({
  id, rent: 0, date: "", isoDate: "2026-11-18", gpu: "", model: "", quant: "", ctx: 0, card: false, loop: false, cost,
  title: "", sum: "", notes: [], items,
});
const R1 = run("R1", 0.54, [it("B1", 5.5, null, null, null, null), it("B2", 18.2, null, null, null, null), it("B3", 20, null, null, null, null)]);
const R2 = run("R2", 0.84, [it("B3", 40, null, null, null, null), it("B1", 16.5, null, null, null, null), it("B2", 21.1, null, null, null, null)]);
const R3 = run("R3", 0.76, [it("B3", 39, 3, 12.1, 21152, [3, 4])]);
const R4a = run("R4a", 0.91, [it("B3", 67, 1, 10.2, 32967, [4, 4])]);
const R4b = run("R4b", 0.44, [it("B3", 34, 1, 18.7, 37817, [0, 4])]);
const R5 = run("R5", 1.73, [it("B4", 70, 0, 11, 32966, [7, 7]), it("B5", 62, 0, 17.6, 32968, [3, 5])]);
const CARD = 49140; // page.json → behind.gauge.cardMiB
const ORDER = ["R1", "R2", "R3", "R4a", "R4b", "R5", "R6", "R9"]; // runs.json row order (pack v3.1)

const table = (blocks: ReturnType<typeof compareRows>) =>
  blocks[0].metrics.map((m) => [m.name, m.a, m.b, m.winA ? "A" : m.winB ? "B" : "-"]);

describe("commonItems — only the items both rows hold, by id, in the first row's order", () => {
  test("R1 vs R2 → B1, B2, B3 (R1's order; R2 lists B3 first)", () => {
    expect(commonItems(R1, R2).map(([a, b]) => [a.item, b.item])).toEqual([["B1", "B1"], ["B2", "B2"], ["B3", "B3"]]);
  });
  test("R5 vs R3 → none (B4, B5 against B3)", () => {
    expect(commonItems(R5, R3)).toEqual([]);
    expect(compareRows(R5, R3, CARD, ORDER)).toEqual([]);
  });
});

// Expected = what the reference page's compare (reference/index.html lines 520–539) shows for the same rows' hard item,
// worked by hand: gb = (mib / 1024).toFixed(1), pct = round(mib / 49140 × 100); "better": high or low, none when equal,
// when either side is null, or when the same row is picked twice; cost never has a winner.
describe("compareRows — the six metrics and the 'better' rule of the reference", () => {
  test("R3 vs R4a on B3", () => {
    const blocks = compareRows(R3, R4a, CARD, ORDER);
    expect(blocks.map((b) => b.item)).toEqual(["B3"]);
    expect(table(blocks)).toEqual([
      ["ความผิดที่เทสต์จับได้", "3 / 4", "4 / 4", "B"],
      ["เวลาที่ใช้", "39 นาที", "67 นาที", "A"],
      ["ความจำเต็มระหว่างทำ", "3 ครั้ง", "1 ครั้ง", "B"],
      ["ความเร็วเขียนเฉลี่ย", "12.1 คำ/วินาที", "10.2 คำ/วินาที", "A"],
      ["การ์ดที่ใช้", "20.7 GB (43%)", "32.2 GB (67%)", "A"],
      ["ค่าเครื่องทั้งรอบ", "$0.76", "$0.91", "-"],
    ]);
  });

  test("R1 vs R4b on B3: R1's unmeasured values read ไม่ได้วัด and never win", () => {
    expect(table(compareRows(R1, R4b, CARD, ORDER))).toEqual([
      ["ความผิดที่เทสต์จับได้", NOT_MEASURED, "0 / 4", "-"],
      ["เวลาที่ใช้", "20 นาที", "34 นาที", "A"],
      ["ความจำเต็มระหว่างทำ", NOT_MEASURED, "1 ครั้ง", "-"],
      ["ความเร็วเขียนเฉลี่ย", NOT_MEASURED, "18.7 คำ/วินาที", "-"],
      ["การ์ดที่ใช้", NOT_MEASURED, "36.9 GB (77%)", "-"],
      ["ค่าเครื่องทั้งรอบ", "$0.54", "$0.44", "-"],
    ]);
    expect(NOT_MEASURED).toBe("ไม่ได้วัด");
  });

  test("the same row twice → no winner anywhere", () => {
    expect(table(compareRows(R3, R3, CARD, ORDER)).every(([, , , w]) => w === "-")).toBe(true);
  });

  // TASK-018: the block carries `points` (AC-12) instead of both sides' `mutations`; neither row measured any → [].
  test("R1 vs R2 → one block per common item; no planted points on either side → points []", () => {
    const blocks = compareRows(R1, R2, CARD, ORDER);
    expect(blocks.map((b) => [b.item, b.label])).toEqual([["B1", "label B1"], ["B2", "label B2"], ["B3", "label B3"]]);
    expect(blocks[2].metrics[1]).toMatchObject({ a: "20 นาที", b: "40 นาที", winA: true, winB: false });
    expect(blocks[0].points).toEqual([]);
  });
});

// DEF-3 (TEST-003): the reference judges this row by caught ÷ planted (reference/index.html line 536), not by the count.
// R9 from pack v3.1 runs.json (read 2026-11-19): its B4 planted 8 bugs where R5's B4 planted 7. X, Y, Z are test rows.
const R9 = run("R9", 1.05, [it("B4", 56, 0, 33.3, 33472, [8, 8]), it("B3", 35, 0, 34.7, 33472, [4, 4])]);
const one = (id: string, mut: [number, number]) => run(id, 1, [it("B9", 10, 0, 1, 1, mut)]);
const caughtRow = (a: Run, b: Run) => {
  const m = compareRows(a, b, CARD, ORDER)[0].metrics[0];
  return [m.name, m.a, m.b, m.winA ? "A" : m.winB ? "B" : "-"];
};

describe("ความผิดที่เทสต์จับได้ — caught ÷ planted decides the green cell (DEF-3)", () => {
  test("R9·B4 8 / 8 vs R5·B4 7 / 7 → both caught all, no winner, both orders", () => {
    expect(caughtRow(R9, R5)).toEqual(["ความผิดที่เทสต์จับได้", "8 / 8", "7 / 7", "-"]);
    expect(caughtRow(R5, R9)).toEqual(["ความผิดที่เทสต์จับได้", "7 / 7", "8 / 8", "-"]);
  });

  test("count and ratio disagree: 4 / 5 (0.8) vs 3 / 3 (1) → the 3 / 3 side wins, both orders", () => {
    expect(caughtRow(one("X", [4, 5]), one("Y", [3, 3]))).toEqual(["ความผิดที่เทสต์จับได้", "4 / 5", "3 / 3", "B"]);
    expect(caughtRow(one("Y", [3, 3]), one("X", [4, 5]))).toEqual(["ความผิดที่เทสต์จับได้", "3 / 3", "4 / 5", "A"]);
  });

  test("0 planted → ไม่ได้วัด and no winner", () => {
    expect(caughtRow(one("Z", [0, 0]), one("Y", [3, 3]))).toEqual(["ความผิดที่เทสต์จับได้", NOT_MEASURED, "3 / 3", "-"]);
  });
});

// TASK-018 (SPEC-003 § Round 2). Points are matched by label; their order does not depend on which side is first.
// `out` marks items timed out as in pack v3.1 runs.json: R1·B3, R2·B3, R5·B4, R5·B5.
const out = (r: Run, ...items: string[]): Run => ({ ...r, items: r.items.map((i) => (items.includes(i.item) ? { ...i, timedOut: true } : i)) });
const withPoints = (id: string, points: [string, boolean][]) => {
  const item = it("B9", 10, 0, 1, 1, null);
  item.mutations = { caught: points.filter(([, c]) => c).length, total: points.length, points: points.map(([label, caught]) => ({ label, caught })) };
  return run(id, 1, [item]);
};
const R5t = out(R5, "B4", "B5");
const pts = (a: Run, b: Run, order = ORDER) => compareRows(a, b, CARD, order)[0].points;
const minutesRow = (a: Run, b: Run) => {
  const m = compareRows(a, b, CARD, ORDER)[0].metrics[1];
  return [m.name, m.a, m.b, m.winA ? "A" : m.winB ? "B" : "-"];
};

describe("points — every planted point of either side, by label (AC-12)", () => {
  test("R5·B4 (7) vs R9·B4 (8): 8 points, point 8 is ไม่ได้ทดสอบ (null) for R5; R9 vs R5 has the same labels, columns swapped", () => {
    const ab = pts(R5t, R9);
    expect(ab.map((p) => p.label)).toEqual(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"]);
    expect(ab[7]).toEqual({ label: "p8", a: null, b: true });
    expect(ab.slice(0, 7).every((p) => p.a === true && p.b === true)).toBe(true);
    expect(pts(R9, R5t)).toEqual(ab.map((p) => ({ label: p.label, a: p.b, b: p.a })));
  });

  test("not a prefix: A [p1, p2, p3], B [p2, p4] → A first in order: p1 p2 p3 p4; B first: p2 p4 p1 p3", () => {
    const A = withPoints("A", [["p1", true], ["p2", false], ["p3", true]]);
    const B = withPoints("B", [["p2", true], ["p4", false]]);
    expect(pts(A, B, ["A", "B"])).toEqual([
      { label: "p1", a: true, b: null }, { label: "p2", a: false, b: true },
      { label: "p3", a: true, b: null }, { label: "p4", a: null, b: false },
    ]);
    expect(pts(A, B, ["B", "A"]).map((p) => p.label)).toEqual(["p2", "p4", "p1", "p3"]);
    expect(pts(B, A, ["A", "B"]).map((p) => p.label)).toEqual(["p1", "p2", "p3", "p4"]);
  });

  test("the same row twice → its own points, no null", () => {
    const own = pts(R3, R3);
    expect(own).toEqual([
      { label: "p1", a: true, b: true }, { label: "p2", a: true, b: true },
      { label: "p3", a: true, b: true }, { label: "p4", a: false, b: false },
    ]);
  });

  test("one side has no mutations → its column is null for every point of the other side", () => {
    expect(pts(R1, R4b)).toEqual(["p1", "p2", "p3", "p4"].map((label) => ({ label, a: null, b: false })));
  });
});

describe("เวลาที่ใช้ — a timeout shows and is never judged (AC-13)", () => {
  test("R5·B4 70 (timed out) vs R9·B4 56 → marked, no winner, both orders", () => {
    expect(minutesRow(R5t, R9)).toEqual(["เวลาที่ใช้", "70 นาที · หมดเวลา", "56 นาที", "-"]);
    expect(minutesRow(R9, R5t)).toEqual(["เวลาที่ใช้", "56 นาที", "70 นาที · หมดเวลา", "-"]);
  });

  test("R1·B3 vs R2·B3, both timed out → both marked, no winner", () => {
    const b3 = compareRows(out(R1, "B3"), out(R2, "B3"), CARD, ORDER).find((x) => x.item === "B3")!.metrics[1];
    expect([b3.a, b3.b, b3.winA, b3.winB]).toEqual(["20 นาที · หมดเวลา", "40 นาที · หมดเวลา", false, false]);
  });

  test("no timeout on either side → today's winner (R3 39 vs R4a 67 → R3)", () => {
    expect(minutesRow(R3, R4a)).toEqual(["เวลาที่ใช้", "39 นาที", "67 นาที", "A"]);
  });

  test("a timeout leaves the other rows judged as before (R5·B4 vs R9·B4: speed → R9)", () => {
    const speed = compareRows(R5t, R9, CARD, ORDER)[0].metrics[3];
    expect([speed.a, speed.b, speed.winA, speed.winB]).toEqual(["11 คำ/วินาที", "33.3 คำ/วินาที", false, true]);
  });
});
