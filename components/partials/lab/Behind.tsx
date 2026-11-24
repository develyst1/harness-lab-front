"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Fold as LeadFold } from "@/components/partials/viz";
import { CHART, LOOP, nearestPoint, readout } from "@/lib/lab/loop-series";
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
      {/* TASK-058 (SPEC-013 row 5): the three charts are open, each under its own heading; the prose around them folds
          behind its own lead (viz Fold, leadOf). The other folds stay as they were. */}
      <div className="about-charts">
        <Chart title={b.tokens.title} sub={b.tokens.sub}>
          <LeadFold text={b.tokens.lead} />
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
          <LeadFold text={b.tokens.proved} className="proved" />
        </Chart>

        <Chart title={b.loop.title} sub={b.loop.sub}>
          <LeadFold text={b.loop.lead} />
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
          <LeadFold text={b.loop.proved} className="proved" />
        </Chart>

        <Chart title={b.gauge.title} sub={b.gauge.sub}>
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
          <LeadFold text={b.gauge.note} className="mute about-note" />
        </Chart>
      </div>

      <div className="folds">
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

/** An open chart section: its title as an h2 with the h3 look (under the page's h1), its sub beside it. */
function Chart({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <section className="about-chart">
      <h2 className="as-h3">
        {title} <small>{sub}</small>
      </h2>
      {children}
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
const pctX = (m: number) => `${(m / LOOP.span) * 100}%`;

/** Rent 3's GPU over the review loop, with a pointer read-out (reference lines 552–591). TASK-058 (REQ-012 row 5): the
 * SVG holds only the plot (its margins cropped, stretched to the box, strokes unscaled), and every word around it (the
 * axis, the rounds, the legend) is HTML text at 12 px or more, so it stays readable at 375. The words are the
 * reference's; "ตรวจ" moves from over each review band to a key under the plot. */
function LoopChart() {
  const box = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState<{ m: number; left: number; top: number } | null>(null);
  const show = (e: PointerEvent<SVGSVGElement>) => {
    const svg = e.currentTarget.getBoundingClientRect();
    const cb = box.current?.getBoundingClientRect();
    if (!cb) return;
    const m = Math.max(0, Math.min(LOOP.span, ((e.clientX - svg.left) / svg.width) * LOOP.span));
    const p = nearestPoint(m);
    setAt({
      m,
      left: Math.max(90, Math.min(cb.width - 90, e.clientX - cb.left)),
      top: svg.top - cb.top + (1 - p[1] / 100) * svg.height,
    });
  };
  const pts = LOOP.gpu.map(([m, v]) => `${x(m).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const p = at ? nearestPoint(at.m) : null;
  const lines = at ? readout(at.m) : null;
  const ns = { vectorEffect: "non-scaling-stroke" } as const;
  return (
    <div className="chart lc" ref={box}>
      <div className="lc-top" aria-hidden="true">
        {LOOP.rounds.map((r, i) => (
          <span key={r} style={{ left: pctX(r) }}>{`รอบ ${i + 1}`}</span>
        ))}
      </div>
      <div className="lc-mid">
        <div className="lc-y" aria-hidden="true">
          {[100, 50, 0].map((v) => (
            <span key={v} style={{ top: `${100 - v}%` }}>{`${v}%`}</span>
          ))}
        </div>
        <div className="lc-plot">
          <svg viewBox={`${L} ${T} ${W - L - R} ${H - T - B}`} preserveAspectRatio="none" role="img"
            aria-label="กราฟการ์ดจอตลอดลูป 74 นาที แบ่งตามรอบ"
            onPointerMove={show} onPointerDown={show} onPointerLeave={() => setAt(null)}>
            {[0, 50, 100].map((v) => (
              <line key={v} x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--line)" strokeWidth={1} style={ns} />
            ))}
            {LOOP.rounds.map((r, i) => {
              const e = LOOP.ends[i];
              const next = LOOP.rounds[i + 1] ?? LOOP.span;
              return (
                <g key={r}>
                  <rect x={x(r)} y={T} width={x(e) - x(r)} height={H - T - B} fill="var(--signal-soft)" opacity={0.55} />
                  {i < LOOP.rounds.length - 1 && <rect x={x(e)} y={T} width={x(next) - x(e)} height={H - T - B} fill="var(--review-soft)" />}
                </g>
              );
            })}
            {LOOP.compact.map((c) => (
              <line key={c} x1={x(c)} x2={x(c)} y1={T} y2={H - B} stroke="var(--think)" strokeDasharray="3 3" strokeWidth={1} style={ns} />
            ))}
            <polygon points={`${x(LOOP.gpu[0][0])},${y(0)} ${pts} ${x(LOOP.gpu[LOOP.gpu.length - 1][0])},${y(0)}`} fill="var(--signal)" opacity={0.12} />
            <polyline points={pts} fill="none" stroke="var(--signal)" strokeWidth={2} style={ns} />
            {at && <line x1={x(at.m)} x2={x(at.m)} y1={T} y2={H - B} stroke="var(--ink)" strokeWidth={1} opacity={0.35} style={ns} />}
          </svg>
          {at && p && <i className="lc-dot" style={{ left: pctX(p[0]), top: `${100 - p[1]}%` }} />}
        </div>
      </div>
      <div className="lc-x" aria-hidden="true">
        {[0, 15, 30, 45, 60, 74].map((m) => (
          <span key={m} style={{ left: pctX(m) }}>{`${m} นาที`}</span>
        ))}
      </div>
      <p className="lc-cap">
        <span className="lc-key"><i />ตรวจ</span>
        <span>การ์ดจอบนเครื่องเช่า (เฉลี่ย 1 นาที) · เส้นประม่วง = ความจำเต็ม</span>
      </p>
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
