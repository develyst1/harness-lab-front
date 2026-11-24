"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AREAS, W } from "./words";

// The navbar of the multi-page site (SPEC-012 § Conventions): its links are paths, and the area of the current page is
// marked (aria-current="page"). Same look as today's bar (.nav). At 375 the links scroll inside their strip (SPEC-012 D7);
// the current link is brought into view inside the strip, so a deep page never shows its area off-screen.
// REQ-012 row 8 (TASK-055): the brand sits outside the strip, so it never scrolls away, and the strip fades at an edge
// where it has more links (`data-more`), so a visitor can tell it scrolls.
type More = "left" | "right" | "both" | undefined;

export function SiteNav() {
  const path = usePathname() ?? "/";
  const current = AREAS.find(({ key }) => path === `/${key}` || path.startsWith(`/${key}/`))?.key;
  const strip = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState<More>(undefined);

  // Which edges hide links: on scroll, on resize, and after the current link is brought into view.
  useEffect(() => {
    const s = strip.current;
    if (!s) return;
    const read = () => {
      const left = s.scrollLeft > 2;
      const right = s.scrollLeft + s.clientWidth < s.scrollWidth - 2;
      setMore(left && right ? "both" : left ? "left" : right ? "right" : undefined);
    };
    read();
    s.addEventListener("scroll", read, { passive: true });
    const ro = new ResizeObserver(read);
    ro.observe(s);
    return () => {
      s.removeEventListener("scroll", read);
      ro.disconnect();
    };
  }, []);

  // On load, and when a client navigation changes the area. The current link goes to the middle of the strip, clear of the
  // faded edges (REQ-012 row 8); "nearest" vertically, so the strip scrolls and the page does not (the bar is sticky).
  useEffect(() => {
    strip.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [current]);

  return (
    <nav className="nav" aria-label={W.nav}>
      <div className="in">
        <Link href="/" className="brand" aria-current={path === "/" ? "page" : undefined}>
          {"Harness "}
          <span>Lab</span>
        </Link>
        <div className="links" ref={strip} data-more={more}>
          {AREAS.map(({ key, label }) => {
            const on = key === current;
            return (
              <Link key={key} href={`/${key}`} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
