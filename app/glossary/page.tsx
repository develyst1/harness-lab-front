import type { Metadata } from "next";
import { GlossaryRoute } from "@/components/partials/site/routes";
import { areaLabel, pageTitle } from "@/components/partials/site/words";

// /glossary (SPEC-012 § Site map, D5): every glossary entry, each anchored term-<n>; `?q=` searches it (REQ-012,
// TASK-055). Read the back on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: pageTitle(areaLabel("glossary")) };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <GlossaryRoute searchParams={searchParams} />;
}
