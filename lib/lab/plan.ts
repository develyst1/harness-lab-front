import type { Tier } from "./types";

// สเปกและงบ money, exactly as the reference page computes it (reference/index.html lines 620–656). The two rates come
// from the pack: meta.json → usdThb and page.json → plan.kwhThb.

export interface Rates {
  usdThb: number;
  kwhThb: number;
}

export type PayClass = "" | "pay" | "meh" | "nopay";

export interface TierMoney {
  rent: number;
  power: number | null;
  months: number | null;
  cls: PayClass;
  monthText: string;
  /** The memory bar: share of the card the main model uses, in %, capped at 100. */
  mem: number;
}

/** Rounded, en-US grouping, " บาท" (reference line 617). */
export const baht = (n: number): string => `${Math.round(n).toLocaleString("en-US")} บาท`;

export function tierMoney(t: Tier, hours: number, days: number, rates: Rates): TierMoney {
  const H = hours * days;
  const rent = t.rentUsd * rates.usdThb * H;
  const power = t.watt ? (t.watt / 1000) * H * rates.kwhThb : null;
  const save = power === null ? null : rent - power;
  const months = t.buy && save !== null && save > 0 ? t.buy / save : null;
  const cls: PayClass = months === null ? "" : months <= 24 ? "pay" : months <= 48 ? "meh" : "nopay";
  const monthText =
    months === null
      ? "—"
      : months > 120
        ? "เกิน 10 ปี"
        : months < 12
          ? `${Math.round(months)} เดือน`
          : `${(months / 12).toFixed(1)} ปี`;
  return { rent, power, months, cls, monthText, mem: Math.min(100, (t.use / t.mem) * 100) };
}

/** Fill the page.json templates `{h}`, `{d}`, `{tiers}`. */
export const fillSay = (template: string, hours: number, days: number, tiers: string): string =>
  template.replaceAll("{h}", String(hours)).replaceAll("{d}", String(days)).replaceAll("{tiers}", tiers);

/** The sentence under the tiers: the tiers to buy that pay back within 24 months, or the "rent is cheaper" line. */
export function planSay(tiers: Tier[], hours: number, days: number, rates: Rates, fast: string, slow: string): string {
  const quick = tiers
    .filter((t) => t.buy)
    .filter((t) => {
      const m = tierMoney(t, hours, days, rates).months;
      return m !== null && m <= 24;
    })
    .map((t) => t.id.replace("T", "ชั้น "));
  return quick.length ? fillSay(fast, hours, days, quick.join(", ")) : fillSay(slow, hours, days, "");
}
