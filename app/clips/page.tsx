import type { Metadata } from "next";
import { ClipsRoute } from "@/components/partials/site/routes";
import { AREAS } from "@/components/partials/site/words";

// /clips (SPEC-012 § Site map): today's player over every run. The clip files themselves stay at /clips/<file>
// (app/clips/[file]/route.ts). Read the back on every request.
export const dynamic = "force-dynamic";

const clipsLabel = AREAS.find((a) => a.key === "clips")?.label ?? "";
export const metadata: Metadata = { title: `${clipsLabel} · Harness Lab` };

export default function Page() {
  return <ClipsRoute />;
}
