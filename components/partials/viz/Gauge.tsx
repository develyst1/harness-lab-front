import { IconAlertTriangle } from "@tabler/icons-react";
import { share, Track } from "./Bars";

// SPEC-013 viz: a gauge. One big reading, a track with its fill and an optional reference mark, and a caption.
// `warn` adds an alert icon as well as the review tone, so the state is never colour alone (AC-5). One picture for a
// screen reader (`role="img"` + a Thai `aria-label`).
export function Gauge({ value, max, big, caption, aria, mark, warn = false }: {
  value: number;
  max: number;
  /** The reading as the page writes it, e.g. "43%" or "$9.08". */
  big: string;
  caption?: string;
  aria: string;
  mark?: number;
  warn?: boolean;
}) {
  return (
    <div className={`vz-gauge${warn ? " warn" : ""}`} role="img" aria-label={aria}>
      <b className="vz-big num">{big}</b>
      <Track pct={share(value, max)} marks={mark === undefined ? [] : [mark]} />
      {caption && (
        <span className="vz-cap">
          {warn && <IconAlertTriangle size={16} stroke={1.75} aria-hidden="true" />}
          {caption}
        </span>
      )}
    </div>
  );
}
