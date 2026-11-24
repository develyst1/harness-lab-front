import type { BAPair, Side } from "@/components/partials/viz";
import { NOT_MEASURED } from "@/lib/lab/compare";
import type { Technique } from "@/lib/lab/types";

// Which numbers /techniques draws for a technique's before → after (TASK-054's comp, moved here by TASK-056; SPEC-013
// ranked row 1; TASK-053 A2's map). The pack carries these numbers only inside its Thai sentences, so the FE read them by
// hand. Every entry names the exact words it reads (`sub`), and `techPairs` checks each one against the technique's
// current text: if any is missing, the card shows its words only. A picture can therefore never show a number the pack
// does not say. Numbers as pack fields would replace this table; that is listed for Modio, held (SPEC-013 Q1).
interface Part {
  sub: string;
  value?: number;
  of?: number;
  /** The words say the run was stopped at this value ("หมดเวลา 70"): drawn hatched, with a clock icon. */
  stopped?: boolean;
}
interface Spec {
  /** Words from the metric or the side texts naming this pair. */
  name?: string;
  before: Part;
  after: Part;
}

const N = (sub: string, value?: number, of?: number): Part => ({ sub, value, of });
/** A stopped run: only where its own words say so ("หมดเวลา"). */
const STOP = (sub: string, value: number): Part => ({ sub, value, stopped: sub.includes("หมดเวลา") });

export const SPECS: Record<string, Spec[]> = {
  T01: [{ before: N("~17,100", 17100), after: N("~944", 944) }],
  T04: [{ before: N("3/4", 3, 4), after: N("4/4", 4, 4) }],
  T06: [
    { name: "คำถามสั้น", before: N("23.1", 23.1), after: N("53.5", 53.5) },
    { name: "ที่บริบท 30k", before: N("21.1", 21.1), after: N("41.5", 41.5) },
  ],
  T07: [
    { name: "B3", before: N("67 นาที", 67), after: N("35 นาที", 35) },
    { name: "B4", before: STOP("หมดเวลา 70", 70), after: N("56 นาที", 56) },
    { name: "B5", before: STOP("หมดเวลา 62", 62), after: N("41 นาที", 41) },
  ],
  T10: [
    { name: "27B", before: N("1/3", 1, 3), after: N("3/3", 3, 3) },
    { name: "125B", before: N("1.5/3", 1.5, 3), after: N("3/3", 3, 3) },
  ],
  T12: [{ before: N("-"), after: N("$9.08 จากเพดาน $10", 9.08, 10) }],
  T19: [
    { name: "mm-short", before: N("2", 2, 5), after: N("5", 5, 5) },
    { name: "mm-gaps", before: N("4", 4, 7), after: N("5", 5, 7) },
    { name: "mm-noisy", before: N("7", 7, 14), after: N("12", 12, 14) },
  ],
};

type Fields = Pick<Technique, "id" | "metricTh" | "beforeTh" | "afterTh">;

/** The pairs to draw for `t`: from SPECS when every word it reads is still in the text, else the two texts as words.
 * One pair shows each side's whole text; several pairs show the words they read, and `whole` is then false, so the
 * card folds the whole texts (AC-4). */
export function techPairs(t: Fields): { pairs: BAPair[]; whole: boolean } {
  // TEST-012 DEF-1 / DEF-5: both sides missing (or empty) → nothing to draw. One side missing → the pair stays as words,
  // the missing side reads "ไม่ได้วัด" (the site's rule for a null since REQ-001) with no number, so nothing is drawn for it.
  if (!t.beforeTh && !t.afterTh) return { pairs: [], whole: true };
  if (!t.beforeTh || !t.afterTh)
    return { pairs: [{ before: { text: t.beforeTh || NOT_MEASURED }, after: { text: t.afterTh || NOT_MEASURED } }], whole: true };
  const before = t.beforeTh, after = t.afterTh;
  const words: BAPair[] = [{ before: { text: before }, after: { text: after } }];
  const spec = SPECS[t.id];
  if (!spec) return { pairs: words, whole: true };
  const ok = spec.every(
    (s) =>
      before.includes(s.before.sub) &&
      after.includes(s.after.sub) &&
      (!s.name || [t.metricTh, before, after].some((f) => f.includes(s.name as string))),
  );
  if (!ok) return { pairs: words, whole: true };
  const one = spec.length === 1;
  const side = (p: Part, text: string): Side => ({ text: one ? text : p.sub, value: p.value, of: p.of, ...(p.stopped ? { stopped: true } : {}) });
  return {
    pairs: spec.map((s) => ({ name: s.name, before: side(s.before, before), after: side(s.after, after) })),
    whole: one,
  };
}
