import { describe, expect, test } from "bun:test";
import { minuteAt, readout } from "./loop-series";

// Expected = the reference's own read-out (reference/index.html lines 571–585) worked by hand on series D:
// the nearest gpu point by minute, % rounded, the phase of that minute, and "ความจำเต็ม ย่อตัวเอง" within 1.2 min of a
// compaction. The review phase reads "Tech Lead กำลังตรวจ" (REQ-001 Q12 (5), the PM), not the reference's "หัวหน้า…".
describe("readout — the pointer read-out on the loop chart", () => {
  // nearest to 20: 19.68 (38.4 %) beats 20.75; 20 is inside round 1 (0–38.55); compactions 9.12 / 21.32 are > 1.2 away
  test("minute 20", () => expect(readout(20)).toEqual(["นาทีที่ 20 · การ์ดทำงาน 38%", "โมเดลทำงาน รอบ 1"]));
  // nearest to 40: 39.73 (0 %); 40 is after round 1's end (38.55) and before round 2 (41.24) → review
  test("minute 40", () => expect(readout(40)).toEqual(["นาทีที่ 40 · การ์ดทำงาน 0%", "Tech Lead กำลังตรวจ"]));
  // nearest to 72: 72.23 (27.4 %); 72 is inside round 3 (61.39–72.64); 70.67 is 1.33 away
  test("minute 72", () => expect(readout(72)).toEqual(["นาทีที่ 72 · การ์ดทำงาน 27%", "โมเดลทำงาน รอบ 3"]));
  // nearest to 9: 8.95 (52.5 % → 53); compaction 9.12 is 0.12 away
  test("minute 9, next to a compaction", () =>
    expect(readout(9)).toEqual(["นาทีที่ 9 · การ์ดทำงาน 53%", "โมเดลทำงาน รอบ 1 · ความจำเต็ม ย่อตัวเอง"]));
  // after round 3 ends (72.64) → accepted; nearest 73.28 (31 %)
  test("minute 73.5", () => expect(readout(73.5)).toEqual(["นาทีที่ 74 · การ์ดทำงาน 31%", "รับงานแล้ว"]));
});

describe("minuteAt — pointer x (0–1 across the chart) to a minute, as reference line 580", () => {
  // viewBox 900 wide, plot from x 40 to 866: fraction f → (f × 900 − 40) / 826 × 74.13, clamped to 0…74.13
  test("left edge clamps to 0, right edge to the span", () => {
    expect(minuteAt(0)).toBe(0);
    expect(minuteAt(1)).toBe(74.13);
  });
  test("the plot's own start and end", () => {
    expect(minuteAt(40 / 900)).toBeCloseTo(0, 6);
    expect(minuteAt(866 / 900)).toBeCloseTo(74.13, 6);
  });
});
