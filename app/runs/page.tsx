import type { Metadata } from "next";
import { RunsRoute } from "@/components/partials/site/routes";
import { W } from "@/components/partials/site/words";

// /runs (SPEC-012 § Site map, D2): every run, newest first or by cost (?sort=). Read the back on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: `${W.allRuns} · Harness Lab` };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <RunsRoute searchParams={searchParams} />;
}
