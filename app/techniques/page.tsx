import type { Metadata } from "next";
import { TechniquesRoute } from "@/components/partials/site/routes";
import { areaLabel, pageTitle } from "@/components/partials/site/words";

// /techniques (SPEC-012 § Site map): the เทคนิค section, grouped by group. Read the back on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: pageTitle(areaLabel("techniques")) };

export default function Page() {
  return <TechniquesRoute />;
}
