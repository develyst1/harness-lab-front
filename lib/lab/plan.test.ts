import { describe, expect, test } from "bun:test";
import { baht, fillSay, planSay, tierMoney } from "./plan";
import type { Tier } from "./types";

// Tier numbers from tiers.json (pack v1 = v2, sha1 bb9a9e97…); rates from meta.json usdThb 33.6 and page.json
// plan.kwhThb 4.84. Expected values worked by hand with the reference's formula (reference/index.html lines 620–656):
//   H = hours × days · rent = rentUsd × 33.6 × H · power = watt / 1000 × H × 4.84 (no watt → none) · save = rent − power
//   months = buy / save (no buy, or save ≤ 0 → none) · class ≤ 24 pay, ≤ 48 meh, else nopay
//   text: none → "—" · > 120 → "เกิน 10 ปี" · < 12 → round(months) " เดือน" · else (months / 12).toFixed(1) " ปี"
//   baht = round, en-US grouping, " บาท".
const tier = (id: string, rentUsd: number, buy?: number, watt?: number): Tier => ({
  id, rentUsd, buy, watt, name: "", budget: "", machine: [], mem: 1, use: 1, models: [], roles: [], rentName: "", note: "",
});
const T1 = tier("T1", 0.69, 300000, 450);
const T2 = tier("T2", 2.69, 720000, 850);
const T3 = tier("T3", 5.56, 820000, 350);
const T4 = tier("T4", 38.32);
const TIERS = [T1, T2, T3, T4];
const RATES = { usdThb: 33.6, kwhThb: 4.84 };
const view = (t: Tier, h: number, d: number) => {
  const m = tierMoney(t, h, d, RATES);
  return [baht(m.rent), m.power === null ? null : baht(m.power), m.monthText, m.cls];
};

describe("tierMoney at 8 h × 22 d (H = 176)", () => {
  // T1: 0.69 × 33.6 × 176 = 4,080.384 · 0.45 × 176 × 4.84 = 383.328 · 300,000 / 3,697.056 = 81.15 → 6.76 ปี, nopay
  test("T1", () => expect(view(T1, 8, 22)).toEqual(["4,080 บาท", "383 บาท", "6.8 ปี", "nopay"]));
  // T2: 15,907.584 · 724.064 · 720,000 / 15,183.52 = 47.42 → 3.95 ปี, meh
  test("T2", () => expect(view(T2, 8, 22)).toEqual(["15,908 บาท", "724 บาท", "4.0 ปี", "meh"]));
  // T3: 32,879.616 · 298.144 · 820,000 / 32,581.472 = 25.17 → 2.10 ปี, meh
  test("T3", () => expect(view(T3, 8, 22)).toEqual(["32,880 บาท", "298 บาท", "2.1 ปี", "meh"]));
  // T4 (ref, no buy, no watt): 38.32 × 33.6 × 176 = 226,609.152 · no power · "—"
  test("T4", () => expect(view(T4, 8, 22)).toEqual(["226,609 บาท", null, "—", ""]));
});

describe("tierMoney at 24 h × 30 d (H = 720)", () => {
  // T1: 16,692.48 · 1,568.16 · 300,000 / 15,124.32 = 19.84 → 1.65 ปี, pay
  test("T1", () => expect(view(T1, 24, 30)).toEqual(["16,692 บาท", "1,568 บาท", "1.7 ปี", "pay"]));
  // T2: 65,076.48 · 2,962.08 · 720,000 / 62,114.40 = 11.59 → under 12 → round → 12 เดือน, pay
  test("T2", () => expect(view(T2, 24, 30)).toEqual(["65,076 บาท", "2,962 บาท", "12 เดือน", "pay"]));
  // T3: 134,507.52 · 1,219.68 · 820,000 / 133,287.84 = 6.15 → 6 เดือน, pay
  test("T3", () => expect(view(T3, 24, 30)).toEqual(["134,508 บาท", "1,220 บาท", "6 เดือน", "pay"]));
  test("T4", () => expect(view(T4, 24, 30)).toEqual(["927,037 บาท", null, "—", ""]));
});

describe("text edges of the reference formula", () => {
  test("over 120 months → เกิน 10 ปี; exactly 12 → 1.0 ปี", () => {
    expect(tierMoney(tier("X", 0.1, 1_000_000, 1), 2, 22, RATES).monthText).toBe("เกิน 10 ปี");
    // rent − power = 1,000 exactly: rentUsd 1000 / (33.6 × 1), H = 1 h × 1 d, no watt → no power → months null
    expect(tierMoney(tier("Y", 1000 / 33.6, 12_000, 0), 1, 1, RATES).monthText).toBe("—");
  });
  test("power above rent → save ≤ 0 → no payback", () => {
    expect(tierMoney(tier("Z", 0.01, 100_000, 5000), 8, 22, RATES)).toMatchObject({ months: null, cls: "", monthText: "—" });
  });
});

describe("planSay — the sentence under the tiers", () => {
  const FAST = "ที่ {h} ชั่วโมง × {d} วัน ซื้อแล้วคืนทุนภายใน 2 ปี: {tiers} ยิ่งเครื่องทำงานหลายชั่วโมงต่อวัน (หลายโต๊ะใช้ร่วมกัน) การซื้อยิ่งคุ้ม";
  const SLOW = "ที่ {h} ชั่วโมง × {d} วัน ไม่มีชั้นไหนคืนทุนใน 2 ปี ใช้แค่นี้เช่ายังถูกกว่าซื้อ ลองเลื่อนเป็นทั้งวันดู";
  test("8 × 22: no tier pays back within 24 months → the slow sentence", () => {
    expect(planSay(TIERS, 8, 22, RATES, FAST, SLOW)).toBe(
      "ที่ 8 ชั่วโมง × 22 วัน ไม่มีชั้นไหนคืนทุนใน 2 ปี ใช้แค่นี้เช่ายังถูกกว่าซื้อ ลองเลื่อนเป็นทั้งวันดู");
  });
  test("24 × 30: T1, T2, T3 pay back within 24 months → ชั้น 1, ชั้น 2, ชั้น 3", () => {
    expect(planSay(TIERS, 24, 30, RATES, FAST, SLOW)).toBe(
      "ที่ 24 ชั่วโมง × 30 วัน ซื้อแล้วคืนทุนภายใน 2 ปี: ชั้น 1, ชั้น 2, ชั้น 3 ยิ่งเครื่องทำงานหลายชั่วโมงต่อวัน (หลายโต๊ะใช้ร่วมกัน) การซื้อยิ่งคุ้ม");
  });
  test("fillSay fills every {h} {d} {tiers}", () => {
    expect(fillSay("{h}/{d}/{tiers}/{h}", 3, 4, "x")).toBe("3/4/x/3");
  });
  test("memory bar = use / mem, capped at 100 %", () => {
    expect(tierMoney({ ...T1, mem: 48, use: 32.2 }, 8, 22, RATES).mem).toBeCloseTo(67.083, 3);
    expect(tierMoney({ ...T1, mem: 10, use: 20 }, 8, 22, RATES).mem).toBe(100);
  });
});
