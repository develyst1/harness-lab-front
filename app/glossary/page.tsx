import type { Metadata } from "next";
import { GlossaryRoute } from "@/components/partials/site/routes";
import { areaLabel, pageTitle } from "@/components/partials/site/words";

// /glossary (SPEC-012 § Site map, D5): every glossary entry, each anchored term-<n>. Read the back on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: pageTitle(areaLabel("glossary")) };

export default function Page() {
  return <GlossaryRoute />;
}
