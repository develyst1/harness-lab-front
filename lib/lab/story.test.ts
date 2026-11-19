import { describe, expect, test } from "bun:test";
import { escapePanels, nearestTerm, type Segment, storySegments, togglePanel } from "./story";
import type { GlossaryEntry, StoryChapter } from "./types";

const terms = (segs: Segment[]) => segs.flatMap((s) => ("term" in s ? [`${s.term}#${s.entry}`] : []));
const joined = (segs: Segment[]) => segs.map((s) => ("term" in s ? s.term : s.text)).join("");

describe("storySegments — verbatim terms in a chapter's text (SPEC-006 § The matcher)", () => {
  test("a Latin form matches only at a word edge: Mid, not inside Midway", () => {
    const segs = storySegments("Midway, then Mid.", [["Mid", "m"]]);
    expect(segs).toEqual([{ text: "Midway, then " }, { term: "Mid", entry: 0 }, { text: "." }]);
  });

  test("digits count as Latin for the edge: Q8 inside (Q8) matches, inside Q80 it does not", () => {
    expect(terms(storySegments("(Q8) ไฟล์", [["Q8", "q"]]))).toEqual(["Q8#0"]);
    expect(terms(storySegments("Q80 ไฟล์", [["Q8", "q"]]))).toEqual([]);
  });

  test("longest form first: Tech Lead over Lead", () => {
    const g: GlossaryEntry[] = [["Lead", "l"], ["Tech Lead", "t"]];
    expect(terms(storySegments("ผมเล่นเป็น Tech Lead ตีกลับ", g))).toEqual(["Tech Lead#1"]);
  });

  test("longest form first in Thai: ความจำเต็ม over ความจำ", () => {
    const g: GlossaryEntry[] = [["ความจำ", "a"], ["ความจำเต็ม", "b"]];
    expect(terms(storySegments("ความจำเต็มบ่อย", g))).toEqual(["ความจำเต็ม#1"]);
  });

  test("first place per entry only; a later place is consumed, so a shorter form cannot match inside it", () => {
    const g: GlossaryEntry[] = [["ความจำ", "a"], ["ความจำเต็ม", "b"]];
    const segs = storySegments("ความจำเต็ม แล้ว ความจำเต็ม อีก ความจำ", g);
    expect(terms(segs)).toEqual(["ความจำเต็ม#1", "ความจำ#0"]);
    expect(segs[1]).toEqual({ text: " แล้ว ความจำเต็ม อีก " });
  });

  test("an alias marks its entry, once: 284B then 125B (both aliases of 27B)", () => {
    const g: GlossaryEntry[] = [["27B", "b", ["284B", "125B"]]];
    expect(storySegments("284B และ 125B", g)).toEqual([{ term: "284B", entry: 0 }, { text: " และ 125B" }]);
  });

  test("no overlap, nothing lost: the segments join back to the text", () => {
    const text = STORY.map(([, , t]) => t).join(" ");
    expect(joined(storySegments(text, GLOSSARY))).toBe(text);
  });

  test("no glossary match → one text segment; empty text → []", () => {
    expect(storySegments("ไม่มีคำ", [["MTP", "m"]])).toEqual([{ text: "ไม่มีคำ" }]);
    expect(storySegments("", [["MTP", "m"]])).toEqual([]);
  });

  test("pack v3.6: 13 entries / 17 places over the 7 chapters (TASK-023 comp, SPEC-006)", () => {
    const perChapter = STORY.map(([, , text]) => terms(storySegments(text, GLOSSARY)));
    const places = perChapter.flat();
    expect(places.length).toBe(17);
    expect(new Set(places.map((p) => p.split("#")[1])).size).toBe(13);
    expect(perChapter.map((c) => c.map((p) => p.split("#")[0]))).toEqual([
      ["โมเดล", "การ์ดความรู้ทีม"],
      ["Tech Lead", "ตีกลับ", "โมเดล"],
      ["Q8", "ความจำ", "โมเดล"],
      ["โมเดล"],
      ["llama-server", "MTP"],
      ["โมเดล", "284B", "Colibrì", "เครื่องเช่า"],
      ["Junior", "Mid"],
    ]);
  });
});

describe("open panels — one per chapter, a second tap or Esc closes (SPEC-006 § Front)", () => {
  test("a tap opens; a second tap on the same term closes", () => {
    const one = togglePanel({}, 0, "a");
    expect(one).toEqual({ 0: "a" });
    expect(togglePanel(one, 0, "a")).toEqual({});
  });

  test("another term in the same chapter replaces the open one; other chapters stay", () => {
    expect(togglePanel({ 0: "a", 2: "x" }, 0, "b")).toEqual({ 0: "b", 2: "x" });
  });

  test("Esc on a focused open term closes only that one", () => {
    expect(escapePanels({ 0: "a", 2: "x" }, "x")).toEqual({ 0: "a" });
  });

  test("Esc elsewhere (or on a closed term) closes every open one; nothing open → same object back", () => {
    expect(escapePanels({ 0: "a", 2: "x" }, null)).toEqual({});
    expect(escapePanels({ 0: "a" }, "b")).toEqual({});
    const none = {};
    expect(escapePanels(none, null)).toBe(none);
  });
});

describe("nearestTerm — a tap off a term opens the nearest one within 22 px (SPEC-006 § Amendment, REQ-006 Q3 a)", () => {
  const box = (left: number, top: number, right: number, bottom: number) => ({ left, top, right, bottom });
  // two terms on one line: A at x 100–120, B at x 140–180, both y 10–30
  const two = [{ rects: [box(100, 10, 120, 30)] }, { rects: [box(140, 10, 180, 30)] }];

  test("a point inside a term's box → that term", () => {
    expect(nearestTerm({ x: 110, y: 20 }, two)).toBe(0);
    expect(nearestTerm({ x: 150, y: 12 }, two)).toBe(1);
  });

  test("a point between two terms → the nearer one", () => {
    expect(nearestTerm({ x: 125, y: 20 }, two)).toBe(0); // 5 px from A, 15 px from B
    expect(nearestTerm({ x: 136, y: 20 }, two)).toBe(1); // 16 px from A, 4 px from B
  });

  test("a tie → the lower index", () => {
    expect(nearestTerm({ x: 130, y: 20 }, two)).toBe(0); // 10 px from each
  });

  test("above or below a box counts the straight distance; a corner counts the diagonal", () => {
    expect(nearestTerm({ x: 110, y: 50 }, two)).toBe(0); // 20 px below A
    expect(nearestTerm({ x: 90, y: 40 }, two)).toBe(0); // √(10² + 10²) ≈ 14.1 px from A's corner
  });

  test("farther than 22 px from every term → null; the limit can be set", () => {
    expect(nearestTerm({ x: 110, y: 53 }, two)).toBeNull(); // 23 px below A
    expect(nearestTerm({ x: 70, y: 20 }, two)).toBeNull(); // 30 px left of A
    expect(nearestTerm({ x: 70, y: 20 }, two, 30)).toBe(0);
  });

  test("a term that wraps (two boxes) → the distance to its nearer box", () => {
    const wrapped = [{ rects: [box(300, 10, 340, 30), box(0, 36, 30, 56)] }, { rects: [box(60, 36, 90, 56)] }];
    expect(nearestTerm({ x: 40, y: 46 }, wrapped)).toBe(0); // 10 px from its 2nd box, 20 px from the other term
    expect(nearestTerm({ x: 320, y: 20 }, wrapped)).toBe(0);
  });

  test("no terms, or a term with no boxes → null", () => {
    expect(nearestTerm({ x: 0, y: 0 }, [])).toBeNull();
    expect(nearestTerm({ x: 0, y: 0 }, [{ rects: [] }])).toBeNull();
  });
});

// Pack v3.6 page.json → explain (sha1 7c12fcbd…, read 2026-11-19): the 7 chapters as they are, and the 80 glossary
// entries with their aliases. The plain lines are left empty here: the matcher reads only terms and aliases.
const STORY: StoryChapter[] = [["รอบ 1–2", "เริ่มจากศูนย์", "ให้โมเดลทำงานจริงของทีม 3 ข้อ ผ่าน 2 ข้อง่าย ข้อยากพัง พอใส่การ์ดความรู้ทีม ความผิดแบบเดิมหายไป"], ["รอบ 3", "มีคนตรวจงาน", "ผมเล่นเป็น Tech Lead ตีกลับ 2 ครั้ง โมเดลแก้จนรับงานได้ แต่ยังมีจุดหนึ่งที่ทั้งโมเดลและคนตรวจพลาด"], ["รอบ 4", "หาโมเดลที่พอดีการ์ด", "เปลี่ยนเป็นไฟล์ละเอียดขึ้น (Q8) ความจำยาวขึ้น จับจุดที่เคยพลาดได้ ส่วนโมเดลที่เร็วกว่าเขียนเทสต์ที่ใช้ไม่ได้"], ["รอบ 5", "งานใหญ่ขึ้น เวลาไม่พอ", "ลองงานใหม่ที่ใหญ่กว่า โมเดลทำถูกแต่พิมพ์ช้า และเสียเวลากับการสร้างไฟล์ใหม่ เลยไม่ทันเวลา"], ["รอบ 6", "เร็วขึ้น 2 เท่า", "เปลี่ยนตัวรันเป็น llama-server เปิด MTP และสอนวิธีสร้างไฟล์ในการ์ด งานที่ไม่ทันผ่านใน 41 นาที"], ["รอบ 7–8", "ลองโมเดลยักษ์และ Colibrì", "โมเดล 284B ใหญ่เกินห้องเช่า Colibrì ใช้ไม่ได้บนเครื่องเช่า แต่ได้วิธีรันโมเดล 125B ให้เร็ว และพบว่าผู้ตรวจตัวเล็กตรวจได้เท่าตัวใหญ่ถ้าวางวิธีตรวจดี"], ["รอบ 9", "ยืนยันผล", "ลองอีก 2 ข้อ ผ่านครบ 3/3 เร็วขึ้นเกือบเท่าตัว ระดับตอนนี้ Junior ที่แน่น กำลังขึ้น Mid"]];
const GLOSSARY: GlossaryEntry[] = [["AI", ""], ["โมเดล", ""], ["โมเดลโอเพนซอร์ส", ""], ["frontier", ""], ["27B", "", ["35B", "80B", "123B", "125B", "284B", "120b", "14B"]], ["A3B", ""], ["token", ""], ["คำ/วินาที", ""], ["ความจำ", ""], ["64k", "", ["128k", "30k"]], ["ความจำเต็ม", ""], ["บริบท", ""], ["แคช", ""], ["การ์ดจอ", "", ["GPU"]], ["GB", ""], ["RAM", ""], ["CPU", ""], ["PSU", ""], ["UPS", ""], ["W", ""], ["Ft", ""], ["คืนทุน", ""], ["เครื่องเช่า", ""], ["Runpod", ""], ["secure", ""], ["community", ""], ["ตัวรันโมเดล", ""], ["Ollama", ""], ["llama.cpp", ""], ["llama-server", ""], ["Colibrì", ""], ["MTP", ""], ["draft-mtp", ""], ["MoE", ""], ["expert", ""], ["Q4", ""], ["Q8", ""], ["IQ2_XS", "", ["บีบอัด"]], ["xhigh", ""], ["HTTP 400", ""], ["fine-tune", ""], ["SWE-bench", ""], ["harness", ""], ["Claude Code", ""], ["--bare", ""], ["Edit", "", ["Read", "Bash"]], ["shell", ""], ["ls", ""], ["ssh", ""], ["log", ""], ["repo", ""], ["TypeScript", ""], ["Bun", ""], ["tsc", ""], ["การ์ดความรู้ทีม", ""], ["แอบใส่ความผิด", ""], ["จุดตรวจ", ""], ["ตีกลับ", ""], ["MISSING", ""], ["Junior", ""], ["Mid", ""], ["Senior", ""], ["Lead", ""], ["Tech Lead", ""], ["Staff", ""], ["Principal", ""], ["Engineer", ""], ["Backend", ""], ["TASK", ""], ["SPEC", ""], ["REQ", ""], ["SA", ""], ["PM", ""], ["QA", ""], ["BA", ""], ["AI Harnesser", ""], ["Modio", ""], ["R1", "", ["R2", "R3", "R4a", "R4b", "R5", "R6", "R9"]], ["B3", "", ["B1", "B2", "B4", "B5"]], ["T01", "", ["T06", "T16"]]];
