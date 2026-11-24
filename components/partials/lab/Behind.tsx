"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { CHART, LOOP, minuteAt, nearestPoint, readout } from "@/lib/lab/loop-series";
import type { Meta, Page, Run } from "@/lib/lab/types";
import { pct, tight } from "@/lib/lab/vram";

// เบื้องหลัง: layout of reference/index.html lines 356–417, chart after its script at lines 549–591. Text from page.json →
// behind; the legend, axis and phase words and the aria-labels are the reference's own (SA-decided, TASK-005 § Questions 4).
// The findings and guards fold titles are the reference's (REQ-001 Q12, the PM); the 6th fold is page.json → behind.next
// (Modio's re-issue, TASK-009).
const PART: Record<string, string> = { system: "sys", tools: "tools", card: "card", injected: "inj" };

export function Behind({ runs, meta, page, titleAs: Title = "h2" }: {
  runs: Run[];
  meta: Meta;
  page: Page;
  /** SPEC-012 D11: "h1" where the section is the page (/about); it keeps the h2 look. */
  titleAs?: "h1" | "h2";
}) {
  const b = page.behind;
  const gaugeRows = runs.flatMap((r) =>
    r.items
      .filter((i) => i.vram !== null)
      .map((i) => ({ key: `${r.id}-${i.item}`, label: `${r.model} ${r.quant} · ${r.ctx}k${r.items.length > 1 ? ` · ${i.item}` : ""}`, vram: i.vram as number })),
  );
  return (
    <section id="behind">
      <div className="run">{b.kicker}</div>
      <Title className={Title === "h1" ? "as-h2" : undefined}>{b.title}</Title>
      <div className="folds">
        <Fold title={b.tokens.title} sub={b.tokens.sub}>
          <p>{b.tokens.lead}</p>
          <div className="bars" role="img" aria-label="จำนวน token ก่อนเริ่มงาน เทียบกับหน้าต่างความจำ 64k">
            {b.tokens.bars.map((bar) => (
              <div className="bar" key={bar.label}>
                <span className="lbl">{bar.label}</span>
                <div className="track grow">
                  {Object.entries(bar.parts).map(([k, v]) => (
                    <i key={k} className={PART[k]} style={{ width: `${(v / b.tokens.scaleTokens) * 100}%` }} />
                  ))}
                </div>
                <span className="num">{`~${bar.total.toLocaleString("en-US")}`}</span>
              </div>
            ))}
            <div className="legend">
              <span><i style={{ background: "var(--signal)" }} />คำสั่งระบบ</span>
              <span><i style={{ background: "var(--ok)" }} />การ์ดความรู้ทีม (~510)</span>
              <span><i style={{ background: "var(--signal-soft)", border: "1px solid var(--signal)" }} />นิยามเครื่องมือ</span>
              <span><i style={{ background: "var(--review-soft)", border: "1px solid var(--review)" }} />บริบทที่แทรกเข้ามา</span>
              <span>ความยาวแถบ = สัดส่วนของความจำ 64k</span>
            </div>
          </div>
          <p className="proved">{b.tokens.proved}</p>
        </Fold>

        <Fold title={b.loop.title} sub={b.loop.sub}>
          <p>{b.loop.lead}</p>
          <LoopChart />
          <div className="rounds">
            {b.loop.rounds.map((r) => (
              <div className="round" key={r.title}>
                <b>{r.title}</b>
                <span>{r.did}</span>
                <div className={r.accepted ? "rev ok" : "rev"}>
                  {r.accepted ? r.review : <><b>ตรวจกลับ:</b> {r.review}</>}
                </div>
              </div>
            ))}
          </div>
          <p className="proved">{b.loop.proved}</p>
        </Fold>

        <Fold title={b.gauge.title} sub={b.gauge.sub}>
          <div className="bars" role="img" aria-label="หน่วยความจำการ์ดสูงสุดที่ใช้จริง บนสเกล 48 GB">
            {gaugeRows.map((g) => (
              <div className="bar" key={g.key}>
                <span className="lbl">{g.label}</span>
                <div className="mini" style={{ height: 18 }}>
                  <i className={tight(g.vram, b.gauge.cardMiB, b.gauge.comfort) ? "grow tight" : "grow"}
                    style={{ width: `${pct(g.vram, b.gauge.cardMiB)}%` }} />
                  <span className="l75" style={{ left: `${b.gauge.comfort * 100}%` }} />
                </div>
                <span className="num">{`${pct(g.vram, b.gauge.cardMiB)}%`}</span>
              </div>
            ))}
          </div>
          <p className="mute" style={{ fontSize: 14 }}>{b.gauge.note}</p>
        </Fold>

        <Fold title="ข้อค้นพบ" sub={`${b.findings.length} เรื่อง`}>
          <div className="find">
            {b.findings.map(([t, d]) => (
              <div key={t}>
                <b>{t}</b>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </Fold>

        <Fold title="วิธีคุมเงิน" sub={`เพดาน $${meta.capUsd} ต่อเดือน`}>
          <ul className="guards">
            {b.guards.map(([t, d], i) => (
              <li key={t}>
                <span className="k">{i + 1}</span>
                <span><b>{t}</b> {d}</span>
              </li>
            ))}
          </ul>
          <p className="mute" style={{ fontSize: 14 }}>{b.guardsNote}</p>
        </Fold>

        <Fold title={b.next.title} sub={b.next.sub}>
          <p>{b.next.body}</p>
        </Fold>
      </div>
    </section>
  );
}

function Fold({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <details className="fold">
      <summary>
        {title} <small>{sub}</small>
      </summary>
      <div className="in">{children}</div>
    </details>
  );
}

const { W, H, L, R, T, B } = CHART;
const x = (m: number) => L + (m / LOOP.span) * (W - L - R);
const y = (v: number) => T + (1 - v / 100) * (H - T - B);

/** Rent 3's GPU over the review loop, with a pointer read-out (reference lines 552–591). */
function LoopChart() {
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ m: number; left: number; top: number } | null>(null);
  const show = (e: PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget.getBoundingClientRect();
    const cb = box.current?.getBoundingClientRect();
    if (!cb) return;
    const m = minuteAt((e.clientX - svg.left) / svg.width);
    const p = nearestPoint(m);
    setAt({
      m,
      left: Math.max(90, Math.min(cb.width - 90, e.clientX - cb.left)),
      top: svg.top - cb.top + (y(p[1]) / H) * svg.height,
    });
  };
  const pts = LOOP.gpu.map(([m, v]) => `${x(m).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const p = at ? nearestPoint(at.m) : null;
  const lines = at ? readout(at.m) : null;
  return (
    <div className="chart" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="กราฟการ์ดจอตลอดลูป 74 นาที แบ่งตามรอบ"
        onPointerMove={show} onPointerDown={show} onPointerLeave={() => setAt(null)}>
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} />
            <text x={L - 6} y={y(v) + 4} textAnchor="end">{`${v}%`}</text>
          </g>
        ))}
        {LOOP.rounds.map((r, i) => {
          const e = LOOP.ends[i];
          const next = LOOP.rounds[i + 1] ?? LOOP.span;
          return (
            <g key={r}>
              <rect x={x(r)} y={T} width={x(e) - x(r)} height={H - T - B} fill="var(--signal-soft)" opacity={0.55} />
              <text x={x(r) + 6} y={T - 8} style={{ fill: "var(--signal)" }}>{`รอบ ${i + 1}`}</text>
              {i < LOOP.rounds.length - 1 && (
                <>
                  <rect x={x(e)} y={T} width={x(next) - x(e)} height={H - T - B} fill="var(--review-soft)" />
                  <text x={(x(e) + x(next)) / 2} y={T - 8} textAnchor="middle" style={{ fill: "var(--review)" }}>ตรวจ</text>
                </>
              )}
            </g>
          );
        })}
        {LOOP.compact.map((c) => (
          <line key={c} x1={x(c)} x2={x(c)} y1={T} y2={H - B} stroke="var(--think)" strokeDasharray="3 3" strokeWidth={1} />
        ))}
        <polygon points={`${x(LOOP.gpu[0][0])},${y(0)} ${pts} ${x(LOOP.gpu[LOOP.gpu.length - 1][0])},${y(0)}`} fill="var(--signal)" opacity={0.12} />
        <polyline points={pts} fill="none" stroke="var(--signal)" strokeWidth={2} />
        {[0, 15, 30, 45, 60, 74].map((m) => (
          <text key={m} x={x(m)} y={H - 8} textAnchor="middle">{`${m} นาที`}</text>
        ))}
        <text x={x(1)} y={y(88)} style={{ fill: "var(--mute)" }}>การ์ดจอบนเครื่องเช่า (เฉลี่ย 1 นาที) · เส้นประม่วง = ความจำเต็ม</text>
        {at && p && (
          <>
            <line x1={x(at.m)} x2={x(at.m)} y1={T} y2={H - B} stroke="var(--ink)" strokeWidth={1} opacity={0.35} />
            <circle cx={x(p[0])} cy={y(p[1])} r={4} fill="var(--signal)" stroke="var(--paper)" strokeWidth={2} />
          </>
        )}
      </svg>
      {at && lines && (
        <div className="tip" style={{ left: at.left, top: at.top }}>
          {lines[0]}
          <br />
          {lines[1]}
        </div>
      )}
    </div>
  );
}
