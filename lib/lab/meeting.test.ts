import { describe, expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Meeting } from "@/components/partials/lab/Meeting";
import { cutText, doneText, fixtureHeading, foundShare, foundText, money, mss, noBreak, usdRange, visualArms } from "./meeting";
import { KIND_TERM, MEETING_GLOSSARY, markOnce, withArmLabels } from "./meetingGlossary";
import { storySegments } from "./story";
import type { GlossaryEntry, Meeting as MeetingData, MeetingArm } from "./types";

// SPEC-011 § Display rules: one rule per number. Test data only.
describe("display rules (SPEC-011)", () => {
  test("found: found/N; null or missing → — (U+2014), never 0 or blank", () => {
    expect(foundText(12, 14)).toBe("12/14");
    expect(foundText(0, 5)).toBe("0/5");
    expect(foundText(null, 42)).toBe("—");
    expect(foundText(undefined, 42)).toBe("—");
    expect(foundText(null, 42).codePointAt(0)).toBe(0x2014);
  });

  test("found share for the visual: found ÷ N; null or missing → null (no bar)", () => {
    expect(foundShare(7, 14)).toBe(0.5);
    expect(foundShare(null, 14)).toBeNull();
    expect(foundShare(undefined, 14)).toBeNull();
  });

  test("seconds: m:ss (13 → 0:13, 288 → 4:48); missing → —", () => {
    expect(mss(13)).toBe("0:13");
    expect(mss(288)).toBe("4:48");
    expect(mss(1101)).toBe("18:21");
    expect(mss(undefined)).toBe("—");
    expect(mss(null)).toBe("—");
  });

  test("money: $ + String(n) — $0.003 never $0.00, $6 not $6.00", () => {
    expect(money(0.003)).toBe("$0.003");
    expect(money(5.48)).toBe("$5.48");
    expect(money(6)).toBe("$6");
    expect(money(0.1)).toBe("$0.1");
    expect(money(0)).toBe("$0");
  });

  test("USD per meeting: $lo–$hi (en dash); lo === hi → one value", () => {
    expect(usdRange([0.003, 0.023])).toBe("$0.003–$0.023");
    expect(usdRange([0, 0])).toBe("$0");
  });

  test("done a/b, cut rate cut/calls, a meeting's heading `<minutes> นาที · <actions> งาน`", () => {
    expect(doneText([10, 11])).toBe("10/11");
    expect(cutText({ model: "m", cut: 7, calls: 13 })).toBe("7/13");
    expect(fixtureHeading({ id: "f", minutes: 4.1, actions: 5 })).toBe("4.1 นาที · 5 งาน");
    expect(fixtureHeading({ id: "f", minutes: 56.4, actions: 42 })).toBe("56.4 นาที · 42 งาน");
  });
});

describe("visualArms — the comp's proposal: the first arm of each kind, in pack order", () => {
  const arm = (id: string, kind: MeetingArm["kind"]): MeetingArm =>
    ({ id, labelTh: id, kind, found: {}, done: [1, 1], usdPerMeeting: [0, 0] });

  test("one local, one hybrid, one talent, each the first of its kind", () => {
    const arms = [arm("L", "local"), arm("H1", "hybrid"), arm("H2", "hybrid"), arm("T1", "talent"), arm("T2", "talent")];
    expect(visualArms(arms).map((a) => a.id)).toEqual(["L", "H1", "T1"]);
  });

  test("a kind with no arm is skipped", () => {
    expect(visualArms([arm("T1", "talent"), arm("L", "local")]).map((a) => a.id)).toEqual(["T1", "L"]);
  });
});

describe("noBreak — a USD range stays on one line (SPEC-011 § AC-1 result, the PM's fix)", () => {
  test("every $lo–$hi range becomes one { nb } part; the rest is kept as it is", () => {
    expect(noBreak("จ่าย $0.003–$0.023 ต่อประชุม")).toEqual(["จ่าย ", { nb: "$0.003–$0.023" }, " ต่อประชุม"]);
    expect(noBreak("$0.07–$0.1 และ $0.005–$0.022")).toEqual([{ nb: "$0.07–$0.1" }, " และ ", { nb: "$0.005–$0.022" }]);
  });

  test("no range → the text as one part; a single $ value or 1–2 is not a range; empty → []", () => {
    expect(noBreak("($2.42 จาก $5.48) 1–2 เซนต์")).toEqual(["($2.42 จาก $5.48) 1–2 เซนต์"]);
    expect(noBreak("")).toEqual([]);
  });
});

describe("the meeting glossary (SPEC-011 § Glossary in the front; § PM lines)", () => {
  test("the PM's 11 new entries, in the PM's order; token is the page's and is not repeated", () => {
    expect(MEETING_GLOSSARY.map((g) => g[0])).toEqual(["สมองเสริม", "ถูกตัด", "กรรมการ", "ตัวกันเดา", "ค่ากลาง", "ถอดเสียง", "เพดาน",
      "เฉลย", "ในเครื่องล้วน", "ในเครื่อง + … ตรวจ", "… ล้วน (สมองเสริม)"]);
    expect(MEETING_GLOSSARY[0][2]).toEqual(["talent"]);
    expect(MEETING_GLOSSARY.flatMap((g) => [g[0], ...(g[2] ?? [])])).not.toContain("token");
    expect(MEETING_GLOSSARY[6][1]).toBe("ยอดเงินสูงสุดที่ยอมให้ใช้กับงานนี้ ($6) ใช้ครบแล้วต้องหยุด");
  });

  const arm = (id: string, kind: MeetingArm["kind"], labelTh: string): MeetingArm =>
    ({ id, labelTh, kind, found: {}, done: [1, 1], usdPerMeeting: [0, 0] });
  const arms = [arm("L", "local", "ในเครื่องล้วน (Qwen3 14B)"), arm("H1", "hybrid", "ในเครื่อง + deepseek-flash ตรวจ"),
    arm("H2", "hybrid", "ในเครื่อง + Claude Opus 5.5 ตรวจ"), arm("T1", "talent", "deepseek-flash ล้วน")];
  const page: GlossaryEntry[] = [["token", "t"], ["โมเดล", "m"]];

  test("withArmLabels: each arm's label becomes a form of its kind's entry; order, terms and lines unchanged", () => {
    const g = withArmLabels([...page, ...MEETING_GLOSSARY], arms);
    expect(g.length).toBe(13);
    expect(g.map((e) => [e[0], e[1]])).toEqual([...page, ...MEETING_GLOSSARY].map((e) => [e[0], e[1]]));
    const forms = (term: string) => g.find((e) => e[0] === term)![2];
    expect(forms(KIND_TERM.local)).toEqual(["ในเครื่องล้วน (Qwen3 14B)"]);
    expect(forms(KIND_TERM.hybrid)).toEqual(["ในเครื่อง + deepseek-flash ตรวจ", "ในเครื่อง + Claude Opus 5.5 ตรวจ"]);
    expect(forms(KIND_TERM.talent)).toEqual(["deepseek-flash ล้วน"]);
    expect(forms("สมองเสริม")).toEqual(["talent"]);
    expect(MEETING_GLOSSARY[8][2]).toBeUndefined(); // the input is not changed
  });

  test("a label is one whole term, matched to its kind; the full local label wins over its kind's shorter term", () => {
    const g = withArmLabels(MEETING_GLOSSARY, arms);
    expect(storySegments("ในเครื่อง + deepseek-flash ตรวจ", g)).toEqual([{ term: "ในเครื่อง + deepseek-flash ตรวจ", entry: 9 }]);
    expect(storySegments("deepseek-flash ล้วน", g)).toEqual([{ term: "deepseek-flash ล้วน", entry: 10 }]);
    expect(storySegments("ในเครื่องล้วน (Qwen3 14B)", g)).toEqual([{ term: "ในเครื่องล้วน (Qwen3 14B)", entry: 8 }]);
    expect(storySegments("ในเครื่องล้วนจดงาน", g)).toEqual([{ term: "ในเครื่องล้วน", entry: 8 }, { text: "จดงาน" }]);
  });

  test("markOnce: an entry is marked at its first place across the texts only; every text is unchanged", () => {
    const texts = ["ใช้ talent จ่าย", "สมองเสริม ถูกตัด", "ถูกตัด อีก talent"].map((t) => storySegments(t, MEETING_GLOSSARY));
    const out = markOnce(texts);
    expect(out).toEqual([
      [{ text: "ใช้ " }, { term: "talent", entry: 0 }, { text: " จ่าย" }],
      [{ text: "สมองเสริม " }, { term: "ถูกตัด", entry: 1 }],
      [{ text: "ถูกตัด อีก talent" }],
    ]);
    expect(out.map((s) => s.map((x) => ("term" in x ? x.term : x.text)).join(""))).toEqual(["ใช้ talent จ่าย", "สมองเสริม ถูกตัด",
      "ถูกตัด อีก talent"]);
  });
});

// A view as toView gives it (SPEC-011 § Contract 3). Test data only: made-up labels and texts in the pack's shape.
const view: MeetingData = {
  titleTh: "ชื่อ", questionTh: "คำถาม", date: "2026-11-23", costUsd: 5.48, capUsd: 6, cutWasteUsd: 2.42,
  howTh: "มีเฉลย ถอดเสียงในเครื่อง ใช้ talent และกรรมการ", costNoteTh: "จากเพดาน $6 ถูกตัด $2.42",
  fixtures: [{ id: "f1", minutes: 4.1, actions: 5 }, { id: "f2", minutes: 56.4, actions: 42 }],
  arms: [
    { id: "L", labelTh: "ในเครื่องล้วน (M)", kind: "local", found: { f1: 2, f2: null }, done: [4, 5], secShort: 143, usdPerMeeting: [0, 0] },
    { id: "H", labelTh: "ในเครื่อง + x ตรวจ", kind: "hybrid", found: { f1: 5 }, done: [3, 3], secShort: 233, usdPerMeeting: [0.003, 0.023] },
    { id: "T", labelTh: "x ล้วน", kind: "talent", found: { f1: 5, f2: 38 }, done: [12, 12], secShort: 13, secLong: 88,
      usdPerMeeting: [0.005, 0.022] },
  ],
  cutRates: [{ model: "m", cut: 7, calls: 13 }],
  findings: [{ th: "ในเครื่องล้วนจดได้ครึ่ง เกิน 3,000 token" }, { th: "talent ถูกตัด" }],
  next: [{ th: "ลองต่อ", usd: 0.1 }],
};
const PAGE_GLOSSARY: GlossaryEntry[] = [["token", "หน่วยที่โมเดลนับข้อความ"], ["โมเดล", "m"]];
const html = renderToStaticMarkup(createElement(Meeting, { meeting: view, glossary: PAGE_GLOSSARY }));
const count = (re: RegExp) => (html.match(re) ?? []).length;

describe("Meeting — the rendered section (TASK-041)", () => {
  test("one section; every number keeps its hook; — for null and missing, and the legend", () => {
    expect(count(/<section id="meeting"/g)).toBe(1);
    expect(count(/data-field="found:/g)).toBe(6);
    expect(count(/data-field="v-found:/g)).toBe(6);
    expect(count(/<td[^>]*data-field="found:[^"]*"[^>]*class="dash"/g)).toBe(2); // L·f2 null, H·f2 missing
    expect(count(/<td[^>]*data-field="secLong:[^"]*"[^>]*class="dash"/g)).toBe(2);
    expect(html).toContain("— = ไม่มีรอบไหนจดจบ (ถูกตัด) หรือยังไม่ได้รัน");
  });

  test("the lead's $0.003–$0.023 sits whole in one no-break span", () => {
    expect(html).toContain('<span class="nb">$0.003–$0.023</span>');
  });

  test("terms are buttons that open their line: the lead's, the visual's three labels, the fold's; first place per group", () => {
    const terms = [...html.matchAll(/<button type="button" class="term[^"]*"[^>]*><span>([^<]*)<\/span><\/button>/g)].map((m) => m[1]);
    expect(terms).toEqual([
      "โมเดล", "สมองเสริม", "ถูกตัด", // the lead
      "ในเครื่องล้วน (M)", "ในเครื่อง + x ตรวจ", "x ล้วน", // the visual's labels
      "เฉลย", "ถอดเสียง", "talent", "กรรมการ", // วัดอย่างไร
      "เพดาน", "ถูกตัด", // the cost note
      "ในเครื่องล้วน", "token", // the findings
    ]);
    expect(count(/aria-expanded="false"/g)).toBe(terms.length);
    expect(count(/<p id="mt-[^"]+" class="gloss" hidden="">/g) + count(/<span id="mt-[^"]+" class="gloss" hidden="">/g)).toBe(terms.length);
    expect(html).toContain("<b>x ล้วน</b> ส่งข้อความประชุมให้สมองเสริมจดเองทั้งหมด ไม่ใช้โมเดลในเครื่อง");
    expect(html).toContain("<b>token</b> หน่วยที่โมเดลนับข้อความ");
  });

  test("the table's arm labels stay plain text (the visual carries the kind terms)", () => {
    expect(html).toContain('<th role="rowheader" scope="row">ในเครื่อง + x ตรวจ</th>');
  });
});
