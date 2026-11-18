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

const table = (blocks: ReturnType<typeof compareRows>) =>
  blocks[0].metrics.map((m) => [m.name, m.a, m.b, m.winA ? "A" : m.winB ? "B" : "-"]);

describe("commonItems — only the items both rows hold, by id, in the first row's order", () => {
  test("R1 vs R2 → B1, B2, B3 (R1's order; R2 lists B3 first)", () => {
    expect(commonItems(R1, R2).map(([a, b]) => [a.item, b.item])).toEqual([["B1", "B1"], ["B2", "B2"], ["B3", "B3"]]);
  });
  test("R5 vs R3 → none (B4, B5 against B3)", () => {
    expect(commonItems(R5, R3)).toEqual([]);
    expect(compareRows(R5, R3, CARD)).toEqual([]);
  });
});

// Expected = what the reference page's compare (reference/index.html lines 520–539) shows for the same rows' hard item,
// worked by hand: gb = (mib / 1024).toFixed(1), pct = round(mib / 49140 × 100); "better": high or low, none when equal,
// when either side is null, or when the same row is picked twice; cost never has a winner.
describe("compareRows — the six metrics and the 'better' rule of the reference", () => {
  test("R3 vs R4a on B3", () => {
    const blocks = compareRows(R3, R4a, CARD);
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
    expect(table(compareRows(R1, R4b, CARD))).toEqual([
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
    expect(table(compareRows(R3, R3, CARD)).every(([, , , w]) => w === "-")).toBe(true);
  });

  test("R1 vs R2 → one block per common item, each with both items' mutations for the dots", () => {
    const blocks = compareRows(R1, R2, CARD);
    expect(blocks.map((b) => [b.item, b.label])).toEqual([["B1", "label B1"], ["B2", "label B2"], ["B3", "label B3"]]);
    expect(blocks[2].metrics[1]).toMatchObject({ a: "20 นาที", b: "40 นาที", winA: true, winB: false });
    expect(blocks[0].mutations).toEqual([null, null]);
  });
});
