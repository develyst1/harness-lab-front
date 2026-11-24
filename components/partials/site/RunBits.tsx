import Link from "next/link";
import { Dots } from "@/components/partials/lab/Answer";
import type { Run } from "@/lib/lab/types";

// A run's parts as the one-page site's ประวัติ entry showed them: the machine line, the verdict pill and the item lines.
// This is their one home (SPEC-012 D3): /runs, the run page and the home's latest run all read them here.

/** The ประวัติ entry's machine line, word for word ("หัวหน้าตรวจ" reads "Tech Lead ตรวจ", REQ-001 Q12 (5)). */
export const machine = (r: Pick<Run, "gpu" | "model" | "quant" | "ctx" | "card" | "loop" | "cost">) =>
  `${r.gpu} · ${r.model} ${r.quant} · ความจำ ${r.ctx}k${r.card ? " · การ์ดความรู้ทีม" : ""}${r.loop ? " · Tech Lead ตรวจ" : ""} · $${r.cost.toFixed(2)}`;

export function Pill({ run }: { run: Pick<Run, "label" | "verdict"> }) {
  return run.label && run.verdict ? <span className={`pill ${run.verdict}`}>{run.label}</span> : null;
}

/** History.tsx's item lines: label · minutes / cap นาที (· หมดเวลา) · the caught-bug dots. */
export function ItemLines({ run }: { run: Run }) {
  return (
    <ul className="site-items">
      {run.items.map((i) => (
        <li key={i.item}>
          <span>{`${i.label} · ${i.minutes} / ${i.cap} นาที${i.timedOut ? " · หมดเวลา" : ""} ·`}</span>
          <Dots mutations={i.mutations} />
        </li>
      ))}
    </ul>
  );
}

/** A run as a card that links to its page (the home's latest run). */
export function RunCard({ run }: { run: Run }) {
  return (
    <Link href={`/runs/${run.id}`} className="site-card">
      <span className="site-id">{`${run.id} · ${run.date}`}</span>
      <b>{run.title}</b>
      <span className="mute">{machine(run)}</span>
      <Pill run={run} />
    </Link>
  );
}
