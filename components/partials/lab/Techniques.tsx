import Link from "next/link";
import type { TechniquesView } from "@/lib/lab/site";
import { groupName } from "@/lib/lab/techniques";
import type { Page, Technique } from "@/lib/lab/types";

// เทคนิค (SPEC-003 § Front; SPEC-012 § Site map): head from page.json → techniques, then the cards in one block per group
// (lib/lab/site.ts techniquesView), each block headed by the group's Thai name. Every card spans the same 8 rows of
// .techs (subgrid, SPEC-001 L6): id + group · name · what it does · model · metric · before | after · gain · evidence. The
// small labels and the link text are UI words (REQ-003 Q4 [SA-decided]; "ทำอะไร" [PM-decided], SPEC-004 § Round 2).
// Technique text is Modio's (the …Th fields); the browser gets no other (lib/lab/view.ts).

/** One technique card. On /techniques its name (h3) links to the technique's page. On that page (`own`) the name is not a
 * link and is the page's h1 (SPEC-012 D11), with the h3 look. Each evidence link goes to the run's page (SPEC-012 D4),
 * its text unchanged. */
export function TechCard({ t, groups, own = false }: { t: Technique; groups: Record<string, string>; own?: boolean }) {
  return (
    <li className="tech">
      <div className="tech-head">
        <span className="tid">{t.id}</span>
        <span className="group">{groupName(groups, t.group)}</span>
      </div>
      {own ? <h1>{t.nameTh}</h1> : <h3><Link href={`/techniques/${t.id}`}>{t.nameTh}</Link></h3>}
      <p className="kv">
        <span className="k">ทำอะไร</span>
        <span>{t.whatTh}</span>
      </p>
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
              <Link key={id} href={`/runs/${id}`}>
                {`ดู ${id} ในประวัติ`}
              </Link>
            ))}
          </p>
        )}
      </div>
    </li>
  );
}

/** /techniques: the section head, then one block per group with its cards. `titleAs` (SPEC-012 D11): "h1" on the page. */
export function Techniques({ head, groups, titleAs: Title = "h2" }: { head: Page["techniques"]; groups: TechniquesView["groups"]; titleAs?: "h1" | "h2" }) {
  return (
    <section id="techniques">
      <div className="run">{head.kicker}</div>
      <Title className={Title === "h1" ? "as-h2" : undefined}>{head.title}</Title>
      <p className="mute">{head.intro}</p>
      {groups.map((g) => (
        <section key={g.group} className="tech-group" aria-labelledby={`group-${g.group}`}>
          <h2 id={`group-${g.group}`}>{g.name}</h2>
          <ol className="techs">
            {g.techniques.map((t) => (
              <TechCard key={t.id} t={t} groups={head.groups} />
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
}
