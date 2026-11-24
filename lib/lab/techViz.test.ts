import { describe, expect, test } from "bun:test";
import { SPECS, techPairs } from "./techViz";

const t01 = { id: "T01", metricTh: "token ก่อนเริ่มงาน", beforeTh: "~17,100 (โหมดเต็ม)", afterTh: "~944 (--bare)" };

describe("techPairs — a technique without before or after (TEST-012 DEF-1, DEF-5)", () => {
  test("one side missing → the pair stays, the missing side reads ไม่ได้วัด with no number (DEF-5), and no throw", () => {
    const noBefore = { ...t01, beforeTh: undefined };
    const noAfter = { ...t01, afterTh: undefined };
    expect(techPairs(noBefore as never)).toEqual({ pairs: [{ before: { text: "ไม่ได้วัด" }, after: { text: "~944 (--bare)" } }], whole: true });
    expect(techPairs(noAfter as never)).toEqual({ pairs: [{ before: { text: "~17,100 (โหมดเต็ม)" }, after: { text: "ไม่ได้วัด" } }], whole: true });
  });
  test("both missing → no pair to draw", () => {
    expect(techPairs({ id: "T99", metricTh: "m" } as never)).toEqual({ pairs: [], whole: true });
  });
  test("an empty string counts as missing too", () => {
    expect(techPairs({ ...t01, beforeTh: "" })).toEqual({ pairs: [{ before: { text: "ไม่ได้วัด" }, after: { text: "~944 (--bare)" } }], whole: true });
  });
});

describe("techPairs — the comp draws only numbers the pack text says", () => {
  test("one pair: each side keeps its whole text, with the value read from it", () => {
    expect(techPairs(t01)).toEqual({
      pairs: [{ name: undefined, before: { text: "~17,100 (โหมดเต็ม)", value: 17100, of: undefined }, after: { text: "~944 (--bare)", value: 944, of: undefined } }],
      whole: true,
    });
  });

  test("the text changed: the card falls back to its words, nothing drawn", () => {
    const r = techPairs({ ...t01, afterTh: "~900 (--bare)" });
    expect(r).toEqual({ pairs: [{ before: { text: t01.beforeTh }, after: { text: "~900 (--bare)" } }], whole: true });
  });

  test("no entry: words only", () => {
    expect(techPairs({ ...t01, id: "T02" }).pairs[0].before.value).toBeUndefined();
  });

  test("several pairs show the words they read, and ask the card to fold the whole texts", () => {
    const t = { id: "T10", metricTh: "ข้อผิดที่จับได้ (จาก 3)", beforeTh: "27B จับได้ 1/3, 125B จับได้ 1.5/3 (อ่านโค้ดอย่างเดียว)", afterTh: "27B จับได้ 3/3, 125B จับได้ 3/3" };
    const r = techPairs(t);
    expect(r.whole).toBe(false);
    expect(r.pairs.map((p) => [p.name, p.before.text, p.before.value, p.after.text])).toEqual([["27B", "1/3", 1, "3/3"], ["125B", "1.5/3", 1.5, "3/3"]]);
  });

  test("every entry's values agree with its own words", () => {
    for (const spec of Object.values(SPECS))
      for (const s of spec)
        for (const p of [s.before, s.after])
          if (p.value !== undefined) expect(p.sub.replace(/,/g, "")).toContain(String(p.value));
  });
});
