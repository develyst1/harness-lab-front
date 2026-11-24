// SPEC-013 § The lead rule (TASK-054; rule 4b TASK-055): the visible lead of a folded field. A lead is always a prefix of the field's own
// text, never rewritten; the disclosure under it shows the whole field. Lengths are in code points (Thai marks count).
// Pure; used by the comp's folds (components/partials/viz/Fold.tsx).

const MAX = 120;
const MIN = 40;

export interface Lead {
  lead: string;
  /** true when the lead is shorter than the field: show it with "…" and fold the whole field under it. */
  cut: boolean;
}

const isThai = (c: string | undefined) => c !== undefined && /[฀-๿]/.test(c);
/** A boundary between `prev` and `next` that sits inside a number or a $ amount ("17,100", "$10.25"). */
const inNumber = (prev: string | undefined, next: string | undefined) =>
  prev !== undefined && next !== undefined && /[0-9$.,]/.test(prev) && /[0-9.,]/.test(next) && /[0-9$]/.test(prev + next);

export function leadOf(text: string): Lead {
  const cp = Array.from(text);
  if (cp.length <= MAX) return { lead: text, cut: false };
  const at = (n: number): Lead => ({ lead: cp.slice(0, n).join("").trimEnd(), cut: true });
  // Rule 4b: `open[n]` = how many ( or [ are still unclosed before position n. A cut there would leave a bracket open.
  const open: number[] = [0];
  for (const c of cp) open.push(Math.max(0, open[open.length - 1] + (c === "(" || c === "[" ? 1 : c === ")" || c === "]" ? -1 : 0)));
  const shut = (n: number) => open[n] === 0;
  // Rule 2: the first break in [40, 120] outside brackets, trying each kind in order. `n` is the lead's length.
  const first = (isBreak: (n: number) => boolean) => {
    for (let n = MIN; n <= MAX; n++) if (shut(n) && isBreak(n)) return n;
    return -1;
  };
  const kinds = [
    (n: number) => cp[n] === "\n",
    (n: number) => cp[n] === " " && /[.!?:;]/.test(cp[n - 1]),
    // a space between two Thai characters, except before ๆ (mai yamok), which belongs to the word before it
    (n: number) => cp[n] === " " && isThai(cp[n - 1]) && isThai(cp[n + 1]) && cp[n + 1] !== "ๆ",
  ];
  for (const isBreak of kinds) {
    const n = first(isBreak);
    if (n > 0) return at(n);
  }
  // Rule 3: the last space at or before 120 (outside brackets, rule 4b).
  for (let n = MAX; n > 0; n--) if (cp[n] === " " && shut(n)) return at(n);
  // Rule 4: the last word boundary at or before 120, never inside a number or a $ amount (outside brackets first).
  let best = 0;
  let bestAny = 0;
  for (const s of new Intl.Segmenter("th", { granularity: "word" }).segment(text)) {
    const n = Array.from(text.slice(0, s.index)).length;
    if (n > MAX) break;
    if (n > 0 && !inNumber(cp[n - 1], cp[n])) {
      bestAny = n;
      if (shut(n)) best = n;
    }
  }
  if (best > 0) return at(best);
  // Only bracketed breaks are left (a field that opens a bracket and never closes it before 120): rules 3 and 4 again,
  // brackets allowed, rather than no lead at all.
  for (let n = MAX; n > 0; n--) if (cp[n] === " ") return at(n);
  // No boundary at all (one token longer than 120): show the field whole rather than cut inside a word.
  return bestAny > 0 ? at(bestAny) : { lead: text, cut: false };
}
