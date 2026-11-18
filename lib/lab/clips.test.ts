import { describe, expect, test } from "bun:test";
import { NO_CLIP_YET, SPEEDS, clipFailed, clipTabs, clipView, initialClip, playRow, selectTab, setSpeed } from "./clips";
import type { Item, Run } from "./types";

// Rows shaped like pack v2.1 (R3, R4a, R4b one item B3 each with a video; R5 two items with videos; R1 none).
// `novideo` = the QA's data-novideo: the same with R4b's items[0].video removed (TEST-001 DEF-1).
const item = (id: string, video?: string): Item => ({
  item: id, label: `label ${id}`, minutes: 1, cap: 1, timedOut: false, turns: null, compactions: null, vram: null, speed: null,
  result: "ok", newFails: 0, mutations: null, review: "", ...(video ? { video } : {}),
});
const row = (id: string, model: string, quant: string, items: Item[]): Run => ({
  id, rent: 0, date: "", isoDate: "", gpu: "", model, quant, ctx: 0, card: false, loop: false, cost: 0, title: "", sum: "",
  notes: [], watch: `watch ${id}`, items,
});
const real = [
  row("R1", "Qwen 3.8 27B", "Q4", [item("B1"), item("B2"), item("B3")]),
  row("R3", "Qwen 3.8 27B", "Q4", [item("B3", "r3.mp4")]),
  row("R4a", "Qwen 3.8 27B", "Q8", [item("B3", "r4a.mp4")]),
  row("R4b", "Laguna XS 2.1", "Q8", [item("B3", "r4b.mp4")]),
  row("R5", "Qwen 3.8 27B", "Q8", [item("B4", "r5a.mp4"), item("B5", "r5b.mp4")]),
];
const novideo = real.map((r) => (r.id === "R4b" ? { ...r, items: [item("B3")] } : r));
const NO_CLIP = "คลิปของการทดลองนี้ยังไม่เผยแพร่"; // page.json → clips.noClip
const start = initialClip(real);

describe("tabs and the starting state", () => {
  test("one tab per item that names a video, pack order; R5's tabs carry the item label", () => {
    expect(clipTabs(real).map((t) => t.label)).toEqual([
      "R3 · Qwen 3.8 27B Q4", "R4a · Qwen 3.8 27B Q8", "R4b · Laguna XS 2.1 Q8",
      "R5 · Qwen 3.8 27B Q8 · label B4", "R5 · Qwen 3.8 27B Q8 · label B5"]);
  });
  test("on load: R4a's first tab (reference line 503), speed 1×, loaded but not played, nothing failed", () => {
    expect(start).toEqual({ rowId: "R4a", tabKey: "R4a-B3", rate: 1, plays: 0, failed: [] });
    expect(clipView(real, start, NO_CLIP)).toEqual({
      selectedKey: "R4a-B3", rowLine: null, src: "/clips/r4a.mp4", message: null, watch: "watch R4a", labelledBy: "t-R4a-B3",
      rate: 1, plays: 0,
    });
  });
  test("the speed buttons are 0.5× · 1× · 1.5× (reference line 255)", () => {
    expect([...SPEEDS]).toEqual([0.5, 1, 1.5]);
  });
});

describe("a tab plays its own clip (TASK-012)", () => {
  test("pressing a tab → that tab, its clip /clips/<video>, its row's watch, and a play ask", () => {
    const s = selectTab(real, start, "R4b-B3");
    expect(s).toMatchObject({ rowId: "R4b", tabKey: "R4b-B3", plays: 1 });
    expect(clipView(real, s, NO_CLIP)).toMatchObject({ selectedKey: "R4b-B3", src: "/clips/r4b.mp4", message: null, watch: "watch R4b" });
  });
  test("R5's second tab → the second item's clip", () => {
    expect(clipView(real, selectTab(real, start, "R5-B5"), NO_CLIP)).toMatchObject({ src: "/clips/r5b.mp4", watch: "watch R5" });
  });
  test("a tab whose clip failed to load → clips.noClip, no clip src; the other tabs keep theirs", () => {
    const s = clipFailed(selectTab(real, start, "R3-B3"), "R3-B3");
    expect(s.failed).toEqual(["R3-B3"]);
    expect(clipView(real, s, NO_CLIP)).toMatchObject({ selectedKey: "R3-B3", src: null, message: NO_CLIP, watch: "watch R3" });
    expect(clipView(real, selectTab(real, s, "R4a-B3"), NO_CLIP)).toMatchObject({ src: "/clips/r4a.mp4", message: null });
    expect(clipFailed(s, "R3-B3")).toBe(s); // marking twice changes nothing
  });
  test("the speed choice survives a tab change and a card press", () => {
    const fast = setSpeed(start, 1.5);
    expect(fast.plays).toBe(0); // a speed press does not start the clip
    expect(selectTab(real, fast, "R3-B3").rate).toBe(1.5);
    expect(clipView(real, playRow(real, fast, "R4b"), NO_CLIP).rate).toBe(1.5);
  });
});

describe("▶ ดูคลิป on a card → playRow → clipView", () => {
  test("R4b with a video → its own tab, its clip, R4b's watch, a play ask", () => {
    const v = clipView(real, playRow(real, start, "R4b"), NO_CLIP);
    expect(v).toEqual({
      selectedKey: "R4b-B3", rowLine: null, src: "/clips/r4b.mp4", message: null, watch: "watch R4b", labelledBy: "t-R4b-B3",
      rate: 1, plays: 1,
    });
  });
  test("R4b with no video (DEF-1) → no tab selected, the row named, ยังไม่มีคลิปของการทดลองนี้, R4b's watch — unchanged", () => {
    const s = playRow(novideo, initialClip(novideo), "R4b");
    expect(s).toMatchObject({ rowId: "R4b", tabKey: null });
    expect(clipView(novideo, s, NO_CLIP)).toMatchObject({
      selectedKey: null, rowLine: "R4b · Laguna XS 2.1 Q8", src: null, message: "ยังไม่มีคลิปของการทดลองนี้", watch: "watch R4b",
      labelledBy: "clip-row",
    });
    expect(NO_CLIP_YET).toBe("ยังไม่มีคลิปของการทดลองนี้");
  });
  test("a row with two clips → its first tab (R5 → B4)", () => {
    expect(playRow(real, start, "R5")).toMatchObject({ rowId: "R5", tabKey: "R5-B4" });
  });
  test("pressing a tab leaves the no-tab state", () => {
    const s = selectTab(novideo, playRow(novideo, initialClip(novideo), "R4b"), "R3-B3");
    expect(s).toMatchObject({ rowId: "R3", tabKey: "R3-B3" });
    expect(clipView(novideo, s, NO_CLIP)).toMatchObject({ selectedKey: "R3-B3", rowLine: null, src: "/clips/r3.mp4", watch: "watch R3" });
  });
  test("a pack with no clip at all → R4a named with ยังไม่มีคลิปของการทดลองนี้ on load", () => {
    const none = real.map((r) => ({ ...r, items: r.items.map((i) => item(i.item)) }));
    expect(clipView(none, initialClip(none), NO_CLIP)).toMatchObject({
      selectedKey: null, rowLine: "R4a · Qwen 3.8 27B Q8", src: null, message: NO_CLIP_YET,
    });
  });
});
