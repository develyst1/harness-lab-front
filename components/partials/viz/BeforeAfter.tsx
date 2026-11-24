import { IconArrowNarrowDown, IconClockX } from "@tabler/icons-react";
import { leadOf } from "@/lib/lab/lead";
import { share, Track } from "./Bars";

// SPEC-013 viz: before → after. Each pair is two rows, "ก่อน" then "หลัง" (the site's own labels, TechCard), each with
// its side's text (the pack's words; a long one shows its lead with "…", and the caller folds the whole field). A side
// with a `value` is drawn: pips when it has a small whole `of` (n of 4), else a bar, on its own `of` or on one scale
// shared by the figure. A figure with anything drawn is one picture for a screen reader (`role="img"`, every side's text
// in the label); one with nothing to draw stays plain text. Before is drawn in the muted tone and after in the signal
// tone, and the row labels name them, so colour is not the only cue.
export interface Side {
  text: string;
  value?: number;
  /** This side's own scale (n of `of`), e.g. 4 for "3/4" or 10 for "$9.08 of $10". */
  of?: number;
  /** The value is where the run was stopped, not where it finished ("หมดเวลา 70"): drawn hatched with a clock icon. */
  stopped?: boolean;
}
export interface BAPair {
  name?: string;
  before: Side;
  after: Side;
}

const LABELS = { before: "ก่อน", after: "หลัง" } as const;
const pips = (s: Side) => s.of !== undefined && Number.isInteger(s.of) && s.of <= 12 && s.value !== undefined && (s.value * 2) % 1 === 0;
const shown = (text: string) => {
  const { lead, cut } = leadOf(text);
  return cut ? `${lead}…` : lead;
};

/** true when some side shows only its lead, so the caller must fold the whole text somewhere (AC-4). */
export const anyCut = (pairs: BAPair[]) => pairs.some((p) => leadOf(p.before.text).cut || leadOf(p.after.text).cut);

export function BeforeAfter({ pairs }: { pairs: BAPair[] }) {
  const drawn = pairs.some((p) => p.before.value !== undefined || p.after.value !== undefined);
  const free = pairs.flatMap((p) => [p.before, p.after]).filter((s) => s.value !== undefined && s.of === undefined);
  const top = Math.max(0, ...free.map((s) => s.value as number));
  const aria = pairs
    .map((p) => `${p.name ? `${p.name}: ` : ""}${LABELS.before} ${p.before.text}, ${LABELS.after} ${p.after.text}`)
    .join("; ");
  const row = (key: "before" | "after", s: Side) => (
    <div className={`vz-ba-row ${key}${s.stopped ? " stopped" : ""}`}>
      <span className="vz-ba-k">{LABELS[key]}</span>
      {s.value !== undefined &&
        (pips(s) ? (
          <span className="vz-pips" aria-hidden="true">
            {Array.from({ length: s.of as number }, (_, i) => (
              <i key={i} className={i + 1 <= (s.value as number) ? "y" : i < (s.value as number) ? "h" : "n"} />
            ))}
          </span>
        ) : (
          <Track pct={share(s.value, s.of ?? top)} />
        ))}
      <span className="vz-ba-v">
        {s.stopped && <IconClockX size={16} stroke={1.75} aria-hidden="true" />}
        {shown(s.text)}
      </span>
    </div>
  );
  const body = pairs.map((p, i) => (
    <div key={i} className="vz-ba-pair">
      {p.name && <span className="vz-ba-name">{p.name}</span>}
      {row("before", p.before)}
      {!drawn && <IconArrowNarrowDown className="vz-ba-arrow" size={18} stroke={1.75} aria-hidden="true" />}
      {row("after", p.after)}
    </div>
  ));
  return drawn ? (
    <figure className="vz-ba drawn" role="img" aria-label={aria}>
      {body}
    </figure>
  ) : (
    <div className="vz-ba">{body}</div>
  );
}
