import type { ReactNode } from "react";
import type { Tone } from "./IconBox";

// SPEC-013 viz: horizontal bars on one scale. Each row: its name, its value as text (the pack's own words), and an
// outlined track (≥ 3:1 against the card, so 100% is visible) with the fill. Reference marks are dashed lines drawn
// across the track's full height and beyond, outside its clip; `ticks` adds a scale row under the bars. The figure is
// one picture for a screen reader: `role="img"` with a Thai `aria-label` that holds every value. Fills grow once when
// first seen (Grow).
export interface BarRow {
  name: ReactNode;
  value: number;
  /** The value as the page writes it, e.g. "~17,100 (โหมดเต็ม)" or "32.7 / 48 GB". */
  text: ReactNode;
  tone?: Tone;
  /** An icon before the name, decorative. */
  icon?: ReactNode;
}

export const share = (value: number, max: number) => (max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0);

/** A track with its fill and dashed marks (shares of the scale, 0–1), the marks outside the track's clip. */
export function Track({ pct, marks = [] }: { pct: number; marks?: number[] }) {
  return (
    <span className="vz-trackbox">
      <span className="vz-track">
        <i className="grow" style={{ width: `${pct}%` }} />
      </span>
      {marks.map((m) => (
        <span key={m} className="vz-mark" style={{ left: `${m * 100}%` }} />
      ))}
    </span>
  );
}

export function Bars({ rows, max, aria, marks, markLabel, ticks }: {
  rows: BarRow[];
  /** The scale's 100%; the largest value when not given. */
  max?: number;
  aria: string;
  /** Reference lines at these shares of the scale (0–1), e.g. 0.75 = "comfortable". */
  marks?: number[];
  markLabel?: string;
  /** A scale row: [value on the scale, its label], e.g. [24, "2 ปี"]. */
  ticks?: [number, string][];
}) {
  const top = max ?? Math.max(0, ...rows.map((r) => r.value));
  return (
    <figure className="vz-bars" role="img" aria-label={aria}>
      {rows.map((r, i) => (
        <div key={i} className={`vz-row ${r.tone ?? "signal"}`}>
          <span className="vz-name">
            {r.icon}
            {r.name}
          </span>
          <span className="vz-val num">{r.text}</span>
          <Track pct={share(r.value, top)} marks={marks} />
        </div>
      ))}
      {ticks && (
        <span className="vz-ticks num" aria-hidden="true">
          {ticks.map(([v, label]) => (
            <span key={label} style={{ left: `${share(v, top)}%` }}>
              {label}
            </span>
          ))}
        </span>
      )}
      {markLabel && <span className="vz-marklabel">{markLabel}</span>}
    </figure>
  );
}
