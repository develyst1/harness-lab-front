"use client";

import { useEffect } from "react";

/** The bar growth (SPEC-012 D6; reference lines 602–608), placed once on each page with `.grow` bars: bars below the
 * fold grow once when first seen. Every bar is already drawn at rest; only bars out of view are shrunk first, and
 * nothing moves under prefers-reduced-motion. Renders nothing.
 *
 * A shrunk bar (`scaleX(0)`) has no area, and IntersectionObserver does not reliably report a zero-area target, so a
 * bar could stay shrunk for good (TASK-046 Q1). The observer watches each bar's parent instead, which keeps its size,
 * and releases the bars it holds. */
export function Grow() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const grows = [...document.querySelectorAll<HTMLElement>(".grow")].filter(
      (el) => el.getBoundingClientRect().top > innerHeight || !el.offsetParent,
    );
    grows.forEach((el) => el.classList.add("pre"));
    const held = new Map<Element, HTMLElement[]>();
    for (const el of grows) {
      const box = el.parentElement ?? el;
      held.set(box, [...(held.get(box) ?? []), el]);
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            held.get(e.target)?.forEach((el) => el.classList.remove("pre"));
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.3 },
    );
    held.forEach((_, box) => io.observe(box));
    return () => io.disconnect();
  }, []);
  return null;
}
