import { describe, expect, test } from "bun:test";
import { firstItem } from "./items";
import type { Item, Run } from "./types";

// A pack v2 row (README § runs.json v2): items[], no `hard`. Test data only.
const item = (id: string, caught: number): Item => ({
  item: id, label: `test item ${id}`, minutes: 50, cap: 70, timedOut: false, turns: 80, compactions: 1, vram: 30000,
  speed: 11, result: "part", newFails: 0, review: "",
  mutations: { caught, total: 7, points: Array.from({ length: 7 }, (_, i) => ({ label: `test point ${i + 1}`, caught: i < caught })) },
});
const row: Run = {
  id: "T-V2", rent: 0, date: "", isoDate: "2026-11-19", gpu: "", model: "", quant: "", ctx: 0, card: false, loop: false,
  cost: 0, title: "", sum: "", notes: [], label: "test", verdict: "part", items: [item("B1", 5), item("B2", 2)],
};

describe("firstItem — the item a card shows, or null when the row has none", () => {
  test("items[0] as it is (5 of 7 on item 1)", () => {
    expect(firstItem(row)).toBe(row.items[0]);
    expect(firstItem(row)?.mutations?.caught).toBe(5);
    expect(firstItem(row)?.mutations?.total).toBe(7);
  });
  test("items: [] → null (the card reads ไม่ได้วัด), not undefined", () => {
    expect(firstItem({ ...row, items: [] })).toBeNull();
  });
});
