import type { Item, Run } from "./types";
import { gb, pct } from "./vram";

/** What a metric reads when a row did not measure it (reference line 537). */
export const NOT_MEASURED = "ไม่ได้วัด";

export interface MetricRow {
  name: string;
  a: string;
  b: string;
  winA: boolean;
  winB: boolean;
}

/** One planted bug, matched across the two sides by its label: caught, missed, or `null` = not tested on that side. */
export interface PointRow {
  label: string;
  a: boolean | null;
  b: boolean | null;
}

/** One common item: its six metrics, then every planted point of either side (SPEC-003 § AC-12). */
export interface ItemBlock {
  item: string;
  label: string;
  metrics: MetricRow[];
  points: PointRow[];
}

type Value = (row: Run, item: Item) => number | null;
type Format = (v: number, item: Item, cardMiB: number) => string;
/** True when the row must not be judged for this pair of items. */
type NoWinner = (ia: Item, ib: Item) => boolean;

// The six metrics of the reference page (reference/index.html lines 520–526): name, value, format, which side is better.
// The minutes row reads "เวลาที่ใช้" for every item (REQ-001 Q11 (a), the PM): the reference's "เวลาทำข้อยาก" named the
// hard item only. "ความผิดที่เทสต์จับได้" is judged by caught ÷ planted, as the reference (line 536), and shows the two
// counts; no mutations or 0 planted → null (TASK-016, DEF-3: 8 / 8 and 7 / 7 are equal, so neither is green).
// "เวลาที่ใช้" adds ประวัติ's " · หมดเวลา" to a side that timed out, and is not judged when either side did (SPEC-003
// § AC-13): the 5th element is that row's no-winner guard.
const METRICS: [string, Value, Format, "high" | "low" | null, NoWinner?][] = [
  ["ความผิดที่เทสต์จับได้", (_, i) => (i.mutations && i.mutations.total > 0 ? i.mutations.caught / i.mutations.total : null),
    (_, i) => `${i.mutations?.caught} / ${i.mutations?.total}`, "high"],
  ["เวลาที่ใช้", (_, i) => i.minutes, (v, i) => `${v} นาที${i.timedOut ? " · หมดเวลา" : ""}`, "low",
    (ia, ib) => ia.timedOut || ib.timedOut],
  ["ความจำเต็มระหว่างทำ", (_, i) => i.compactions, (v) => `${v} ครั้ง`, "low"],
  ["ความเร็วเขียนเฉลี่ย", (_, i) => i.speed, (v) => `${v} คำ/วินาที`, "high"],
  ["การ์ดที่ใช้", (_, i) => i.vram, (v, _, card) => `${gb(v)} GB (${pct(v, card)}%)`, "low"],
  ["ค่าเครื่องทั้งรอบ", (r) => r.cost, (v) => `$${v.toFixed(2)}`, null],
];

/** The items both rows hold, matched by `item` id, in the first row's order (SPEC-001 § Pack v2). */
export function commonItems(a: Run, b: Run): [Item, Item][] {
  return a.items.flatMap((ia) => {
    const ib = b.items.find((x) => x.item === ia.item);
    return ib ? [[ia, ib] as [Item, Item]] : [];
  });
}

/**
 * Every planted point of either side, matched by label (labels are unique per item, SPEC-003 § AC-12): first the points
 * of the side given as `firstIsA`, then the other side's extra labels in their own order.
 */
export function pointRows(ia: Item, ib: Item, firstIsA: boolean): PointRow[] {
  const pa = ia.mutations?.points ?? [];
  const pb = ib.mutations?.points ?? [];
  const [first, second] = firstIsA ? [pa, pb] : [pb, pa];
  const labels = [...first, ...second.filter((p) => !first.some((f) => f.label === p.label))].map((p) => p.label);
  const mark = (points: typeof pa, label: string) => points.find((p) => p.label === label)?.caught ?? null;
  return labels.map((label) => ({ label, a: mark(pa, label), b: mark(pb, label) }));
}

/**
 * One block per common item. "Better" as the reference (line 536): no winner when equal, when either side is null,
 * when the same row is picked twice, or when the metric's guard says so. `order` = the row ids in pack order: the
 * points start with the side that comes first in it, so swapping the sides only swaps the columns.
 */
export function compareRows(a: Run, b: Run, cardMiB: number, order: readonly string[]): ItemBlock[] {
  const firstIsA = order.indexOf(a.id) <= order.indexOf(b.id);
  return commonItems(a, b).map(([ia, ib]) => ({
    item: ia.item,
    label: ia.label,
    metrics: METRICS.map(([name, value, format, better, noWinner]) => {
      const va = value(a, ia);
      const vb = value(b, ib);
      let winA = false;
      let winB = false;
      if (better && !noWinner?.(ia, ib) && va !== null && vb !== null && va !== vb && a.id !== b.id) {
        winA = better === "low" ? va < vb : va > vb;
        winB = !winA;
      }
      return {
        name,
        a: va !== null ? format(va, ia, cardMiB) : NOT_MEASURED,
        b: vb !== null ? format(vb, ib, cardMiB) : NOT_MEASURED,
        winA,
        winB,
      };
    }),
    points: pointRows(ia, ib, firstIsA),
  }));
}
