"use client";

import { useState } from "react";
import { Collapse } from "@mantine/core";
import type { Page, Run } from "@/lib/lab/types";
import { Dots } from "./Answer";

// ประวัติ: layout of reference/index.html lines 257–262, entries after its script at lines 505–517. Every entry shares
// the columns of .log (subgrid, SPEC-001 L6), so ids, titles, pills and chevrons line up row to row.

/** The machine line of reference line 510; "หัวหน้าตรวจ" reads "Tech Lead ตรวจ" (REQ-001 Q12 (5), the PM). */
const machine = (r: Run) =>
  `${r.gpu} · ${r.model} ${r.quant} · ความจำ ${r.ctx}k${r.card ? " · การ์ดความรู้ทีม" : ""}${r.loop ? " · Tech Lead ตรวจ" : ""} · $${r.cost.toFixed(2)}`;

export function History({ runs, history }: { runs: Run[]; history: Page["history"] }) {
  return (
    <section id="history">
      <div className="run">{history.kicker}</div>
      <h2>{history.title}</h2>
      <p className="mute">{history.intro}</p>
      <div className="log">
        {runs.map((r) => (
          <Entry key={r.id} row={r} />
        ))}
      </div>
    </section>
  );
}

function Entry({ row }: { row: Run }) {
  const [open, setOpen] = useState(false);
  const bodyId = `b-${row.id}`;
  return (
    <div className={open ? "entry open" : "entry"}>
      <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={() => setOpen((o) => !o)}>
        <span className="id">{`${row.id} · ${row.date}`}</span>
        <span className="what">
          <b>{row.title}</b>
          <span>{machine(row)}</span>
        </span>
        {row.label && row.verdict ? <span className={`pill ${row.verdict}`}>{row.label}</span> : <span />}
        <span className="chev" aria-hidden="true">
          ›
        </span>
      </button>
      <Collapse expanded={open} keepMounted id={bodyId} className="fold-body">
        <div className="body">
        <p>{row.sum}</p>
        <ul>
          {row.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <ul className="items">
          {row.items.map((i) => (
            <li key={i.item}>
              <span>{`${i.label} · ${i.minutes} / ${i.cap} นาที${i.timedOut ? " · หมดเวลา" : ""} ·`}</span>
              <Dots mutations={i.mutations} />
            </li>
          ))}
        </ul>
        </div>
      </Collapse>
    </div>
  );
}
