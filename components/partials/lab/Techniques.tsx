import {
  IconClipboardCheck, IconCoin, IconRulerMeasure, IconServerBolt, IconShieldLock, IconStethoscope, IconTool, IconUsers,
  type Icon,
} from "@tabler/icons-react";
import Link from "next/link";
import { createElement } from "react";
import { Grow } from "@/components/partials/site/Grow";
import { W } from "@/components/partials/site/words";
import { anyCut, BeforeAfter, Fold, IconBox, IconCard } from "@/components/partials/viz";
import { leadOf } from "@/lib/lab/lead";
import { NOT_MEASURED } from "@/lib/lab/compare";
import { techReadout, type TechniquesView } from "@/lib/lab/site";
import { groupName } from "@/lib/lab/techniques";
import { techPairs } from "@/lib/lab/techViz";
import type { Page, Technique } from "@/lib/lab/types";

// เทคนิค (SPEC-003 § Front; SPEC-012 § Site map; REQ-012 the comp TASK-054, the owner's AC-1 yes, TASK-056): the head;
// the READOUT, every technique whose numbers can be drawn, each as its gain and its first before → after, linking to its
// card; a group index of icon cards; then per group an icon header and its cards. A card: id and name; the gain as the
// lead; "วัดอะไร" open (it is short, and the picture needs it); before → after (drawn where the pack's numbers allow,
// techViz.ts, unless the readout already draws it: then its two texts, SPEC-013 Q4); then one fold whose summary is
// "ทำอะไร" and whose body holds the model, the whole sides where the picture shows part of them, and the evidence. The
// small labels and the link text are the live card's UI words (REQ-003 Q4; "ทำอะไร" [PM-decided]); technique text is
// Modio's (the …Th fields), unchanged.
const GROUP_ICON: Record<string, Icon> = {
  harness: IconTool,
  process: IconUsers,
  "model-fit": IconRulerMeasure,
  evaluation: IconClipboardCheck,
  serving: IconServerBolt,
  diagnosis: IconStethoscope,
  ops: IconCoin,
  governance: IconShieldLock,
};
// Own keys only (TEST-012 DEF-1): a pack group named "constructor" read Object's own constructor and crashed the page.
const iconOf = (group: string): Icon => (Object.hasOwn(GROUP_ICON, group) ? GROUP_ICON[group]! : IconTool);

/** /techniques: the head (its title is the page's h1, SPEC-012 D11), the readout, the group index, then the groups. */
export function Techniques({ head, groups }: { head: Page["techniques"]; groups: TechniquesView["groups"] }) {
  const drawn = techReadout(groups);
  const inReadout = new Set(drawn.map((x) => x.t.id));
  return (
    <>
      <Grow />
      <header className="cv-head" id="techniques">
        <div className="run">{head.kicker}</div>
        <h1 className="as-h2">{head.title}</h1>
        <p className="mute">{head.intro}</p>
      </header>

      <section className="cv-readout" aria-labelledby="drawn-h">
        <h2 id="drawn-h" className="as-h3">
          {W.drawn}
        </h2>
        <ul className="cv-grid2 cv-list cv-drawn">
          {drawn.map(({ t, pairs }) => (
            <li key={t.id}>
              <a href={`#t-${t.id}`} className="cv-drawn-a">
                <span className="tid">{t.id}</span>
                <b>{t.gainTh}</b>
              </a>
              {/* What the numbers measure, so the drawing has its unit (critique A, P1-2). */}
              <p className="cv-kv">
                <span className="cv-k">วัดอะไร</span>
                <span>{t.metricTh}</span>
              </p>
              <BeforeAfter pairs={pairs.slice(0, 1)} />
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label={W.techGroups} className="cv-index">
        {groups.map((g) => {
          const I = iconOf(g.group);
          return <IconCard key={g.group} href={`#group-${g.group}`} icon={<I stroke={1.75} />} title={g.name} count={g.techniques.length} />;
        })}
      </nav>
      {groups.map((g) => {
        const I = iconOf(g.group);
        return (
          <section key={g.group} className="cv-sec" aria-labelledby={`group-${g.group}`}>
            <h2 id={`group-${g.group}`} className="as-h3">
              <IconBox>
                <I stroke={1.75} />
              </IconBox>
              {g.name}
            </h2>
            <ol className="cv-grid2 cv-list">
              {g.techniques.map((t) => (
                <TechCard key={t.id} t={t} drawnFirst={inReadout.has(t.id)} />
              ))}
            </ol>
          </section>
        );
      })}
    </>
  );
}

/** One technique card. On /techniques it is a list item whose name (h3) links to the technique's page. `drawnFirst` (the
 * readout already draws its first pair, SPEC-013 Q4: "drop the per-card drawing for the pairs the readout already
 * shows"): the card draws its other pairs, or, with no other pair, shows its two texts. On that page (`own`, with
 * `groups` to name its group) it is the page's article: the name is the h1 (SPEC-012 D11) and the whole drawing leads,
 * under "วัดอะไร". Each evidence link goes to the run's page (SPEC-012 D4), its text unchanged. */
export function TechCard({ t, drawnFirst = false, own }: { t: Technique; drawnFirst?: boolean; own?: { groups: Record<string, string> } }) {
  const all = techPairs(t);
  const rest = drawnFirst ? all.pairs.slice(1) : all.pairs;
  const { pairs, whole } =
    rest.length > 0 ? { pairs: rest, whole: all.whole }
    : t.beforeTh || t.afterTh ? { pairs: [{ before: { text: t.beforeTh || NOT_MEASURED }, after: { text: t.afterTh || NOT_MEASURED } }], whole: true }
    : { pairs: [], whole: true }; // TEST-012 DEF-1 / DEF-5: both missing → no pair; one missing → it reads "ไม่ได้วัด"
  const foldSides = !whole || anyCut(pairs);
  const whatCut = leadOf(t.whatTh).cut;
  const metric = (
    <p className="cv-kv">
      <span className="cv-k">วัดอะไร</span>
      <span>{t.metricTh}</span>
    </p>
  );
  const body = (
    <>
      {/* One fold: its summary is "ทำอะไร" (whole when it fits a lead, so the body does not repeat it); the body holds
          the rest of it, the model, the whole sides when the picture shows only part of them, and the evidence. */}
      <Fold text={t.whatTh} label={<span className="cv-k">ทำอะไร </span>}>
        <dl className="cv-dl">
          {whatCut && (
            <>
              <dt>ทำอะไร</dt>
              <dd>{t.whatTh}</dd>
            </>
          )}
          <dt>โมเดล</dt>
          <dd>{t.model}</dd>
          {foldSides && (t.beforeTh || t.afterTh) && (
            <>
              <dt>ก่อน</dt>
              <dd>{t.beforeTh || NOT_MEASURED}</dd>
              <dt>หลัง</dt>
              <dd>{t.afterTh || NOT_MEASURED}</dd>
            </>
          )}
        </dl>
        <p className="mute">{t.evidenceTh}</p>
      </Fold>
      {t.rows && t.rows.length > 0 && (
        <p className="ev-links">
          {t.rows.map((id) => (
            <Link key={id} href={`/runs/${id}`}>
              {`ดู ${id} ในประวัติ`}
            </Link>
          ))}
        </p>
      )}
    </>
  );

  if (own)
    return (
      <article className="cv-card cv-tech own">
        <div className="tech-head">
          <span className="tid">{t.id}</span>
          <span className="group">{groupName(own.groups, t.group)}</span>
        </div>
        <h1 className="as-h3">{t.nameTh}</h1>
        {metric}
        {pairs.length > 0 && <BeforeAfter pairs={pairs} />}
        <p className="gain">{t.gainTh}</p>
        {body}
      </article>
    );

  return (
    <li id={`t-${t.id}`} className="cv-card cv-tech">
      <div className="tech-top">
        {/* TASK-072 R3 (TEST-012 DEF-3): the card carries its group's icon, the one on the group's heading, so a phone
            screen in the middle of a long group still shows which group it is in (and is not text only). */}
        <IconBox>
          {createElement(iconOf(t.group), { stroke: 1.75 })}
        </IconBox>
        <span className="tid">{t.id}</span>
        <h3>
          <Link href={`/techniques/${t.id}`}>{t.nameTh}</Link>
        </h3>
      </div>
      <p className="gain">{t.gainTh}</p>
      {metric}
      {pairs.length > 0 && <BeforeAfter pairs={pairs} />}
      {body}
    </li>
  );
}
