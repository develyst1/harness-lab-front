// Rent 3's loop chart series, copied by script from reference/index.html lines 550–551 (series D; REQ-001 req 2 allows
// data inside the reference page). Kept in the front until Modio sends a series file (SPEC-001 § Pack v2 "Loop chart").
// gpu: [minute, GPU %] averaged per minute · rounds / ends: each review round's start and end minute · compact: minutes
// where the context filled and the model compacted · span: the loop's length in minutes.

export interface LoopSeries {
  gpu: [number, number][];
  rounds: number[];
  ends: number[];
  compact: number[];
  span: number;
}

export const LOOP: LoopSeries = {"gpu":[[7.87,42.8],[8.95,52.5],[10.03,52.4],[11.1,44.2],[12.17,47.5],[13.25,43.6],[14.33,49.1],[15.42,47.2],[16.48,58.4],[17.57,45.7],[18.62,51.6],[19.68,38.4],[20.75,46.8],[21.83,42.3],[22.92,51.9],[24,57.8],[25.07,56.3],[26.12,59.8],[27.2,40.4],[28.27,41.1],[29.35,36.1],[30.43,49.8],[31.5,42],[32.58,42.6],[33.67,50.2],[34.73,50.5],[35.82,37.2],[36.9,39.9],[37.98,36.9],[39.03,26.4],[39.73,0],[40.42,0],[41.1,14.5],[41.82,42.2],[42.9,47.7],[43.98,40.1],[45.07,49.7],[46.15,39.1],[47.22,45.8],[48.3,45.2],[49.38,58.7],[50.45,46.4],[51.53,59.5],[52.6,41.2],[53.65,35.7],[54.73,43.8],[55.8,44.6],[56.87,39.3],[57.93,24.9],[59,34.7],[60.08,38.2],[60.77,6.3],[61.45,23.4],[62.52,56.2],[63.6,43.3],[64.7,47.2],[65.78,50.9],[66.85,47.5],[67.93,48.3],[69.02,49.5],[70.08,49.4],[71.15,45.1],[72.23,27.4],[73.28,31],[73.95,0]],"rounds":[0,41.24,61.39],"ends":[38.55,59.05,72.64],"compact":[9.12,21.32,35.37,53.7,70.67],"span":74.13};

/** The chart's geometry (reference line 552): a 900 × 190 viewBox, plot margins left 40, right 34, top 26, bottom 28. */
export const CHART = { W: 900, H: 190, L: 40, R: 34, T: 26, B: 28 } as const;

/** Pointer position as a fraction of the chart's width → minute, clamped to the loop (reference line 580). */
export const minuteAt = (fraction: number, s: LoopSeries = LOOP): number =>
  Math.max(0, Math.min(s.span, ((fraction * CHART.W - CHART.L) / (CHART.W - CHART.L - CHART.R)) * s.span));

/** The nearest measured point to a minute (reference line 581). */
export function nearestPoint(m: number, s: LoopSeries = LOOP): [number, number] {
  let p = s.gpu[0];
  for (const q of s.gpu) if (Math.abs(q[0] - m) < Math.abs(p[0] - m)) p = q;
  return p;
}

/** What the loop was doing at a minute (reference lines 571–577; the review reads "Tech Lead", REQ-001 Q12 (5)). */
export function phase(m: number, s: LoopSeries = LOOP): string {
  for (let i = 0; i < s.rounds.length; i++) {
    if (m >= s.rounds[i] && m <= s.ends[i]) return `โมเดลทำงาน รอบ ${i + 1}`;
    if (m > s.ends[i] && m < (s.rounds[i + 1] ?? Infinity)) return i < s.rounds.length - 1 ? "Tech Lead กำลังตรวจ" : "รับงานแล้ว";
  }
  return "";
}

/** The two lines of the pointer read-out (reference line 585). */
export function readout(m: number, s: LoopSeries = LOOP): [string, string] {
  const p = nearestPoint(m, s);
  const near = s.compact.some((c) => Math.abs(c - m) < 1.2);
  return [`นาทีที่ ${Math.round(m)} · การ์ดทำงาน ${Math.round(p[1])}%`, `${phase(m, s)}${near ? " · ความจำเต็ม ย่อตัวเอง" : ""}`];
}
