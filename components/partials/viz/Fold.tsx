import { IconChevronDown } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { leadOf } from "@/lib/lab/lead";

// SPEC-013 viz: a long field folded behind its lead (lib/lab/lead.ts, § The lead rule). The summary shows the lead with
// "…"; the body shows the WHOLE field, not the rest, so every pack text stays findable unchanged (AC-4). A field short
// enough to be its own lead is shown open, with no fold. `children` replaces the body (several fields in one fold).
// `label` (a UI word such as "วัดยังไง:") goes before the lead; a custom body repeats it where it belongs. `show` draws the
// lead (for example with the field's own bold part); it must print the lead's words unchanged. Once a cut fold is open,
// its lead is hidden from sight (not from screen readers, it stays the summary's name), so the text does not show twice
// (TASK-055, critique A7).
export function Fold({ text, children, className, label, show }: {
  text: string;
  children?: ReactNode;
  className?: string;
  label?: ReactNode;
  show?: (lead: string) => ReactNode;
}) {
  const { lead, cut } = leadOf(text);
  const drawn = show ? show(lead) : lead;
  if (!cut && children === undefined)
    return (
      <p className={className}>
        {label}
        {text}
      </p>
    );
  return (
    <details className={`vz-fold${cut ? " cut" : ""}${className ? ` ${className}` : ""}`}>
      <summary>
        <span className="vz-lead">
          {label}
          {drawn}
          {cut ? "…" : null}
        </span>
        <IconChevronDown className="vz-chev" size={20} stroke={1.75} aria-hidden="true" />
      </summary>
      <div className="vz-fold-body">{children ?? <p>{text}</p>}</div>
    </details>
  );
}
