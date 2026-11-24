import Link from "next/link";
import { NOT_MEASURED } from "@/lib/lab/compare";
import { firstItem } from "@/lib/lab/items";
import type { Item, Page, Run } from "@/lib/lab/types";
import { gb, pct, tight } from "@/lib/lab/vram";
import { Ladder } from "./Ladder";

// คำตอบ: layout of reference/index.html lines 233–241, cards after its template at lines 467–478. Text from page.json →
// answer (the bold part of the verdict = `verdictEmphasis`); card rows = `answer.modelCards`; the gauge's card size,
// comfort line and title = `behind.gauge`. Card labels are the reference template's own text. Each card's "▶ ดูคลิป" is a
// real link, to `clipHref(row id)` (SPEC-012 § Rework round 1: the run's คลิป tab).
export function Answer({ runs, page, clipHref }: { runs: Run[]; page: Page; clipHref: (rowId: string) => string }) {
  const { answer, behind, ladder } = page;
  const cards = answer.modelCards
    .map((id) => runs.find((r) => r.id === id))
    .filter((r): r is Run => r !== undefined);
  const cut = answer.verdict.indexOf(answer.verdictEmphasis);
  return (
    <section id="answer">
      <div className="run">{answer.kicker}</div>
      <div className="answer">
        <p className="verdict">
          {cut < 0 || !answer.verdictEmphasis ? (
            answer.verdict
          ) : (
            <>
              {answer.verdict.slice(0, cut)}
              <b>{answer.verdictEmphasis}</b>
              {answer.verdict.slice(cut + answer.verdictEmphasis.length)}
            </>
          )}
        </p>
        <div className="models">
          {cards.map((row) => (
            <ModelCard key={row.id} row={row} gauge={behind.gauge} clipHref={clipHref} />
          ))}
        </div>
        <Ladder ladder={ladder} />
        {/* "วัดยังไง:" is a UI label, the PM's (REQ-001 Q11 (b)); the sentence is page.json → answer.how. */}
        <p className="how">
          <b>วัดยังไง:</b> {answer.how}
        </p>
      </div>
    </section>
  );
}

// The card's 8 children are the 8 rows of the .models subgrid (SPEC-001 L1): always render all 8, in this order.
function ModelCard({ row, gauge, clipHref }: { row: Run; gauge: Page["behind"]["gauge"]; clipHref: (rowId: string) => string }) {
  const item = firstItem(row);
  return (
    <article className={row.best ? "model best" : "model"}>
      <span className={`stamp ${row.stamp ?? ""}`}>{row.stampText}</span>
      <h3>{row.model}</h3>
      <span className="quant mute">{`${row.quant} · ความจำ ${row.ctx}k`}</span>
      <p className="tag">{row.tag}</p>
      <div className="stat">
        <span className="k">ความผิดที่เทสต์ของโมเดลจับได้</span>
        <Dots mutations={item?.mutations ?? null} />
      </div>
      <div className="stat">
        <span className="k">เวลาทำข้อยาก (รอบแรก)</span>
        {item ? <span className="v">{`${item.minutes} นาที`}</span> : <span className="mute">{NOT_MEASURED}</span>}
      </div>
      <div className="stat">
        <span className="k">{`${gauge.title}${row.gpu !== "A6000" ? ` (วัดบน ${row.gpu})` : ""}`}</span>
        {item && item.vram !== null ? (
          <>
            <div className="mini">
              <i
                className={tight(item.vram, gauge.cardMiB, gauge.comfort) ? "grow tight" : "grow"}
                style={{ width: `${pct(item.vram, gauge.cardMiB)}%` }}
              />
              <span className="l75" style={{ left: `${gauge.comfort * 100}%` }} />
            </div>
            <span className="mute num" style={{ fontSize: 13 }}>
              {`${pct(item.vram, gauge.cardMiB)}% · ว่าง ${gb(gauge.cardMiB - item.vram)} GB`}
            </span>
          </>
        ) : (
          <span className="mute">{NOT_MEASURED}</span>
        )}
      </div>
      <Link className="play" href={clipHref(row.id)}>
        ▶ ดูคลิป
      </Link>
    </article>
  );
}

/** One dot per planted bug (its label as the dot's title), then caught/total. `null` → ไม่ได้วัด. */
export function Dots({ mutations: m }: { mutations: Item["mutations"] }) {
  if (!m) return <span className="mute">{NOT_MEASURED}</span>;
  return (
    <span className="dots" role="img" aria-label={`จับได้ ${m.caught} จาก ${m.total}`}>
      {m.points.map((p, i) => (
        <i key={i} className={p.caught ? "y" : "n"} title={p.label} />
      ))}
      <span>{`${m.caught}/${m.total}`}</span>
    </span>
  );
}
