import type { Item, Run } from "./types";

// ดูคลิป's state, as pure decisions (TASK-010, TASK-012). A tab is an item that names a `video`; it plays that clip from
// the front's own path /clips/<video> (SPEC-002), and if the clip fails to load the tab shows page.json → clips.noClip.
// A card whose row has no such item has no tab: the selection is then the row itself, and the panel says REQ-001's
// "ยังไม่มีคลิปของการทดลองนี้" for that row — never another row's clip. The speed and the play asks follow the reference
// script's `rate` and `pick(id, play)`.

/** REQ-001 § User-facing wording: a row (or item) with no clip. */
export const NO_CLIP_YET = "ยังไม่มีคลิปของการทดลองนี้";

/** The reference's speed buttons (`#speed`). */
export const SPEEDS = [0.5, 1, 1.5] as const;

export interface ClipTab {
  key: string;
  row: Run;
  item: Item;
  label: string;
}

export interface ClipState {
  /** Always a row; a tab of it when it has one. */
  rowId: string;
  tabKey: string | null;
  /** The chosen speed; it stays when the tab changes. */
  rate: number;
  /** Counts the visitor's asks to play (a tab or a card press); each new ask starts the clip. 0 = page load. */
  plays: number;
  /** Tabs whose clip failed to load. */
  failed: string[];
}

/** What the panel shows. `src` is set only when a clip can play; otherwise `message` says why. */
export interface ClipView {
  selectedKey: string | null;
  rowLine: string | null;
  src: string | null;
  message: string | null;
  watch?: string;
  labelledBy?: string;
  rate: number;
  plays: number;
}

const rowLabel = (r: Run) => `${r.id} · ${r.model} ${r.quant}`;

/** One tab per item that names a `video`, pack order; a row with several items adds the item label. */
export function clipTabs(runs: Run[]): ClipTab[] {
  return runs.flatMap((row) =>
    row.items
      .filter((item) => item.video)
      .map((item) => ({
        key: `${row.id}-${item.item}`,
        row,
        item,
        label: `${rowLabel(row)}${row.items.length > 1 ? ` · ${item.label}` : ""}`,
      })),
  );
}

/** On load: R4a's first tab, loaded but not played (reference `pick("R4a", false)`); else the first tab; else R4a's row. */
export function initialClip(runs: Run[]): ClipState {
  const tabs = clipTabs(runs);
  const tab = tabs.find((t) => t.row.id === "R4a") ?? tabs[0];
  const at = tab
    ? { rowId: tab.row.id, tabKey: tab.key }
    : { rowId: (runs.find((r) => r.id === "R4a") ?? runs[0])?.id ?? "", tabKey: null };
  return { ...at, rate: 1, plays: 0, failed: [] };
}

/** "▶ ดูคลิป" on a card: that row's first tab, or the row alone when it has no clip; and play. */
export function playRow(runs: Run[], state: ClipState, rowId: string): ClipState {
  const tabKey = clipTabs(runs).find((t) => t.row.id === rowId)?.key ?? null;
  return { ...state, rowId, tabKey, plays: state.plays + 1 };
}

/** A tab pressed: select it and play. */
export function selectTab(runs: Run[], state: ClipState, key: string): ClipState {
  const rowId = clipTabs(runs).find((t) => t.key === key)?.row.id ?? "";
  return { ...state, rowId, tabKey: key, plays: state.plays + 1 };
}

/** A speed button pressed. */
export function setSpeed(state: ClipState, rate: number): ClipState {
  return { ...state, rate };
}

/** The tab's clip did not load (the video's `error`). */
export function clipFailed(state: ClipState, key: string): ClipState {
  return state.failed.includes(key) ? state : { ...state, failed: [...state.failed, key] };
}

export function clipView(runs: Run[], state: ClipState, noClip: string): ClipView {
  const { rate, plays } = state;
  if (state.tabKey) {
    const tabs = clipTabs(runs);
    const tab = tabs.find((t) => t.key === state.tabKey) ?? tabs[0];
    if (tab) {
      const failed = state.failed.includes(tab.key);
      return {
        selectedKey: tab.key,
        rowLine: null,
        src: failed ? null : `/clips/${encodeURIComponent(tab.item.video ?? "")}`,
        message: failed ? noClip : null,
        watch: tab.row.watch,
        labelledBy: `t-${tab.key}`,
        rate,
        plays,
      };
    }
  }
  const row = runs.find((r) => r.id === state.rowId);
  return {
    selectedKey: null,
    rowLine: row ? rowLabel(row) : null,
    src: null,
    message: NO_CLIP_YET,
    watch: row?.watch,
    labelledBy: row ? "clip-row" : undefined,
    rate,
    plays,
  };
}
