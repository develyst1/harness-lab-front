"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { AREAS, W } from "./words";

// The navbar of the multi-page site (SPEC-012 § Conventions): its links are paths, and the area of the current page is
// marked (aria-current="page"). Same look as today's bar (.nav). At 375 it scrolls inside its strip (SPEC-012 D7); the
// current link is brought into view inside the strip, so a deep page never shows its area off-screen.
export function SiteNav() {
  const path = usePathname() ?? "/";
  const current = AREAS.find(({ key }) => path === `/${key}` || path.startsWith(`/${key}/`))?.key;
  const strip = useRef<HTMLDivElement>(null);

  // On load, and when a client navigation changes the area. "nearest" on both axes: the strip scrolls, the page does not
  // (the bar is sticky, so it is always in view).
  useEffect(() => {
    strip.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [current]);

  return (
    <nav className="nav" aria-label={W.nav}>
      <div className="in" ref={strip}>
        <Link href="/" className="brand" aria-current={path === "/" ? "page" : undefined}>
          {"Harness "}
          <span>Lab</span>
        </Link>
        {AREAS.map(({ key, label }) => {
          const on = key === current;
          return (
            <Link key={key} href={`/${key}`} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
