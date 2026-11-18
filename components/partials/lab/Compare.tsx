"use client";

import { useState } from "react";
import { Select } from "@mantine/core";
import { compareRows } from "@/lib/lab/compare";
import type { Page, Run } from "@/lib/lab/types";
import { Dots } from "./Answer";

// เทียบเอง: layout of reference/index.html lines 264–278, values per lib/lab/compare.ts. Only the items both rows hold
// are compared, one block per item. Defaults R3 vs R4a (reference line 529).
const NO_COMMON = "สองการทดลองนี้ไม่ได้ทำข้อเดียวกัน เลือกคู่อื่นมาเทียบ"; // REQ-001 Q9 (b)

const pickClasses = { input: "pick-input", dropdown: "pick-dropdown", option: "pick-option" };

export function Compare({ runs, compare, cardMiB }: { runs: Run[]; compare: Page["compare"]; cardMiB: number }) {
  const has = (id: string) => runs.some((r) => r.id === id);
  const [aId, setA] = useState(has("R3") ? "R3" : runs[0]?.id);
  const [bId, setB] = useState(has("R4a") ? "R4a" : runs[1]?.id ?? runs[0]?.id);
  const data = runs.map((r) => ({ value: r.id, label: `${r.id} · ${r.model} ${r.quant} · ${r.ctx}k` }));
  const a = runs.find((r) => r.id === aId);
  const b = runs.find((r) => r.id === bId);
  const blocks = a && b ? compareRows(a, b, cardMiB) : [];
  return (
    <section id="compare">
      <div className="run">{compare.kicker}</div>
      <h2>{compare.title}</h2>
      <div className="cmp">
        <div className="pick">
          <Select data={data} value={aId} onChange={(v) => v && setA(v)} allowDeselect={false} withCheckIcon={false}
            aria-label="การทดลองแรก" classNames={pickClasses} />
          <span className="vs">กับ</span>
          <Select data={data} value={bId} onChange={(v) => v && setB(v)} allowDeselect={false} withCheckIcon={false}
            aria-label="การทดลองที่สอง" classNames={pickClasses} />
        </div>
        {a && b && blocks.length === 0 && <p className="nocommon">{NO_COMMON}</p>}
        {a && b &&
          blocks.map((block) => {
            const points = (block.mutations[0] ?? block.mutations[1])?.points ?? [];
            return (
              <div className="cmp-item" key={block.item}>
                <h3>{block.label}</h3>
                <div className="scroll">
                  <table>
                    <thead>
                      <tr>
                        <th />
                        <td className="who"><b>{a.id}</b> {`${a.model} ${a.quant}`}</td>
                        <td className="who"><b>{b.id}</b> {`${b.model} ${b.quant}`}</td>
                      </tr>
                    </thead>
                    <tbody>
                      {block.metrics.map((m) => (
                        <tr key={m.name}>
                          <th scope="row">{m.name}</th>
                          <td className={m.winA ? "win" : undefined}>{m.a}</td>
                          <td className={m.winB ? "win" : undefined}>{m.b}</td>
                        </tr>
                      ))}
                      <tr>
                        <th scope="row">จุดไหนจับได้</th>
                        <td><Dots mutations={block.mutations[0]} /></td>
                        <td><Dots mutations={block.mutations[1]} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                {points.length > 0 && (
                  <div className="legend4">
                    {points.map((p, i) => (
                      <span key={i}><b>{`จุด ${i + 1}`}</b>{p.label}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        <p className="mute" style={{ fontSize: 13 }}>{compare.note}</p>
      </div>
    </section>
  );
}
