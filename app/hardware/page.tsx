import type { Metadata } from "next";
import { HardwareRoute } from "@/components/partials/site/routes";
import { areaLabel, pageTitle } from "@/components/partials/site/words";

// /hardware (SPEC-012 § Site map): today's สเปกและงบ (the tiers, buy against rent). Read the back on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: pageTitle(areaLabel("hardware")) };

export default function Page() {
  return <HardwareRoute />;
}
