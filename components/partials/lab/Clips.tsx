"use client";

import { IconPlayerPlay, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { Pill } from "@/components/partials/site/RunBits";
import { SPEEDS, type ClipTab, type ClipView } from "@/lib/lab/clips";
import type { Page } from "@/lib/lab/types";

// ดูคลิป: the reference's player — tabs, the video, the speed buttons, the row's "ดูอะไร" text. What the panel shows comes
// from lib/lab/clips.ts: a tab plays its clip from /clips/<video> (TASK-012); a clip that fails to load shows
// page.json → clips.noClip; a card whose row has no clip names that row with "ยังไม่มีคลิปของการทดลองนี้" (TASK-010).

/** `watch` may hold <b>; render only that, never as HTML. */
function boldOnly(text: string) {
  return text
    .split(/(<b>.*?<\/b>)/)
    .map((part, i) => (part.startsWith("<b>") && part.endsWith("</b>") ? <b key={i}>{part.slice(3, -4)}</b> : part));
}

export function Clips({ tabs, view, clips, onSelect, onSpeed, onFailed, titleAs: Title = "h2" }: {
  tabs: ClipTab[];
  view: ClipView;
  clips: Page["clips"];
  onSelect: (key: string) => void;
  onSpeed: (rate: number) => void;
  onFailed: (key: string) => void;
  /** SPEC-012 D11: "h1" where the player is the page (/clips); it keeps the h2 look. */
  titleAs?: "h1" | "h2";
}) {
  const video = useRef<HTMLVideoElement>(null);
  const { src, selectedKey, rate, plays } = view;

  // A speed press applies at once; a newly loaded clip gets it on loadedmetadata (the reference does both).
  useEffect(() => {
    if (video.current) video.current.playbackRate = rate;
  }, [rate]);

  // A tab or card press plays (reference `pick(id, true)`); the page load does not (plays = 0).
  useEffect(() => {
    if (plays > 0) video.current?.play().catch(() => {});
  }, [plays]);

  // The first clip is in the server HTML, so it can fail before onError is attached: read the element once mounted.
  useEffect(() => {
    if (selectedKey && video.current?.error) onFailed(selectedKey);
  }, [src, selectedKey, onFailed]);

  return (
    <section id="clips">
      <div className="run">{clips.kicker}</div>
      <Title className={Title === "h1" ? "as-h2" : undefined}>{clips.title}</Title>
      {/* TASK-057 (SPEC-013 row 6): the player first, so it is in a phone's first screen; the clip list follows as icon
          rows (beside the player at ≥ 900 px). The DOM order is the visual order, so the keyboard meets them the same way. */}
      <div className={`player${tabs.length > 1 ? " with-list" : ""}`}>
        <div id="clip-panel" role="tabpanel" aria-labelledby={view.labelledBy} className="clip-panel">
          {view.rowLine && (
            <p className="clip-row" id="clip-row">
              {view.rowLine}
            </p>
          )}
          {src && selectedKey ? (
            <>
              <video
                ref={video}
                controls
                muted
                playsInline
                preload="metadata"
                src={src}
                onLoadedMetadata={(e) => {
                  e.currentTarget.playbackRate = rate;
                }}
                onError={() => onFailed(selectedKey)}
              />
              <div className="ctrl">
                <span className="mute" id="speed-label">
                  ความเร็ว
                </span>
                <span className="speed" role="group" aria-labelledby="speed-label">
                  {SPEEDS.map((r) => (
                    <button key={r} type="button" aria-pressed={r === rate} onClick={() => onSpeed(r)}>
                      {r}×
                    </button>
                  ))}
                </span>
              </div>
            </>
          ) : (
            view.message && <p className="noclip">{view.message}</p>
          )}
          {view.watch && <p className="watch">{boldOnly(view.watch)}</p>}
        </div>
        {tabs.length > 0 && (
          <div className="tabs clip-list" role="tablist" aria-label="เลือกคลิป" aria-orientation="vertical">
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={`t-${t.key}`}
                aria-selected={t.key === selectedKey}
                aria-controls="clip-panel"
                onClick={() => onSelect(t.key)}
              >
                {t.key === selectedKey ? (
                  <IconPlayerPlayFilled size={18} aria-hidden="true" />
                ) : (
                  <IconPlayerPlay size={18} stroke={1.75} aria-hidden="true" />
                )}
                {/* TASK-072 R4 (DEF-4, the owner): the title takes the row's whole width, at most 2 lines then "…" (the
                    whole title stays in the DOM and in `title`), and the run's verdict pill sits under it, as ประวัติ
                    shows it, so a viewer knows what a clip will show before pressing it (critique A, P1). */}
                <span className="clip-t">
                  <span className="clip-name" title={t.label}>{t.label}</span>
                  <Pill run={t.row} />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="mute" style={{ fontSize: 14 }}>
        {clips.note}
      </p>
    </section>
  );
}
