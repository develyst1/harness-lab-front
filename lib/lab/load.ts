import { cache } from "react";
import type { LabData } from "./types";

// The back's one document, for every page (SPEC-012 § Conventions; moved from app/page.tsx unchanged by TASK-042).
// Read on every request: a new pack shows without a rebuild (SPEC-001 § How the page gets its data). `cache` makes a
// layout and its page share one fetch per request.

const isObject = (v: unknown): v is object => typeof v === "object" && v !== null && !Array.isArray(v);

/** Pack v3 on: runs, tiers and techniques arrays, meta and page objects — all five required (SPEC-003 § Contract). */
export const isLabData = (d: unknown): d is LabData =>
  isObject(d) &&
  Array.isArray((d as LabData).runs) &&
  Array.isArray((d as LabData).tiers) &&
  isObject((d as LabData).meta) &&
  isObject((d as LabData).page) &&
  Array.isArray((d as LabData).techniques);

export const loadLab = cache(async (): Promise<LabData | null> => {
  const backUrl = process.env.BACK_URL || "http://127.0.0.1:4101";
  try {
    const res = await fetch(`${backUrl}/api/lab`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`GET /api/lab answered ${res.status}`);
    const body: unknown = await res.json();
    if (!isLabData(body)) throw new Error("GET /api/lab body lacks runs/tiers/techniques arrays or meta/page objects");
    // pack v3.9: `meeting` is optional (SPEC-011 § Contract 3); anything but an object is no section.
    const meeting = isObject(body.meeting) ? body.meeting : null;
    return { runs: body.runs, tiers: body.tiers, meta: body.meta, page: body.page, techniques: body.techniques, meeting };
  } catch (err) {
    // The cause goes to the server log only; the visitor gets the load-error wording (REQ-001 AC-10).
    console.error("[harness-lab] could not load the experiment data:", err);
    return null;
  }
});
