import type { MeetingArm, MeetingCutRate, MeetingFixture } from "./types";

// R-M1 (SPEC-011 § Display rules): one rule per number, and the words of the section. Pure functions, no React.

/** Shown for a null or missing number (U+2014), never 0 or blank (REQ-010 req 2, AC-3). */
export const DASH = "—";

const pad = (n: number) => String(n).padStart(2, "0");

/** found/N; null or missing → —. */
export function foundText(found: number | null | undefined, n: number): string {
  return found == null ? DASH : `${found}/${n}`;
}

/** found ÷ N for the visual's bar; null or missing → null (an empty track). */
export function foundShare(found: number | null | undefined, n: number): number | null {
  return found == null ? null : found / n;
}

/** Seconds as m:ss (13 → 0:13, 288 → 4:48); missing → —. */
export function mss(seconds: number | null | undefined): string {
  if (seconds == null) return DASH;
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}

/** $ + String(n): the file's precision as it is ($0.003, never $0.00; $6, not $6.00). */
export function money(n: number): string {
  return `$${String(n)}`;
}

/** USD per meeting [lo, hi] → $lo–$hi; lo === hi → one value. */
export function usdRange([lo, hi]: readonly [number, number]): string {
  return lo === hi ? money(lo) : `${money(lo)}–${money(hi)}`;
}

/** Running text cut so that every USD range (`$lo–$hi`) stays on one line (SPEC-011 § AC-1 result, the PM's fix): a
 * plain run is a string, a range is `{ nb }`. Joined back, the parts give the text unchanged. */
export function noBreak(text: string): (string | { nb: string })[] {
  const out: (string | { nb: string })[] = [];
  let last = 0;
  for (const m of text.matchAll(/\$\d[\d.,]*–\$\d[\d.,]*/g)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ nb: m[0] });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** done [finished, tries] → finished/tries. */
export function doneText([a, b]: readonly [number, number]): string {
  return `${a}/${b}`;
}

/** A model's cut rate: cut/calls. */
export function cutText(c: MeetingCutRate): string {
  return `${c.cut}/${c.calls}`;
}

/** A meeting's heading: `<minutes> นาที · <actions> งาน` (never its id). */
export function fixtureHeading(f: MeetingFixture): string {
  return `${f.minutes} นาที · ${f.actions} งาน`;
}

/** The comp's proposal for the small visual (owner's choice at AC-1): the first arm of each kind, in pack order. */
export function visualArms(arms: readonly MeetingArm[]): MeetingArm[] {
  const seen = new Set<string>();
  return arms.filter((a) => !seen.has(a.kind) && seen.add(a.kind));
}

// The section's words. The legend and "ดูตัวเลขทั้งหมด" are decided (SPEC-011); the chapter lead is the PM's
// (SPEC-011 § PM lines, 2026-11-23, three lines shown as written). PROPOSED = the FE's wording from the comp; it stands
// after AC-1 (SPEC-011 § AC-1 result, 2026-11-23: the owner saw the comp live and corrected none of it).
export const MEETING_WORDS = {
  kicker: "งานศึกษา", // PROPOSED
  lead: [
    "ให้โมเดลในเครื่องจดประชุมเองล้วน ๆ จดงานที่ต้องทำได้ราวครึ่งเดียว (2/5, 4/7, 7/14) และจดประชุม 56 นาทีไม่จบ",
    "ให้สมองเสริมราคาถูกอ่านตรวจซ้ำอีกรอบ งานที่จดได้ขยับเป็น 5/5, 5/7, 12/14 จ่าย $0.003–$0.023 ต่อประชุม",
    "ให้สมองเสริมจดเองทั้งหมดก็ได้ครบกว่า แต่ความเสี่ยงคือคำตอบถูกตัดกลางทาง และยังเสียเงิน",
  ], // PM-decided, SPEC-011 § PM lines
  visualTitle: "จดงานที่ต้องทำได้กี่ข้อ จากที่มีในเฉลย", // PROPOSED
  disclosure: "ดูตัวเลขทั้งหมด", // decided
  how: "วัดอย่างไร", // PROPOSED
  arm: "แบบ", // PROPOSED
  done: "จดจบ", // PROPOSED
  secShort: "เวลา ประชุมสั้น", // PROPOSED
  secLong: "เวลา ประชุมยาว", // PROPOSED
  usd: "ต่อประชุม", // PROPOSED
  cutRates: "ถูกตัดกลางทาง (ครั้ง / ครั้งที่เรียก)", // PROPOSED
  cost: "ค่าใช้จ่ายของงานนี้", // PROPOSED
  spent: "ใช้ไป", // PROPOSED
  cap: "เพดาน", // PROPOSED
  cutWaste: "เป็นคำตอบที่ถูกตัด", // PROPOSED
  findings: "สิ่งที่พบ", // PROPOSED
  next: "จะลองต่อ", // PROPOSED
  legend: "— = ไม่มีรอบไหนจดจบ (ถูกตัด) หรือยังไม่ได้รัน", // decided, word for word (REQ-010 req 2)
  // The study page's footer line in place of the site footer (whose reason is the runs'; the meetings are synthetic).
  // Modio, REQ-010 review A1 fix 1, word for word (REQ-012 § Modio's text fixes 3; TASK-058 Q3: Footer.tsx shows it).
  logsNote: "บันทึกฉบับเต็มและคำตรวจทุกรอบเก็บไว้บนเครื่องของผมเท่านั้น หน้านี้แสดงเฉพาะตัวเลขและขั้นตอน",
} as const;
