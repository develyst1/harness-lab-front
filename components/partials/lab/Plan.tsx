"use client";

import { SegmentedControl, Slider } from "@mantine/core";
import {
  IconBulb, IconChevronDown, IconCircleCheck, IconCpu, IconFlask, IconMapPin, IconServer, IconServerBolt, IconUsers, type Icon,
} from "@tabler/icons-react";
import { Fragment, useState } from "react";
import { Grow } from "@/components/partials/site/Grow";
import { W } from "@/components/partials/site/words";
import { Bars, Fold, Gauge, IconBox, Timeline, type Tone } from "@/components/partials/viz";
import { baht, planSay, tierMoney, type PayClass, type Rates } from "@/lib/lab/plan";
import type { Meta, Page, Tier } from "@/lib/lab/types";

// สเปกและงบ (/hardware; SPEC-013 ranked row 2; REQ-012 the comp TASK-054, the owner's AC-1 yes, TASK-056): the answer
// first. The head with its lead folded (leadOf), then the READOUT: the hours / days controls (the old Plan's, same words
// and ranges), the payback of each tier to buy as bars on one 0–10 year scale with dashed lines at 2 and 4 years, and the
// live sentence (planSay) under them — all in one view, so a drag shows its effect. Then the spec sheet folded, the tiers
// as icon cards (the memory bar with its value, the power bill against the rent, the role chips with icons, the lists
// folded), the next steps as a timeline, the caveats and the sources. Text from page.json → plan / spec; "จ่ายไปแล้ว" from
// meta.json (SPEC-001 § Pack v2); the words inside the controls and the tier cards are the reference's own labels
// (SA-decided, TASK-005 § Questions 4).
const PAID = "จ่ายไปแล้ว";
const TIER_ICON: Icon[] = [IconCpu, IconCpu, IconServer, IconServerBolt];
/** The payback classes (lib/lab/plan.ts: ≤ 2 years, ≤ 4 years, longer) as tones; the bar's position on the year scale and
 * its own years say the same, so the colour is never the only cue. */
const PAY: Record<PayClass, Tone> = { pay: "ok", meh: "review", nopay: "bad", "": "mute" };
const ROLE: Record<string, Icon> = { done: IconCircleCheck, todo: IconFlask, hold: IconUsers };
const YEARS = 120; // the payback scale, in months (monthText says "เกิน 10 ปี" past 120)

export function Plan({ tiers, meta, page }: { tiers: Tier[]; meta: Meta; page: Pick<Page, "plan" | "spec"> }) {
  const [hours, setHours] = useState(8);
  const [days, setDays] = useState(22);
  const { plan, spec } = page;
  const rates: Rates = { usdThb: meta.usdThb, kwhThb: plan.kwhThb };
  const buyable = tiers.filter((t) => t.buy);
  return (
    <>
      <Grow />
      <header className="cv-head" id="plan">
        <div className="run">{plan.kicker}</div>
        <h1 className="as-h2">{plan.title}</h1>
        <Fold text={plan.lead} />
      </header>

      <section className="cv-readout" aria-labelledby="pay-h">
        <h2 id="pay-h" className="as-h3">
          ซื้อแล้วคืนทุนใน
        </h2>
        <div className="cv-ctrl">
          <div className="use-item">
            <span>ใช้วันละ</span>
            {/* aria-valuetext: a screen reader hears "8 ชม.", the words beside the slider, not a bare "8" (critique A, P2-2). */}
            <Slider value={hours} onChange={setHours} min={2} max={24} step={1} label={null} thumbLabel="ใช้วันละ"
              thumbProps={{ "aria-valuetext": `${hours} ชม.` }}
              classNames={{ root: "hrs", trackContainer: "hrs-hit", track: "hrs-track", bar: "hrs-bar", thumb: "hrs-thumb" }} />
            <b className="num">{`${hours} ชม.`}</b>
          </div>
          <div className="use-item">
            <span>เดือนละ</span>
            <SegmentedControl value={String(days)} onChange={(v) => setDays(Number(v))} aria-label="เดือนละ"
              data={[{ value: "22", label: "22 วัน" }, { value: "30", label: "30 วัน" }]}
              classNames={{ root: "seg", indicator: "seg-ind", label: "seg-label", control: "seg-ctl" }} />
          </div>
        </div>
        <Bars
          aria={buyable.map((t) => `${t.name} ${tierMoney(t, hours, days, rates).monthText}`).join("; ")}
          max={YEARS}
          marks={[24 / YEARS, 48 / YEARS]}
          markLabel={W.payMark}
          ticks={[[0, "0"], [24, "2 ปี"], [48, "4 ปี"], [YEARS, "10 ปี"]]}
          rows={buyable.map((t) => {
            const m = tierMoney(t, hours, days, rates);
            return {
              name: `${t.id.replace("T", "ชั้น ")} · ${t.mem} GB`,
              value: m.months === null ? 0 : Math.min(m.months, YEARS),
              text: m.monthText,
              tone: PAY[m.cls],
            };
          })}
        />
        {/* A live region: the sentence the controls change is read out when it changes. */}
        <p className="cv-say" aria-live="polite">
          <IconBulb size={20} stroke={1.75} aria-hidden="true" />
          <span>{planSay(tiers, hours, days, rates, plan.paybackSayFast, plan.paybackSaySlow)}</span>
        </p>
        <Fold text={plan.rateNote} className="mute" />
        <div className="cv-stat">
          <span className="cv-k">{PAID}</span>
          <Gauge
            value={meta.spentUsd}
            max={meta.capUsd}
            big={`$${meta.spentUsd.toFixed(2)}`}
            caption={`$${meta.spentUsd.toFixed(2)} จากเพดาน $${meta.capUsd} ต่อเดือน`}
            aria={`${PAID} $${meta.spentUsd.toFixed(2)} จากเพดาน $${meta.capUsd} ต่อเดือน`}
          />
        </div>
      </section>

      <details className="vz-fold cv-spec">
        <summary>
          <h2 className="as-h3 vz-lead">{spec.title}</h2>
          <IconChevronDown className="vz-chev" size={20} stroke={1.75} aria-hidden="true" />
        </summary>
        <div className="vz-fold-body">
          <dl className="cv-dl">
            {spec.rows.map(([k, v]) => (
              <Fragment key={k}>
                <dt>{k}</dt>
                <dd>
                  {k === PAID ? (
                    <>
                      <span className="num">{`$${meta.spentUsd.toFixed(2)}`}</span>
                      {` จากเพดาน $${meta.capUsd} ต่อเดือน`}
                    </>
                  ) : (
                    v
                  )}
                </dd>
              </Fragment>
            ))}
          </dl>
        </div>
      </details>

      <div className="cv-grid2 cv-tiers">
        {tiers.map((t, i) => (
          <TierCard key={t.id} t={t} I={TIER_ICON[i] ?? IconServer} hours={hours} days={days} rates={rates} />
        ))}
      </div>

      <section className="cv-sec" aria-labelledby="next-h">
        <h2 id="next-h">{plan.nextTitle}</h2>
        <Timeline
          label={plan.nextTitle}
          items={plan.next.map((s) => ({
            key: s.kicker,
            when: s.kicker,
            icon: stepIcon(tiers, s.kicker),
            title: s.title,
            body: (
              <>
                <Fold text={s.body} />
                <span className="mute">{s.cost}</span>
              </>
            ),
          }))}
        />
      </section>

      <ul className="cv-caveat">
        {plan.caveats.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <Fold text={plan.sources} className="mute" />
    </>
  );
}

/** TASK-072 R3 (TEST-012 DEF-3: text-only phone screens in a row): a next step names its tier ("ขั้น A · ชั้น 2"), so its
 * timeline node shows that tier card's own icon (the same one as the card's head above); no match → the plain dot. */
function stepIcon(tiers: Tier[], kicker: string) {
  const tier = kicker.match(/ชั้น \d+/)?.[0];
  const i = tier ? tiers.findIndex((t) => t.name.startsWith(tier)) : -1;
  if (i < 0) return undefined;
  const I = tiers[i].now ? IconMapPin : (TIER_ICON[i] ?? IconServer);
  return <I stroke={1.75} />;
}

/** A list of pack items, always as bullets: the first open, the others behind a "+n" disclosure. */
function ListFold({ items }: { items: string[] }) {
  const [first, ...rest] = items;
  if (first === undefined) return null;
  return (
    <>
      <ul>
        <li>{first}</li>
      </ul>
      {rest.length > 0 && (
        <details className="vz-fold cv-more">
          <summary>
            <span className="vz-lead num">{`+${rest.length}`}</span>
            <IconChevronDown className="vz-chev" size={20} stroke={1.75} aria-hidden="true" />
          </summary>
          <div className="vz-fold-body">
            <ul>
              {rest.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </>
  );
}

/** A tier as an icon card: the old TierCard's fields, the memory bar labelled with its value, the power bill drawn
 * against the rent it would replace (the rent is the track), the roles as chips with icons, the buy and model lists as
 * bullets with the rest folded, the note folded under its lead. "Now" is the signal tone and a pin, not a verdict
 * colour. */
function TierCard({ t, I, hours, days, rates }: { t: Tier; I: Icon; hours: number; days: number; rates: Rates }) {
  const m = tierMoney(t, hours, days, rates);
  const pay = PAY[m.cls];
  const Head = t.now ? IconMapPin : I;
  return (
    <article className={`cv-card cv-tier${t.now ? " now" : ""}${t.ref ? " ref" : ""}`}>
      <div className="cv-card-head">
        <IconBox>
          <Head stroke={1.75} />
        </IconBox>
        <span>
          <h2 className="as-h3">{t.name}</h2>
          <span className="mute">{t.budget}</span>
        </span>
      </div>
      {t.now && <span className="cv-now">เราอยู่ตรงนี้</span>}
      <div className="cv-stat">
        <span className="cv-k">{`หน่วยความจำ ${t.mem} GB · โมเดลที่ลง`}</span>
        <Bars aria={`โมเดลหลักใช้ ${t.use} จาก ${t.mem} GB`} max={t.mem} rows={[{ name: "", value: t.use, text: `${t.use} / ${t.mem} GB` }]} />
        <ListFold items={t.models} />
      </div>
      <div className="cv-stat">
        <span className="cv-k">ซื้ออะไร</span>
        <ListFold items={t.machine} />
      </div>
      <div className="cv-stat">
        <span className="cv-k">ทำงานตำแหน่งไหน</span>
        <div className="cv-roles">
          {t.roles.map(([r, s]) => {
            const R = ROLE[s] ?? IconFlask;
            return (
              <span key={r} className={`cv-role ${s}`}>
                <R size={16} stroke={1.75} aria-hidden="true" />
                {`${r}${s === "todo" ? " · ต้องลอง" : s === "hold" ? " · ยังต้องมีคน" : ""}`}
              </span>
            );
          })}
        </div>
      </div>
      <div className="cv-stat">
        <span className="cv-k">{`เงินต่อเดือน ที่ ${hours} ชม. × ${days} วัน`}</span>
        <p className="cv-kv">
          <span>{`${t.rentName} ($${t.rentUsd}/ชม.)`}</span>
          <b className="num">{baht(m.rent)}</b>
        </p>
        {m.power !== null && (
          <Bars
            aria={`ค่าไฟถ้าซื้อเอง ${baht(m.power)}; ${t.rentName} ${baht(m.rent)}`}
            max={m.rent}
            rows={[{ name: `ค่าไฟถ้าซื้อเอง (~${t.watt} W)`, value: m.power, text: baht(m.power) }]}
          />
        )}
        {t.buy ? (
          <p className={`cv-paid ${pay}`}>
            <span>ซื้อแล้วคืนทุนใน</span>
            <b className="num">{m.monthText}</b>
          </p>
        ) : null}
      </div>
      <Fold text={t.note} className="mute" />
    </article>
  );
}
