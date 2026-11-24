import Link from "next/link";
import type { ReactNode } from "react";
import type { Tone } from "./IconBox";

// SPEC-013 viz: a timeline. Nodes on one rail, in order: across when its box is 720 px or wider, down below that (a
// container query, so it fits wherever it is placed). Each node: a marker (an icon, or a dot), a small `when`, its title,
// and an optional body; with `href` the node is a link. It is a list, not a picture: its words stay readable text.
export interface TimelineItem {
  key: string;
  when?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  href?: string;
  icon?: ReactNode;
  tone?: Tone;
}

export function Timeline({ items, label }: { items: TimelineItem[]; label: string }) {
  return (
    <div className="vz-tl-box">
      <ol className="vz-tl" aria-label={label}>
        {items.map((it) => {
          const inner = (
            <>
              <span className="vz-node" aria-hidden="true">
                {it.icon}
              </span>
              <span className="vz-tl-t">
                {it.when !== undefined && <span className="vz-when num">{it.when}</span>}
                <b>{it.title}</b>
                {it.body}
              </span>
            </>
          );
          return (
            <li key={it.key} className={`vz-tl-i ${it.tone ?? "signal"}`}>
              {it.href ? (
                <Link href={it.href} className="vz-tl-a">
                  {inner}
                </Link>
              ) : (
                <div className="vz-tl-a">{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
