"use client";

import { IconArrowDown, IconChevronDown, IconFlask, IconMicrophone, IconSearch, IconVocabulary } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { Fragment, type MouseEvent, useEffect, useId, useMemo, useState } from "react";
import { W } from "@/components/partials/site/words";
import { IconBox } from "@/components/partials/viz";
import type { GlossaryGroup, GlossaryTerm } from "@/lib/lab/site";
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
      <Title id="story-h" className={Title === "h1" ? "as-h2" : undefined}>เราทดลองอะไร ทีละรอบ</Title>
      {/* TASK-058 Q5 (SA): the rounds at a glance, drawn: one rail, a node per chapter, its `when` under it (the pack's
          words), each a link to its chapter. The links are the text equivalent; the drawing itself is decorative. On a
          narrow screen the strip scrolls sideways inside itself, so every link stays a 44 px tap. */}
      <nav className="story-strip" aria-labelledby="story-h">
        <div className="story-strip-in">
          {/* TEST-012 O1: the rail is a picture with its own name: the rounds in order, the pack's words. */}
          <svg viewBox={`0 0 ${story.length * 100} 24`} preserveAspectRatio="none" role="img" aria-label={story.map(([when]) => when).join(" · ")}>
            <line x1={50} x2={story.length * 100 - 50} y1={12} y2={12} />
          </svg>
          <ol style={{ gridTemplateColumns: `repeat(${story.length}, minmax(0, 1fr))` }}>
            {story.map(([when], i) => (
              <li key={`${i}-${when}`}>
                {/* a word joiner each side of the dash, so "1–2" never breaks at it in a narrow cell */}
              <a href={`#chapter-${i + 1}`}>{when.replace(/–/g, "\u2060–\u2060")}</a>
              </li>
            ))}
          </ol>
        </div>
      </nav>
      {/* TASK-058: the chapters as a timeline (SPEC-013 row 6): one rail, a marked node per round, the words unchanged.
          Always down the page (the 8 chapters are too long to sit side by side), so no .vz-tl-box container. */}
      <ol className="chapters vz-tl story-tl" onClick={nearest}>
        {story.map(([when, title], ci) => {
          const segments = chapters[ci];
          const panelId = (si: number) => `story-${ci + 1}-${si}`;
          return (
            <li key={`${ci}-${when}`} id={`chapter-${ci + 1}`} className="chapter vz-tl-i">
              <div className="vz-tl-a">
                <span className="vz-node" aria-hidden="true">
                  <IconFlask stroke={1.75} />
                </span>
                <div className="vz-tl-t">
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
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** The "คำศัพท์" list (SPEC-012 D5; REQ-012 row 3, the comp TASK-054, TASK-055), on /glossary under its h1:
 * - a search box (`?q=`, as on the home) over the term and its plain line, with the count announced;
 * - the two groups (lib/lab/site.ts glossaryView) as chips with counts that follow the search;
 * - every term as a row that opens its plain line, the row anchored term-<n> as before, in the same order.
 * On a wide screen (≥ 900 px) each line shows under its name by CSS alone (`.cv-term-wide`, a copy shown only while its
 * row is closed), in a row-major grid, so the page does not jump after load; while a search is typed, the matching rows
 * show their line open; landing on #term-<n> (a link, or the old one-page anchor's redirect) opens that row. */
export function Glossary({ groups, initial = "" }: { groups: GlossaryGroup[]; initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [hash, setHash] = useState("");
  const id = useId();
  const needle = q.trim().toLowerCase();
  const hit = (t: GlossaryTerm) => !needle || t.name.toLowerCase().includes(needle) || t.plain.toLowerCase().includes(needle);
  const found = groups.reduce((n, g) => n + g.terms.filter(hit).length, 0);
  const title = (g: GlossaryGroup) => g.studyTitle ?? W.glossLab;

  useEffect(() => {
    const read = () => setHash(decodeURIComponent(location.hash.slice(1)));
    read();
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, []);
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el instanceof HTMLDetailsElement) {
      el.open = true;
      el.scrollIntoView({ block: "start" });
    }
  }, [hash]);

  const change = (value: string) => {
    setQ(value);
    router.replace(`/glossary${value.trim() ? `?q=${encodeURIComponent(value)}` : ""}`, { scroll: false });
  };

  return (
    <>
      <div className="site-search cv-search" role="search">
        <label htmlFor={id}>
          <IconSearch size={20} stroke={1.75} aria-hidden="true" />
          {W.glossSearch}
        </label>
        <input id={id} type="search" value={q} onChange={(e) => change(e.target.value)} autoComplete="off" />
        <p className="mute" aria-live="polite">
          {needle ? (found ? W.glossFound(found) : W.glossNone) : ""}
        </p>
      </div>
      <nav className="cv-chips" aria-label={W.glossGroups}>
        {groups.map((g) => {
          const I = g.key === "study" ? IconMicrophone : IconVocabulary;
          return (
            <a key={g.key} href={`#g-${g.key}`} className="cv-chip">
              <I size={20} stroke={1.75} aria-hidden="true" />
              <span>{title(g)}</span>
              <b className="num">{g.terms.filter(hit).length}</b>
              <IconArrowDown className="vz-jump" size={16} stroke={1.75} aria-hidden="true" />
            </a>
          );
        })}
      </nav>
      {groups.map((g) => {
        const I = g.key === "study" ? IconMicrophone : IconVocabulary;
        const shown = g.terms.filter(hit);
        if (!shown.length) return null;
        return (
          <section key={g.key} className="cv-sec" aria-labelledby={`g-${g.key}`}>
            <h2 id={`g-${g.key}`} className="as-h3">
              <IconBox>
                <I stroke={1.75} />
              </IconBox>
              {title(g)}
            </h2>
            <ul className="cv-terms">
              {shown.map((t) => (
                <li key={t.id}>
                  <details id={t.id} className="vz-fold" open={needle ? true : t.id === hash || undefined}>
                    <summary>
                      <b className="vz-lead">{t.name}</b>
                      <IconChevronDown className="vz-chev" size={20} stroke={1.75} aria-hidden="true" />
                    </summary>
                    <div className="vz-fold-body">
                      <p>{t.plain}</p>
                    </div>
                  </details>
                  <p className="cv-term-wide">{t.plain}</p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
