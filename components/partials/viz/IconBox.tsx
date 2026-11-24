import type { ReactNode } from "react";

// SPEC-013 viz (TASK-054 § Direction): an icon in a 40 × 40 box, `--signal-soft` with the icon in `--signal-ink`, or a
// verdict tone. Decorative: the word beside it carries the meaning, so the box is hidden from screen readers.
export type Tone = "signal" | "ok" | "review" | "bad" | "mute";

export function IconBox({ children, tone = "signal" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`vz-ibox ${tone}`} aria-hidden="true">
      {children}
    </span>
  );
}
