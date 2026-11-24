"use client";

import { useEffect, useRef } from "react";
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
      <div className="player">
        {tabs.length > 0 && (
          <div className="tabs" role="tablist" aria-label="เลือกคลิป">
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
                {t.label}
              </button>
            ))}
          </div>
        )}
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
      </div>
      <p className="mute" style={{ fontSize: 14 }}>
        {clips.note}
      </p>
    </section>
  );
}
