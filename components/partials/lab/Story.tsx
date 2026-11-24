"use client";

import { Fragment, type MouseEvent, useEffect, useMemo, useState } from "react";
import type { GlossaryTerm } from "@/lib/lab/site";
import { escapePanels, nearestTerm, type OpenPanels, storySegments, togglePanel } from "@/lib/lab/story";
import type { Page } from "@/lib/lab/types";

// เรื่องเล่า (SPEC-006 § Front, layout A = the TASK-023 comp; /story since SPEC-012): the chapters of page.json →
// explain.story as when · title · text, each <li> anchored chapter-<n> (SPEC-012 D4). A glossary term in the text is a
// real <button> (its text is its accessible name) that opens the entry's plain line under the paragraph; a second tap or
// Esc closes it, one open line per chapter. A term is only as wide as its word and the lines stay even (comp A); a tap
// that misses every word opens the nearest term of that chapter within 22 px (SPEC-006 § Amendment, REQ-006 Q3 option
// a). Kicker and title are the PM's words (REQ-006 req 2, 4). The "คำศัพท์" list is `Glossary`, on /glossary (D5).
export function Story({ explain, titleAs: Title = "h2" }: {
  explain: Pick<Page["explain"], "story" | "glossary">;
  /** SPEC-012 D11: "h1" where the section is the page (/story); it keeps the h2 look. */
  titleAs?: "h1" | "h2";
}) {
  const { story, glossary } = explain;
  const chapters = useMemo(() => story.map(([, , text]) => storySegments(text, glossary)), [story, glossary]);
  const [open, setOpen] = useState<OpenPanels>({});

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const term = document.activeElement instanceof HTMLElement ? document.activeElement.closest("button.term") : null;
      setOpen((o) => escapePanels(o, term?.getAttribute("aria-controls") ?? null));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // A tap in the story that is not on a term's word: the nearest term of the chapter whose row holds the tap (by
  // height, so the panel's side padding counts too) opens within 22 px and takes focus. The whole list listens, so the
  // space around a term on a first or last line, or at a line's start, is not dead. A tap on a term is its button's; a
  // tap on an open plain line opens nothing.
  const nearest = (e: MouseEvent<HTMLOListElement>) => {
    if ((e.target as Element).closest("button.term, .gloss")) return;
    const rows = [...e.currentTarget.children] as HTMLElement[];
    const ci = rows.findIndex((li) => {
      const r = li.getBoundingClientRect();
      return e.clientY >= r.top && e.clientY < r.bottom;
    });
    if (ci < 0) return;
    const buttons = [...rows[ci].querySelectorAll<HTMLButtonElement>("button.term")];
    const i = nearestTerm({ x: e.clientX, y: e.clientY }, buttons.map((b) => ({ rects: [...b.getClientRects()] })));
    const id = i === null ? null : buttons[i].getAttribute("aria-controls");
    if (i === null || !id) return;
    setOpen((o) => togglePanel(o, ci, id));
    buttons[i].focus();
  };

  return (
    <section id="story">
      <div className="run">เรื่องเล่า</div>
      <Title className={Title === "h1" ? "as-h2" : undefined}>เราทดลองอะไร ทีละรอบ</Title>
      <ol className="chapters" onClick={nearest}>
        {story.map(([when, title], ci) => {
          const segments = chapters[ci];
          const panelId = (si: number) => `story-${ci + 1}-${si}`;
          return (
            <li key={`${ci}-${when}`} id={`chapter-${ci + 1}`} className="chapter">
              <span className="when">{when}</span>
              <b className="ttl">{title}</b>
              <div className="txt">
                <p>
                  {segments.map((s, si) =>
                    "term" in s ? (
                      <button
                        key={si}
                        type="button"
                        className="term"
                        aria-expanded={open[ci] === panelId(si)}
                        aria-controls={panelId(si)}
                        onClick={() => setOpen((o) => togglePanel(o, ci, panelId(si)))}
                      >
                        <span>{s.term}</span>
                      </button>
                    ) : (
                      <Fragment key={si}>{s.text}</Fragment>
                    ),
                  )}
                </p>
                {segments.map((s, si) =>
                  "term" in s ? (
                    <p key={si} id={panelId(si)} className="gloss" hidden={open[ci] !== panelId(si)}>
                      <b>{s.term}</b> {glossary[s.entry][1]}
                    </p>
                  ) : null,
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** The "คำศัพท์" list (moved from Story, SPEC-012 D5): every entry, aliases after the term, each dt an anchor term-<n>,
 * the same markup as before (lib/lab/site.ts glossaryView numbers them). /glossary gives it its h1. */
export function Glossary({ terms }: { terms: GlossaryTerm[] }) {
  return (
    <dl className="glossary">
      {terms.map((t) => (
        <Fragment key={t.id}>
          <dt id={t.id}>{t.name}</dt>
          <dd>{t.plain}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
