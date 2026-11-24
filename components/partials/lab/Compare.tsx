"use client";

import { useState } from "react";
import { Select } from "@mantine/core";
import { W } from "@/components/partials/site/words";
import { Bars, share, Track } from "@/components/partials/viz";
import { compareRows, NOT_MEASURED } from "@/lib/lab/compare";
import type { Page, Run } from "@/lib/lab/types";

// เทียบเอง: layout of reference/index.html lines 264–278, values per lib/lab/compare.ts. Only the items both rows hold
// are compared, one block per item. Defaults R3 vs R4a (reference line 529). After the six metrics, one row per planted
// point of either side (SPEC-003 § AC-12): "จุด n" + its label, then each side's mark.
const NO_COMMON = "สองการทดลองนี้ไม่ได้ทำข้อเดียวกัน เลือกคู่อื่นมาเทียบ"; // REQ-001 Q9 (b)
const NOT_TESTED = "ไม่ได้ทดสอบ"; // a side that did not have this point (REQ-003 AC-12, the PM)
const TIME = "เวลาที่ใช้"; // lib/lab/compare.ts's minutes row (REQ-001 Q11 (a), the PM): the row it matches
const TIME_SHOWN = "เวลาต่อข้อ"; // PM, TASK-057 words 2: what /compare shows for that row (one item's minutes)
const BETTER = "ดีกว่า"; // PM, TASK-057 words 7: a .win cell, for a screen reader (the note's own word)
const CAUGHT_Q = "จุดไหนจับได้"; // the points row's own header (below), reused as the summary's name

/** TASK-072 R2 (TEST-012 DEF-2: no picture in /compare's first screen): the pair's planted points, summed over the
 * items both hold, drawn as one bar per side (caught / tested, on one 0–100% scale). Drawn only from the rows the
 * table shows; no new words: the name is the points row's header, each value is "n/m". */
function CaughtBars({ blocks, a, b }: { blocks: ReturnType<typeof compareRows>; a: Run; b: Run }) {
  const count = (side: "a" | "b") => {
    const tested = blocks.flatMap((k) => k.points.map((p) => p[side])).filter((c): c is boolean => c !== null);
    return { n: tested.filter(Boolean).length, of: tested.length };
  };
  const [ca, cb] = [count("a"), count("b")];
  if (ca.of === 0 && cb.of === 0) return null;
  const row = (r: Run, c: { n: number; of: number }) => ({ name: <b>{r.id}</b>, value: share(c.n, c.of || 1), text: c.of ? `${c.n}/${c.of}` : NOT_TESTED });
  return (
    <div className="cmp-sum">
      <p className="cv-k">{CAUGHT_Q}</p>
      <Bars rows={[row(a, ca), row(b, cb)]} max={100}
        aria={`${CAUGHT_Q}: ${a.id} ${ca.of ? `${ca.n}/${ca.of}` : NOT_TESTED}, ${b.id} ${cb.of ? `${cb.n}/${cb.of}` : NOT_TESTED}`} />
    </div>
  );
}

/** One side of a point row: a dot with its word for screen readers, or "ไม่ได้ทดสอบ" when that side did not have it. */
function Mark({ caught }: { caught: boolean | null }) {
  if (caught === null) return <span className="mute">{NOT_TESTED}</span>;
  return (
    <span className="dots">
      <i className={caught ? "y" : "n"} aria-hidden="true" />
      <span className="sr">{caught ? "จับได้" : "จับไม่ได้"}</span>
    </span>
  );
}

const pickClasses = { input: "pick-input", dropdown: "pick-dropdown", option: "pick-option" };

export function Compare({ runs, compare, cardMiB, titleAs: Title = "h2" }: {
  runs: Run[];
  compare: Page["compare"];
  cardMiB: number;
  /** SPEC-012 D11: "h1" where the section is the page (/compare); it keeps the h2 look, and the block titles are then h2
   * with the h3 look, so no level is skipped (TASK-048 Q3). */
  titleAs?: "h1" | "h2";
}) {
  const Block = Title === "h1" ? "h2" : "h3";
  const has = (id: string) => runs.some((r) => r.id === id);
  const [aId, setA] = useState(has("R3") ? "R3" : runs[0]?.id);
  const [bId, setB] = useState(has("R4a") ? "R4a" : runs[1]?.id ?? runs[0]?.id);
  const data = runs.map((r) => ({ value: r.id, label: `${r.id} · ${r.model} ${r.quant} · ${r.ctx}k` }));
  const a = runs.find((r) => r.id === aId);
  const b = runs.find((r) => r.id === bId);
  const blocks = a && b ? compareRows(a, b, cardMiB, runs.map((r) => r.id)) : [];
  return (
    <section id="compare">
      <div className="run">{compare.kicker}</div>
      <Title className={Title === "h1" ? "as-h2" : undefined}>{compare.title}</Title>
      <div className="cmp">
        <div className="pick">
          <Select data={data} value={aId} onChange={(v) => v && setA(v)} allowDeselect={false} withCheckIcon={false}
            aria-label="การทดลองแรก" classNames={pickClasses} />
          <span className="vs">กับ</span>
          <Select data={data} value={bId} onChange={(v) => v && setB(v)} allowDeselect={false} withCheckIcon={false}
            aria-label="การทดลองที่สอง" classNames={pickClasses} />
        </div>
        {a && b && blocks.length === 0 && <p className="nocommon">{NO_COMMON}</p>}
        {a && b && blocks.length > 0 && <CaughtBars blocks={blocks} a={a} b={b} />}
        {a && b &&
          blocks.map((block) => {
            const ia = a.items.find((i) => i.item === block.item);
            const ib = b.items.find((i) => i.item === block.item);
            const cap = Math.max(ia?.cap ?? 0, ib?.cap ?? 0);
            /** The minutes row draws each side as a bar on the pair's cap, hatched when that side timed out (TASK-057). */
            const cell = (m: (typeof block.metrics)[number], side: "a" | "b") => {
              const it = side === "a" ? ia : ib;
              const win = side === "a" ? m.winA : m.winB;
              const cls = [win ? "win" : "", m.name === TIME && it?.timedOut ? "stopped" : ""].filter(Boolean).join(" ") || undefined;
              return (
                <td role="cell" className={cls}>
                  {m[side]}
                  {win && <span className="sr">{` ${BETTER}`}</span>}
                  {m.name === TIME && it && cap > 0 && <Track pct={share(it.minutes, cap)} />}
                </td>
              );
            };
            return (
              <div className="cmp-item" key={block.item}>
                <Block className={Title === "h1" ? "as-h3" : undefined}>{block.label}</Block>
                {/* Explicit roles keep the table's meaning when a phone lays its rows out as a grid (TASK-057: the pair
                    stacks under each metric at 375, so both runs are seen with no sideways scroller). */}
                <div className="scroll">
                  <table role="table">
                    <thead role="rowgroup">
                      <tr role="row">
                        <td role="cell" className="corner" />
                        <th role="columnheader" scope="col" className="who"><b>{a.id}</b> {`${a.model} ${a.quant}`}</th>
                        <th role="columnheader" scope="col" className="who"><b>{b.id}</b> {`${b.model} ${b.quant}`}</th>
                      </tr>
                    </thead>
                    <tbody role="rowgroup">
                      {block.metrics.map((m) => (
                        <tr key={m.name} role="row">
                          <th role="rowheader" scope="row">
                            {m.name === TIME ? TIME_SHOWN : m.name}
                            {/* PM, TASK-057 words 7: the bars' 100% is the pair's cap. */}
                            {m.name === TIME && cap > 0 && <small className="vz-marklabel cmp-cap">{W.minutesOf(cap)}</small>}
                          </th>
                          {cell(m, "a")}
                          {cell(m, "b")}
                        </tr>
                      ))}
                      {block.points.length > 0 ? (
                        block.points.map((p, i) => (
                          <tr key={p.label} className="pt" role="row">
                            <th role="rowheader" scope="row"><b>{`จุด ${i + 1}`}</b>{p.label}</th>
                            <td role="cell"><Mark caught={p.a} /></td>
                            <td role="cell"><Mark caught={p.b} /></td>
                          </tr>
                        ))
                      ) : (
                        <tr role="row">
                          <th role="rowheader" scope="row">{CAUGHT_Q}</th>
                          <td role="cell"><span className="mute">{NOT_MEASURED}</span></td>
                          <td role="cell"><span className="mute">{NOT_MEASURED}</span></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        <p className="mute" style={{ fontSize: 13 }}>{compare.note}</p>
      </div>
    </section>
  );
}
