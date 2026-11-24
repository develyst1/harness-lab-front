import type { Metadata } from "next";
import { StudiesRoute } from "@/components/partials/site/routes";
import { areaLabel, pageTitle } from "@/components/partials/site/words";

// /studies (SPEC-012 § Site map): studies that are not rents (R-M1). Read the back on every request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: pageTitle(areaLabel("studies")) };

export default function Page() {
  return <StudiesRoute />;
}
