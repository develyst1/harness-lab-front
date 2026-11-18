import { LabContent, Nav } from "@/components/partials/lab";
import type { LabData } from "@/lib/lab/types";
import { toView } from "@/lib/lab/view";

// Read the back on every request: a new pack shows without a rebuild (SPEC-001 § How the page gets its data).
export const dynamic = "force-dynamic";

const isObject = (v: unknown): v is object => typeof v === "object" && v !== null && !Array.isArray(v);

// Pack v2 on: runs and tiers arrays, meta and page objects — all four required (SPEC-001 § Pack v2).
const isLabData = (d: unknown): d is LabData =>
  isObject(d) &&
  Array.isArray((d as LabData).runs) &&
  Array.isArray((d as LabData).tiers) &&
  isObject((d as LabData).meta) &&
  isObject((d as LabData).page);

async function loadLab(): Promise<LabData | null> {
  const backUrl = process.env.BACK_URL || "http://127.0.0.1:4101";
  try {
    const res = await fetch(`${backUrl}/api/lab`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`GET /api/lab answered ${res.status}`);
    const body: unknown = await res.json();
    if (!isLabData(body)) throw new Error("GET /api/lab body lacks runs/tiers arrays or meta/page objects");
    return { runs: body.runs, tiers: body.tiers, meta: body.meta, page: body.page };
  } catch (err) {
    // The cause goes to the server log only; the visitor gets the load-error wording (REQ-001 AC-10).
    console.error("[harness-lab] could not load the experiment data:", err);
    return null;
  }
}

export default async function Page() {
  const lab = await loadLab();
  if (!lab) {
    return (
      <>
        <Nav brandOnly />
        <main className="wrap">
          <p role="alert">โหลดข้อมูลการทดลองไม่ได้ ลองรีเฟรชอีกครั้ง</p>
        </main>
      </>
    );
  }
  // Only the fields the page shows reach the browser: every prop of a client component is serialised into the HTML.
  const view = toView(lab);
  return <LabContent runs={view.runs} tiers={view.tiers} meta={view.meta} page={view.page} />;
}
