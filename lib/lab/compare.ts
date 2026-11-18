import type { Item, Mutations, Run } from "./types";
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

/** One common item: its six metrics, plus both sides' planted bugs for the "จุดไหนจับได้" row. */
export interface ItemBlock {
  item: string;
  label: string;
  metrics: MetricRow[];
  mutations: [Mutations | null, Mutations | null];
}

type Value = (row: Run, item: Item) => number | null;
type Format = (v: number, item: Item, cardMiB: number) => string;

// The six metrics of the reference page (reference/index.html lines 520–526): name, value, format, which side is better.
// The minutes row reads "เวลาที่ใช้" for every item (REQ-001 Q11 (a), the PM): the reference's "เวลาทำข้อยาก" named the
// hard item only.
const METRICS: [string, Value, Format, "high" | "low" | null][] = [
  ["ความผิดที่เทสต์จับได้", (_, i) => i.mutations?.caught ?? null, (v, i) => `${v} / ${i.mutations?.total}`, "high"],
  ["เวลาที่ใช้", (_, i) => i.minutes, (v) => `${v} นาที`, "low"],
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
 * One block per common item. "Better" as the reference (line 536): no winner when equal, when either side is null,
 * or when the same row is picked twice.
 */
export function compareRows(a: Run, b: Run, cardMiB: number): ItemBlock[] {
  return commonItems(a, b).map(([ia, ib]) => ({
    item: ia.item,
    label: ia.label,
    metrics: METRICS.map(([name, value, format, better]) => {
      const va = value(a, ia);
      const vb = value(b, ib);
      let winA = false;
      let winB = false;
      if (better && va !== null && vb !== null && va !== vb && a.id !== b.id) {
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
    mutations: [ia.mutations, ib.mutations],
  }));
}
