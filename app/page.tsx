import { HomeRoute } from "@/components/partials/site/routes";
import { OldAnchors } from "@/components/partials/site/OldAnchors";

// The home (SPEC-012 § Site map; TASK-046). Read the back on every request: a new pack shows without a rebuild
// (SPEC-001 § How the page gets its data). OldAnchors sends an old one-page link (`/#history`, …) to its new page, with
// or without the back.
export const dynamic = "force-dynamic";

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return (
    <>
      <OldAnchors />
      <HomeRoute searchParams={searchParams} />
    </>
  );
}
