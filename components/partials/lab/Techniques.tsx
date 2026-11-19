import { groupName } from "@/lib/lab/techniques";
import type { Page, Technique } from "@/lib/lab/types";

// เทคนิค (SPEC-003 § Front): head from page.json → techniques, then one card per techniques.json entry in pack order.
// Every card spans the same 7 rows of .techs (subgrid, SPEC-001 L6): id + group · name · model · metric · before | after ·
// gain · evidence. The four small labels and the link text are UI words [SA-decided], REQ-003 Q4. Technique text is
// Modio's (the …Th fields); the browser gets no other (lib/lab/view.ts).
export function Techniques({
  techniques,
  head,
  onShowRow,
}: {
  techniques: Technique[];
  head: Page["techniques"];
  onShowRow: (rowId: string) => void;
}) {
  return (
    <section id="techniques">
      <div className="run">{head.kicker}</div>
      <h2>{head.title}</h2>
      <p className="mute">{head.intro}</p>
      <ol className="techs">
        {techniques.map((t) => (
          <li key={t.id} className="tech">
            <div className="tech-head">
              <span className="tid">{t.id}</span>
              <span className="group">{groupName(head.groups, t.group)}</span>
            </div>
            <h3>{t.nameTh}</h3>
            <p className="kv">
              <span className="k">โมเดล</span>
              <span>{t.model}</span>
            </p>
            <p className="kv">
              <span className="k">วัดอะไร</span>
              <span>{t.metricTh}</span>
            </p>
            <div className="ba">
              <p>
                <span className="k">ก่อน</span>
                <span>{t.beforeTh}</span>
              </p>
              <p>
                <span className="k">หลัง</span>
                <span>{t.afterTh}</span>
              </p>
            </div>
            <p className="gain">{t.gainTh}</p>
            <div className="ev">
              <p className="mute">{t.evidenceTh}</p>
              {t.rows && t.rows.length > 0 && (
                <p className="ev-links">
                  {t.rows.map((id) => (
                    <a
                      key={id}
                      href={`#run-${id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onShowRow(id);
                      }}
                    >
                      {`ดู ${id} ในประวัติ`}
                    </a>
                  ))}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
