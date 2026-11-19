"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { clipFailed, clipTabs, clipView, initialClip, playRow, selectTab, setSpeed } from "@/lib/lab/clips";
import { toggledRow, withRow } from "@/lib/lab/techniques";
import type { LabData } from "@/lib/lab/types";
import { Answer } from "./Answer";
import { Behind } from "./Behind";
import { Clips } from "./Clips";
import { Compare } from "./Compare";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { History } from "./History";
import { Nav, STOP_IDS } from "./Nav";
import { Plan } from "./Plan";
import { Techniques } from "./Techniques";

/** The whole page, drawn from the back's one document (pack v3.1), in the order of REQ-001 req 1; เทคนิค between
 * เทียบเอง and สเปกและงบ (SPEC-003). */
export function LabContent({ runs, tiers, meta, page, techniques }: LabData) {
  const tabs = useMemo(() => clipTabs(runs), [runs]);
  // ดูคลิป: the selected row (plus its tab when it has one), the speed, the play asks and the clips that failed to load
  // (lib/lab/clips.ts; TASK-010, TASK-012).
  const [clip, setClip] = useState(() => initialClip(runs));
  const [active, setActive] = useState<string>();
  const failed = useCallback((key: string) => setClip((s) => clipFailed(s, key)), []);
  // ประวัติ: the open rows. The entry button toggles its row; a เทคนิค evidence link opens one (SPEC-003).
  const [openRows, setOpenRows] = useState<ReadonlySet<string>>(() => new Set());

  const play = (rowId: string) => {
    setClip((s) => playRow(runs, s, rowId));
    document.getElementById("clips")?.scrollIntoView();
  };

  // The evidence link: open the row, move focus to its button (no scroll of its own) and bring it into view.
  const showRow = (rowId: string) => {
    setOpenRows((s) => withRow(s, rowId));
    const entry = document.getElementById(`run-${rowId}`);
    entry?.querySelector("button")?.focus({ preventScroll: true });
    entry?.scrollIntoView();
  };

  // Scroll-spy (reference lines 593–600): mark the stop whose section crosses the band 40–45 % down the viewport.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const spy = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), {
      rootMargin: "-40% 0px -55% 0px",
    });
    STOP_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
    return () => spy.disconnect();
  }, []);

  // Light motion (reference lines 602–608): bars below the fold grow once when first seen. Every bar is already
  // drawn at rest; only bars out of view are shrunk first, and nothing moves under prefers-reduced-motion.
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    const grows = [...document.querySelectorAll<HTMLElement>(".grow")].filter(
      (el) => el.getBoundingClientRect().top > innerHeight || !el.offsetParent,
    );
    grows.forEach((el) => el.classList.add("pre"));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove("pre");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.3 },
    );
    grows.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <Nav active={active} />
      <main className="wrap">
        <Hero hero={page.hero} />
        <Answer runs={runs} page={page} onPlay={play} />
        <Clips
          tabs={tabs}
          view={clipView(runs, clip, page.clips.noClip)}
          clips={page.clips}
          onSelect={(key) => setClip((s) => selectTab(runs, s, key))}
          onSpeed={(rate) => setClip((s) => setSpeed(s, rate))}
          onFailed={failed}
        />
        <History runs={runs} history={page.history} open={openRows} onToggle={(id) => setOpenRows((s) => toggledRow(s, id))} />
        <Compare runs={runs} compare={page.compare} cardMiB={page.behind.gauge.cardMiB} />
        <Techniques techniques={techniques} head={page.techniques} onShowRow={showRow} />
        <Plan tiers={tiers} meta={meta} page={page} />
        <Behind runs={runs} meta={meta} page={page} />
        <Footer text={page.footer} />
      </main>
    </>
  );
}
