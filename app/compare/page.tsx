import type { Metadata } from "next";
import { CompareRoute } from "@/components/partials/site/routes";
import { areaLabel, pageTitle } from "@/components/partials/site/words";

// /compare (SPEC-012 § Site map): today's เทียบเอง; its pick stays in component state (D1). Read the back per request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: pageTitle(areaLabel("compare")) };

export default function Page() {
  return <CompareRoute />;
}
