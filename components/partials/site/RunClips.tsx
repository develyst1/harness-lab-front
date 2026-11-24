"use client";

import { useCallback, useMemo, useState } from "react";
import { Clips } from "@/components/partials/lab/Clips";
import { clipFailed, clipTabs, clipView, initialClip, selectTab, setSpeed } from "@/lib/lab/clips";
import type { Page, Run } from "@/lib/lab/types";

/** Today's player (Clips.tsx) and its state (lib/lab/clips.ts) over the given runs: all of them on /clips (opening on
 * R4a's first clip, as the one-page site did), one on a run's คลิป tab. A run with no clip shows the player's own
 * "no clip yet" line. */
export function RunClips({ runs, clips, titleAs }: { runs: Run[]; clips: Page["clips"]; titleAs?: "h1" | "h2" }) {
  const tabs = useMemo(() => clipTabs(runs), [runs]);
  const [clip, setClip] = useState(() => initialClip(runs));
  const failed = useCallback((key: string) => setClip((s) => clipFailed(s, key)), []);
  return (
    <Clips
      tabs={tabs}
      view={clipView(runs, clip, clips.noClip)}
      clips={clips}
      onSelect={(key) => setClip((s) => selectTab(runs, s, key))}
      onSpeed={(rate) => setClip((s) => setSpeed(s, rate))}
      onFailed={failed}
      titleAs={titleAs}
    />
  );
}
