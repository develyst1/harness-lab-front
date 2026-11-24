import type { Segment } from "./story";
import type { GlossaryEntry, MeetingArm } from "./types";

// R-M1's glossary (SPEC-011 § Glossary in the front). The lines are the PM's (SPEC-011 § PM lines, 2026-11-23,
// [PM-decided]; Modio confirms at review, held by the owner). Same shape as page.explain.glossary. `token` is already in
// the page glossary and is reused, so these are the 11 new entries. The page's คำศัพท์ list shows them after its own.

/** The three ways of working, each as the term the PM wrote for it. */
export const KIND_TERM: Record<MeetingArm["kind"], string> = {
  local: "ในเครื่องล้วน",
  hybrid: "ในเครื่อง + … ตรวจ",
  talent: "… ล้วน (สมองเสริม)",
};

export const MEETING_GLOSSARY: GlossaryEntry[] = [
  ["สมองเสริม", "โมเดล AI ตัวใหญ่ที่อยู่นอกเครื่อง เช่น Claude หรือ DeepSeek เรียกใช้ผ่านอินเทอร์เน็ตและจ่ายตามที่ใช้ ส่งไปแค่ข้อความ ไม่ส่งเสียง", ["talent"]],
  ["ถูกตัด", "โมเดลตอบยาวจนชนเพดานความยาวที่ตั้งไว้ คำตอบเลยขาดกลางทาง ใช้ไม่ได้ แต่ยังโดนคิดเงิน"],
  ["กรรมการ", "โมเดลตัวเล็กที่ใช้ตัดสินอย่างเดียวว่า งานที่จดได้ตรงกับงานข้อไหนในเฉลย ส่วนชื่อคนกับวันส่งตรวจด้วยกฎ"],
  ["ตัวกันเดา", "กฎในแอปที่ลบชื่อคนหรือวันส่งทิ้ง ถ้าในประชุมไม่ได้พูดไว้จริง กันไม่ให้โมเดลเดาเอง"],
  ["ค่ากลาง", "ลองหลายรอบแล้วเอาผลมาเรียง หยิบตัวที่อยู่ตรงกลาง ไม่ใช่ค่าเฉลี่ย"],
  ["ถอดเสียง", "แปลงเสียงพูดในไฟล์ประชุมเป็นตัวหนังสือ ขั้นนี้ทำในเครื่องทั้งหมด"],
  ["เพดาน", "ยอดเงินสูงสุดที่ยอมให้ใช้กับงานนี้ ($6) ใช้ครบแล้วต้องหยุด"],
  ["เฉลย", "รายการงานที่ถูกต้องของแต่ละประชุม เขียนไว้ก่อนทดสอบ ใช้เทียบว่าแต่ละแบบจดได้กี่ข้อ"],
  [KIND_TERM.local, "โมเดลบน Mac ทำทุกขั้นเอง ไม่ส่งอะไรออกนอกเครื่อง ไม่เสียเงิน"],
  [KIND_TERM.hybrid, "โมเดลในเครื่องจดก่อน แล้วให้สมองเสริมอ่านข้อความประชุมกับรายการที่จดได้รอบเดียว เติมงานที่ขาดและแก้ที่ผิด"],
  [KIND_TERM.talent, "ส่งข้อความประชุมให้สมองเสริมจดเองทั้งหมด ไม่ใช้โมเดลในเครื่อง"],
];

/**
 * The glossary the section matches with: the same entries, in the same order (so an entry's index still finds its
 * line), with each arm's label added as a form of its kind's entry. "ในเครื่อง + … ตรวจ" never appears verbatim, so this
 * is how a label such as "ในเครื่อง + deepseek-flash ตรวจ" becomes the tappable term for its way of working.
 */
export function withArmLabels(glossary: readonly GlossaryEntry[], arms: readonly MeetingArm[]): GlossaryEntry[] {
  return glossary.map((g) => {
    const kind = (Object.keys(KIND_TERM) as MeetingArm["kind"][]).find((k) => KIND_TERM[k] === g[0]);
    if (!kind) return g;
    const labels = arms.filter((a) => a.kind === kind).map((a) => a.labelTh);
    return [g[0], g[1], [...(g[2] ?? []), ...labels]];
  });
}

/**
 * Only the first place of each entry across a run of texts is marked (as storySegments does inside one text); a later
 * place turns back into plain text, joined to its neighbours. The texts are unchanged.
 */
export function markOnce(texts: readonly Segment[][]): Segment[][] {
  const seen = new Set<number>();
  return texts.map((segs) => {
    const out: Segment[] = [];
    const push = (text: string) => {
      const last = out[out.length - 1];
      if (last && "text" in last) out[out.length - 1] = { text: last.text + text };
      else out.push({ text });
    };
    for (const s of segs) {
      if ("text" in s) push(s.text);
      else if (seen.has(s.entry)) push(s.term);
      else {
        seen.add(s.entry);
        out.push(s);
      }
    }
    return out;
  });
}
