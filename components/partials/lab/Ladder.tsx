import type { Page } from "@/lib/lab/types";

// The level ladder (REQ-001 req 11, AC-22), inside คำตอบ under the cards. Text and which level is marked come from
// page.json → ladder; the now / next mark words are the PM's (REQ-001 Q10), "ผ่านแล้ว" for `done` (pack v3) is the SA's
// default pending the PM (REQ-003 Q4). Each card spans the 3 rows of the .levels subgrid.
const MARK: Record<string, string> = { done: "ผ่านแล้ว", now: "อยู่ตรงนี้", next: "ขั้นถัดไป" };

export function Ladder({ ladder }: { ladder: Page["ladder"] }) {
  return (
    <div className="ladder6">
      <h3>{ladder.title}</h3>
      <ol className="levels">
        {ladder.levels.map((l) => (
          <li key={l.level} className={MARK[l.status] ? `level ${l.status}` : "level"}>
            <span className="lv">
              <b>{l.level}</b>
              {MARK[l.status] && <span className={`mark ${l.status}`}>{MARK[l.status]}</span>}
            </span>
            <span>{l.means}</span>
            <span className="mute">{l.test}</span>
          </li>
        ))}
      </ol>
      <p className="mute">{ladder.note}</p>
    </div>
  );
}
