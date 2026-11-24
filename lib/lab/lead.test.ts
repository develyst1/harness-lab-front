import { describe, expect, test } from "bun:test";
import { leadOf } from "./lead";

// SPEC-013 § The lead rule. Lengths are in code points. A lead is always a prefix of the field, never rewritten.
const cps = (s: string) => Array.from(s).length;
const TH = "ภาษาไทยไม่มีการเว้นวรรคระหว่างคำจึงต้องตัดด้วยตัวแบ่งคำของเบราว์เซอร์"; // no spaces
const thai = (n: number) => Array.from(TH.repeat(Math.ceil(n / cps(TH)) + 1)).slice(0, n).join("");

describe("leadOf — rule 1: a field of 120 code points or less is its own lead", () => {
  test("a short field", () => {
    expect(leadOf("ค่าใช้จ่ายก่อนเริ่มงานลดลงราว 95%")).toEqual({ lead: "ค่าใช้จ่ายก่อนเริ่มงานลดลงราว 95%", cut: false });
  });

  test("exactly 120 code points, Thai marks counted", () => {
    const t = thai(120);
    expect(cps(t)).toBe(120);
    expect(leadOf(t)).toEqual({ lead: t, cut: false });
  });

  test("an empty string", () => {
    expect(leadOf("")).toEqual({ lead: "", cut: false });
  });
});

describe("leadOf — rule 2: the first break between code point 40 and 120, by kind in order", () => {
  test("a newline wins over an earlier Thai phrase space", () => {
    const head = `${"ก".repeat(45)} ${"ข".repeat(10)}`;
    const r = leadOf(`${head}\n${"ค".repeat(100)}`);
    expect(r).toEqual({ lead: head, cut: true });
  });

  test("an English sentence: cut after its full stop", () => {
    const first = "This field is written in English and it runs on for quite a while.";
    const r = leadOf(`${first} Then it keeps going past the limit, so that it has to be cut somewhere sensible by the rule.`);
    expect(r).toEqual({ lead: first, cut: true });
  });

  test("a Thai field with a phrase space: a space before code point 40 is skipped", () => {
    const head = `${"ก".repeat(30)} ${"ข".repeat(30)}`;
    const r = leadOf(`${head} ${"ค".repeat(80)}`);
    expect(r).toEqual({ lead: head, cut: true });
    expect(cps(r.lead)).toBe(61);
  });

  test("the space before ๆ (mai yamok) is not a break: ๆ stays with its word", () => {
    const head = `${"ก".repeat(45)}${"ข".repeat(9)}แรง ๆ`; // the space before ๆ sits at 57, inside the window
    const r = leadOf(`${head} ${"ค".repeat(80)}`);
    expect(r).toEqual({ lead: head, cut: true });
  });

  test("a space next to a Latin word is not a Thai phrase break", () => {
    // the only space in the window sits between "Claude" and "Code"; the Thai space at 130 is past 120
    const t = `${"ก".repeat(50)}Claude Code${"ข".repeat(69)} ${"ค".repeat(30)}`;
    const r = leadOf(t);
    expect(r.lead).toBe(`${"ก".repeat(50)}Claude`); // rule 3: the last space at or before 120
    expect(r.cut).toBe(true);
  });
});

describe("leadOf — rule 4b: never cut inside an unclosed ( or [", () => {
  test("a Thai phrase space inside brackets is skipped; the next one outside is used", () => {
    const head = `${"ก".repeat(45)}(${"ข".repeat(5)} ${"ค".repeat(5)})${"ง".repeat(10)}`;
    expect(leadOf(`${head} ${"จ".repeat(80)}`)).toEqual({ lead: head, cut: true });
  });

  test("the home verdict no longer ends inside “(MTP +”", () => {
    const verdict =
      "ถ้าซื้อการ์ด RTX A6000 (48 GB) มาใช้เอง ตัวที่พอดีที่สุดคือ Qwen 3.8 27B แบบละเอียด (Q8) และเมื่อใส่เทคนิคครบ (MTP + การ์ดความรู้ทีมฉบับ 2) ทำงานจริงของทีมผ่านครบ 3 จาก 3 ข้อในเวลา รอบ 10 ย้ายมาใช้ harness ของเราเอง (OpenCode) ก็ยังผ่าน และไม่ทิ้งไฟล์ขยะ ระดับตอนนี้: Junior ที่แน่น กำลังขึ้น Mid";
    expect(leadOf(verdict)).toEqual({
      lead: "ถ้าซื้อการ์ด RTX A6000 (48 GB) มาใช้เอง ตัวที่พอดีที่สุดคือ Qwen 3.8 27B แบบละเอียด (Q8) และเมื่อใส่เทคนิคครบ",
      cut: true,
    });
  });

  test("brackets that close before the window do not count", () => {
    const head = `(${"ก".repeat(10)})${"ข".repeat(40)}`;
    expect(leadOf(`${head} ${"ค".repeat(100)}`)).toEqual({ lead: head, cut: true });
  });
});

describe("leadOf — rule 3: else the last space at or before 120", () => {
  test("Latin words with no punctuation", () => {
    const t = "word ".repeat(40).trim();
    const r = leadOf(t);
    expect(r.cut).toBe(true);
    expect(r.lead).toBe("word ".repeat(24).trim());
    expect(t.startsWith(r.lead)).toBe(true);
  });
});

describe("leadOf — rule 4: else the last word boundary at or before 120 (Intl.Segmenter th)", () => {
  test("a Thai field with no space ends on a word boundary", () => {
    const t = thai(200);
    const r = leadOf(t);
    expect(r.cut).toBe(true);
    expect(t.startsWith(r.lead)).toBe(true);
    expect(cps(r.lead)).toBeLessThanOrEqual(120);
    expect(cps(r.lead)).toBeGreaterThan(100);
    const bounds = new Set(
      [...new Intl.Segmenter("th", { granularity: "word" }).segment(t)].map((s) => cps(t.slice(0, s.index))),
    );
    expect(bounds.has(cps(r.lead))).toBe(true);
  });

  test("never inside a number or a $ amount near 120", () => {
    // the numbers straddle code point 120, so a boundary inside them (after "17" or "$10") would be ≤ 120
    for (const [n, num] of [[117, "17,100"], [116, "$10.25"]] as const) {
      const t = `${thai(n)}${num} และ${thai(40)}`;
      const r = leadOf(t);
      expect(r.cut).toBe(true);
      expect(t.startsWith(r.lead)).toBe(true);
      expect(r.lead).not.toMatch(/[0-9$]/); // the cut falls before the number, never inside it
      expect(cps(r.lead)).toBeGreaterThan(100);
    }
  });
});
