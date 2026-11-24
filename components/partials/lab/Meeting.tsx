"use client";

import { Fragment, useMemo, useState } from "react";
import { cutText, DASH, doneText, fixtureHeading, foundShare, foundText, MEETING_WORDS as W, money, mss, noBreak, usdRange,
  visualArms } from "@/lib/lab/meeting";
import { MEETING_GLOSSARY, markOnce, withArmLabels } from "@/lib/lab/meetingGlossary";
import { type Segment, storySegments } from "@/lib/lab/story";
import type { GlossaryEntry, Meeting as MeetingData, MeetingArm, MeetingFixture } from "@/lib/lab/types";

// R-M1, the meeting study (SPEC-011 § The design; TASK-040 comp, approved at AC-1; TASK-041 build). A story chapter: the
// title, the question, the lead and one small visual of found-of-N per way of working over the four meetings. Under it,
// a closed "ดูตัวเลขทั้งหมด" with every number req 1 lists. Every number comes from one display rule (lib/lab/meeting.ts)
// and carries one `data-field` hook (the visual's with the prefix `v-`). The arms × meetings table is a table when its
// block is wide; narrower than 640 px its rows show as one card per arm (globals.css § R-M1), so the page never scrolls
// sideways and no inner scroller is needed.
//
// Glossary (SPEC-011 § Glossary in the front): the page's entries plus MEETING_GLOSSARY, each arm label a form of its
// kind's entry. A term is a real button (the Story pattern) that opens its plain line under its text; a second tap or Esc
// closes it, and one line is open in the section at a time. An entry is marked at its first place in the chapter, and
// again at its first place inside the fold. A USD range never breaks across lines (SPEC-011 § AC-1 result).
//
// Standalone (SPEC-011 § AC-1 result, REQ-011 may move it): it takes the `meeting` view and the page glossary as props
// and reads nothing else.
export function Meeting({ meeting, glossary }: { meeting: MeetingData; glossary: readonly GlossaryEntry[] }) {
  const { fixtures, arms } = meeting;
  const shown = useMemo(() => visualArms(arms), [arms]);
  const terms = useMemo(() => withArmLabels([...glossary, ...MEETING_GLOSSARY], arms), [glossary, arms]);
  const [chapter, fold] = useMemo(() => {
    const cut = (texts: readonly string[]) => markOnce(texts.map((t) => storySegments(t, terms)));
    return [
      cut([meeting.questionTh, ...W.lead, ...shown.map((a) => a.labelTh)]),
      cut([meeting.howTh, meeting.costNoteTh, ...meeting.findings.map((f) => f.th)]),
    ];
  }, [terms, meeting, shown]);
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen((o) => (o === id ? null : id));
  const say = { open, onToggle: toggle, terms };
  const [question, ...rest] = chapter;
  const lead = rest.slice(0, W.lead.length);
  const labels = rest.slice(W.lead.length);
  const [how, costNote, ...findings] = fold;

  return (
    <section id="meeting" onKeyDown={(e) => e.key === "Escape" && open && setOpen(null)}>
      <div className="run">{W.kicker}</div>
      <h2>{meeting.titleTh}</h2>
      <p className="mute">
        <Inline segs={question} id="mt-q" {...say} />
      </p>
      <Lines segs={question} id="mt-q" {...say} />
      <div className="mt-lead">
        {lead.map((segs, i) => (
          <Fragment key={i}>
            <p>
              <Inline segs={segs} id={`mt-lead-${i}`} {...say} />
            </p>
            <Lines segs={segs} id={`mt-lead-${i}`} {...say} />
          </Fragment>
        ))}
      </div>
      <Visual arms={shown} labels={labels} fixtures={fixtures} say={say} />
      <details className="fold mt-fold">
        <summary>{W.disclosure}</summary>
        <div className="in">
          <div className="mt-block">
            <h3>{W.how}</h3>
            <p>
              <Inline segs={how} id="mt-how" {...say} />
            </p>
            <Lines segs={how} id="mt-how" {...say} />
          </div>
          <div className="mt-arms">
            <ArmTable arms={arms} fixtures={fixtures} />
            <p className="mute mt-legend">{W.legend}</p>
          </div>
          <div className="mt-two">
            <div className="mt-block">
              <h3>{W.cutRates}</h3>
              <dl className="money">
                {meeting.cutRates.map((c) => (
                  <Pair key={c.model} k={c.model} v={cutText(c)} field={`cut:${c.model}`} />
                ))}
              </dl>
            </div>
            <div className="mt-block">
              <h3>{W.cost}</h3>
              <dl className="money">
                <Pair k={W.spent} v={money(meeting.costUsd)} field="cost" />
                <Pair k={W.cap} v={money(meeting.capUsd)} field="cap" />
                <Pair k={W.cutWaste} v={money(meeting.cutWasteUsd)} field="cutWaste" />
              </dl>
              <p className="mute mt-note">
                <Inline segs={costNote} id="mt-note" {...say} />
              </p>
              <Lines segs={costNote} id="mt-note" {...say} />
            </div>
          </div>
          <div className="mt-block">
            <h3>{W.findings}</h3>
            <ol className="mt-list">
              {findings.map((segs, i) => (
                <li key={i}>
                  <span data-field={`finding:${i}`}>
                    <Inline segs={segs} id={`mt-f-${i}`} {...say} />
                  </span>
                  <Lines segs={segs} id={`mt-f-${i}`} {...say} />
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-block">
            <h3>{W.next}</h3>
            <dl className="money">
              {meeting.next.map((n, i) => (
                <Pair key={i} k={n.th} v={money(n.usd)} field={`next:${i}`} />
              ))}
            </dl>
          </div>
        </div>
      </details>
    </section>
  );
}

type Say = { open: string | null; onToggle: (id: string) => void; terms: readonly GlossaryEntry[] };

/** A text inline: its terms as buttons, its USD ranges in one no-break span. Panel ids are `<id>-<segment index>`. */
function Inline({ segs, id, open, onToggle, row = false }: Say & { segs: Segment[]; id: string; row?: boolean }) {
  return segs.map((s, si) =>
    "term" in s ? (
      <button
        key={si}
        type="button"
        className={row ? "term term-row" : "term"}
        aria-expanded={open === `${id}-${si}`}
        aria-controls={`${id}-${si}`}
        onClick={() => onToggle(`${id}-${si}`)}
      >
        <span>{s.term}</span>
      </button>
    ) : (
      <Fragment key={si}>
        {noBreak(s.text).map((p, pi) =>
          typeof p === "string" ? (
            <Fragment key={pi}>{p}</Fragment>
          ) : (
            <span key={pi} className="nb">
              {p.nb}
            </span>
          ),
        )}
      </Fragment>
    ),
  );
}

/** The plain lines of a text's terms, each hidden until its term is tapped. */
function Lines({ segs, id, open, terms }: Say & { segs: Segment[]; id: string }) {
  return segs.map((s, si) =>
    "term" in s ? (
      <p key={si} id={`${id}-${si}`} className="gloss" hidden={open !== `${id}-${si}`}>
        <b>{s.term}</b> {terms[s.entry][1]}
      </p>
    ) : null,
  );
}

function Pair({ k, v, field }: { k: string; v: string; field: string }) {
  return (
    <>
      <dt>{k}</dt>
      <dd className="v" data-field={field}>
        {v}
      </dd>
    </>
  );
}

/** The small visual: one row per shown arm (its label a term for its way of working), one bar per meeting (found ÷ N),
 * its found/N beside it. A label's plain line opens across the whole row, under it. */
function Visual({ arms, labels, fixtures, say }: { arms: MeetingArm[]; labels: Segment[][]; fixtures: MeetingFixture[]; say: Say }) {
  return (
    <figure className="mt-visual">
      <figcaption>
        <b>{W.visualTitle}</b>
      </figcaption>
      <div className="mt-vrow mt-vhead" aria-hidden="true">
        <span />
        {fixtures.map((f) => (
          <span key={f.id}>{fixtureHeading(f)}</span>
        ))}
      </div>
      <ul className="mt-vrows">
        {arms.map((a, ai) => (
          <li key={a.id} className="mt-vrow">
            <span className="mt-vlabel">
              <Inline segs={labels[ai]} id={`mt-v-${a.id}`} row {...say} />
            </span>
            {fixtures.map((f) => {
              const share = foundShare(a.found[f.id], f.actions);
              return (
                <span key={f.id} className="mt-vcell">
                  <span className="sr">{fixtureHeading(f)}</span>
                  <span className="mt-track" aria-hidden="true">
                    {share !== null && <i className="grow" style={{ width: `${share * 100}%` }} />}
                  </span>
                  <span className="num" data-field={`v-found:${a.id}:${f.id}`}>
                    {foundText(a.found[f.id], f.actions)}
                  </span>
                </span>
              );
            })}
            <Lines segs={labels[ai]} id={`mt-v-${a.id}`} {...say} />
          </li>
        ))}
      </ul>
    </figure>
  );
}

/** The arms × meetings table: one markup, one hook per number. In a block narrower than 640 px its rows become cards
 * (globals.css § R-M1), each cell labelled by its `data-label`; the explicit roles keep it a table for screen readers
 * once CSS changes its display. Its cells never wrap, so a USD range stays on one line. */
function ArmTable({ arms, fixtures }: { arms: MeetingArm[]; fixtures: MeetingFixture[] }) {
  const cell = (field: string, label: string, text: string, wide = false) => (
    <td role="cell" data-field={field} data-label={label} className={[text === DASH && "dash", wide && "wide"].filter(Boolean).join(" ") || undefined}>
      {text}
    </td>
  );
  return (
    <table className="mt-table" role="table">
      <thead role="rowgroup">
        <tr role="row">
          <th role="columnheader" scope="col">{W.arm}</th>
          {fixtures.map((f) => (
            <th key={f.id} role="columnheader" scope="col" data-field={`fixture:${f.id}`}>
              {fixtureHeading(f)}
            </th>
          ))}
          <th role="columnheader" scope="col">{W.done}</th>
          <th role="columnheader" scope="col">{W.secShort}</th>
          <th role="columnheader" scope="col">{W.secLong}</th>
          <th role="columnheader" scope="col">{W.usd}</th>
        </tr>
      </thead>
      <tbody role="rowgroup">
        {arms.map((a) => (
          <tr key={a.id} role="row">
            <th role="rowheader" scope="row">{a.labelTh}</th>
            {fixtures.map((f) => (
              <Fragment key={f.id}>{cell(`found:${a.id}:${f.id}`, fixtureHeading(f), foundText(a.found[f.id], f.actions))}</Fragment>
            ))}
            {cell(`done:${a.id}`, W.done, doneText(a.done))}
            {cell(`secShort:${a.id}`, W.secShort, mss(a.secShort))}
            {cell(`secLong:${a.id}`, W.secLong, mss(a.secLong))}
            {cell(`usd:${a.id}`, W.usd, usdRange(a.usdPerMeeting), true)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
