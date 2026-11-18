"use client";

import { Fragment, useState } from "react";
import { SegmentedControl, Slider } from "@mantine/core";
import { baht, planSay, tierMoney, type Rates } from "@/lib/lab/plan";
import type { Meta, Page, Tier } from "@/lib/lab/types";

// สเปกและงบ: layout of reference/index.html lines 280–325, tiers after its script at lines 611–667. Text from page.json →
// plan / spec; "จ่ายไปแล้ว" from meta.json (SPEC-001 § Pack v2). Words inside the controls and the tier cards are the
// reference's own labels (SA-decided, TASK-005 § Questions 4).
const PAID = "จ่ายไปแล้ว";

export function Plan({ tiers, meta, page }: { tiers: Tier[]; meta: Meta; page: Page }) {
  const [hours, setHours] = useState(8);
  const [days, setDays] = useState(22);
  const { plan, spec } = page;
  const rates: Rates = { usdThb: meta.usdThb, kwhThb: plan.kwhThb };
  return (
    <section id="plan">
      <div className="run">{plan.kicker}</div>
      <h2>{plan.title}</h2>
      <p>{plan.lead}</p>

      <div className="spec">
        <h3>{spec.title}</h3>
        <dl>
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

      <div className="use">
        <div className="use-item">
          <span>ใช้วันละ</span>
          <Slider value={hours} onChange={setHours} min={2} max={24} step={1} label={null} thumbLabel="ใช้วันละ"
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
      <p className="rate">{plan.rateNote}</p>

      <div className="ladder">
        {tiers.map((t) => (
          <TierCard key={t.id} t={t} hours={hours} days={days} rates={rates} />
        ))}
      </div>
      <p className="proved">{planSay(tiers, hours, days, rates, plan.paybackSayFast, plan.paybackSaySlow)}</p>

      <h3>{plan.nextTitle}</h3>
      <div className="steps">
        {plan.next.map((s) => (
          <div key={s.kicker}>
            <span className="run">{s.kicker}</span>
            <b>{s.title}</b>
            <span>{s.body}</span>
            <span className="mute">{s.cost}</span>
          </div>
        ))}
      </div>
      <ul className="caveat">
        {plan.caveats.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <p className="mute" style={{ fontSize: 13 }}>
        {plan.sources}
      </p>
    </section>
  );
}

function TierCard({ t, hours, days, rates }: { t: Tier; hours: number; days: number; rates: Rates }) {
  const m = tierMoney(t, hours, days, rates);
  return (
    <article className={`tier${t.now ? " now" : ""}${t.ref ? " ref" : ""}`}>
      <div className="head">
        <h3>{t.name}</h3>
        <span className="budget">{t.budget}</span>
        {t.now && <span className="pill ok">เราอยู่ตรงนี้</span>}
      </div>
      <div className="box">
        <span className="lab">ซื้ออะไร</span>
        <ul>
          {t.machine.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <span className="lab">{`หน่วยความจำ ${t.mem} GB · โมเดลที่ลง`}</span>
        <div className="memo" role="img" aria-label={`โมเดลหลักใช้ ${t.use} จาก ${t.mem} GB`}>
          <i style={{ width: `${m.mem}%` }} />
        </div>
        <ul>
          {t.models.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <span className="lab">ทำงานตำแหน่งไหน</span>
        <div className="roles">
          {t.roles.map(([r, s]) => (
            <span key={r} className={`role ${s}`}>
              {`${s === "done" ? "✓ " : ""}${r}${s === "todo" ? " · ต้องลอง" : s === "hold" ? " · ยังต้องมีคน" : ""}`}
            </span>
          ))}
        </div>
      </div>
      <div className="money">
        <span className="lab" style={{ gridColumn: "1 / -1" }}>{`เงินต่อเดือน ที่ ${hours} ชม. × ${days} วัน`}</span>
        <span>{`${t.rentName} ($${t.rentUsd}/ชม.)`}</span>
        <span className="v">{baht(m.rent)}</span>
        {m.power !== null && (
          <>
            <span>{`ค่าไฟถ้าซื้อเอง (~${t.watt} W)`}</span>
            <span className="v">{baht(m.power)}</span>
          </>
        )}
        {t.buy ? (
          <>
            <span className="sep" />
            <span>ซื้อแล้วคืนทุนใน</span>
            <span className={`v ${m.cls}`}>{m.monthText}</span>
          </>
        ) : null}
      </div>
      <p className="note">{t.note}</p>
    </article>
  );
}
