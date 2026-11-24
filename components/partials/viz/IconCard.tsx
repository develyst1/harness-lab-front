import Link from "next/link";
import type { ReactNode } from "react";
import { IconBox, type Tone } from "./IconBox";

// SPEC-013 viz: an icon card. The icon box beside its title, an optional line under the title and an optional count.
// With `href` the whole card is the link (44 px and more), with the site's hover lift and a pressed state.
export function IconCard({ icon, title, sub, count, href, tone, children }: {
  icon: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  count?: ReactNode;
  href?: string;
  tone?: Tone;
  children?: ReactNode;
}) {
  const inner = (
    <>
      <IconBox tone={tone}>{icon}</IconBox>
      <span className="vz-icard-t">
        <b>{title}</b>
        {sub !== undefined && <span className="mute">{sub}</span>}
      </span>
      {count !== undefined && <span className="vz-count num">{count}</span>}
      {children}
    </>
  );
  return href ? (
    <Link href={href} className="vz-icard link">
      {inner}
    </Link>
  ) : (
    <div className="vz-icard">{inner}</div>
  );
}
