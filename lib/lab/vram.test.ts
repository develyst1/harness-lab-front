import { describe, expect, test } from "bun:test";
import { gb, pct, tight } from "./vram";

// Card size and comfort line from pack v2 page.json → behind.gauge: cardMiB 49140, comfort 0.75.
// Peaks from runs.json v2 (item B3): R4a 32967, R4b 37817, R3 21152 MiB. Expected values worked by hand with the
// reference page's formula (reference/index.html lines 460–462): pct = round(mib / cardMiB × 100), gb = (mib / 1024).toFixed(1).
const CARD = 49140;
const COMFORT = 0.75;

describe("vram — the reference page's card-memory formula, card size from the pack", () => {
  test("R4a: 32967 / 49140 = 67.09 % → 67; free (16173 / 1024 = 15.79) → 15.8 GB; not tight", () => {
    expect(pct(32967, CARD)).toBe(67);
    expect(gb(CARD - 32967)).toBe("15.8");
    expect(tight(32967, CARD, COMFORT)).toBe(false);
  });

  test("R4b: 76.96 % → 77, tight; free (11323 / 1024 = 11.06) → 11.1 GB", () => {
    expect(pct(37817, CARD)).toBe(77);
    expect(gb(CARD - 37817)).toBe("11.1");
    expect(tight(37817, CARD, COMFORT)).toBe(true);
  });

  test("R3: 43.04 % → 43; free (27988 / 1024 = 27.33) → 27.3 GB", () => {
    expect(pct(21152, CARD)).toBe(43);
    expect(gb(CARD - 21152)).toBe("27.3");
  });

  test("tight is pct > comfort × 100: 37100 MiB = 75.498 % → 75 not tight; 37101 MiB = 75.500 % → 76 tight", () => {
    expect(pct(37100, CARD)).toBe(75);
    expect(tight(37100, CARD, COMFORT)).toBe(false);
    expect(pct(37101, CARD)).toBe(76);
    expect(tight(37101, CARD, COMFORT)).toBe(true);
  });
});
